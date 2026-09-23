import re
from datetime import datetime
from typing import Dict, Any, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.models import LostItem, FoundItem, Match, MatchStatus, LostItemStatus, FoundItemStatus, Notification, AuditLog

def clean_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return " ".join(text.split())

def calculate_text_similarity(str1: str, str2: str) -> float:
    t1 = clean_text(str1)
    t2 = clean_text(str2)
    if not t1 or not t2:
        return 0.0
    if t1 == t2:
        return 1.0
    
    # Token set overlap bonus
    tokens1 = set(t1.split())
    tokens2 = set(t2.split())
    if not tokens1 or not tokens2:
        return 0.0
    overlap = len(tokens1.intersection(tokens2)) / max(len(tokens1), len(tokens2))
    
    try:
        vectorizer = TfidfVectorizer().fit_transform([t1, t2])
        vectors = vectorizer.toarray()
        cosine_sim = float(cosine_similarity(vectors[0:1], vectors[1:2])[0][0])
        # Blend cosine similarity with token overlap
        return round(min(1.0, (cosine_sim * 0.7) + (overlap * 0.3)), 2)
    except Exception:
        return round(overlap, 2)

def calculate_date_proximity(date_str1: str, date_str2: str) -> float:
    try:
        d1 = datetime.strptime(date_str1, "%Y-%m-%d")
        d2 = datetime.strptime(date_str2, "%Y-%m-%d")
        diff_days = abs((d1 - d2).days)
        if diff_days == 0:
            return 1.0
        elif diff_days <= 1:
            return 0.9
        elif diff_days <= 3:
            return 0.75
        elif diff_days <= 7:
            return 0.5
        elif diff_days <= 14:
            return 0.25
        else:
            return 0.1
    except Exception:
        return 0.5 # Default fallback

class MatchingService:
    @staticmethod
    def compare_items(lost: LostItem, found: FoundItem) -> Dict[str, Any]:
        # 1. Category (Weight 0.25)
        cat_score = 1.0 if clean_text(lost.category) == clean_text(found.category) else 0.0
        
        # 2. Location (Weight 0.20)
        loc_score = 1.0 if clean_text(lost.location) == clean_text(found.location) else calculate_text_similarity(lost.location, found.location)
        
        # 3. Brand (Weight 0.15)
        if lost.brand and found.brand:
            brand_score = 1.0 if clean_text(lost.brand) == clean_text(found.brand) else calculate_text_similarity(lost.brand, found.brand)
        else:
            brand_score = 0.5 # Neutral if not specified
            
        # 4. Color (Weight 0.10)
        if lost.color and found.color:
            color_score = 1.0 if clean_text(lost.color) == clean_text(found.color) else 0.0
        else:
            color_score = 0.5 # Neutral
            
        # 5. Description (Weight 0.20)
        desc_text1 = f"{lost.title} {lost.description}"
        desc_text2 = f"{found.title} {found.description}"
        desc_score = calculate_text_similarity(desc_text1, desc_text2)
        
        # 6. Date Proximity (Weight 0.10)
        date_score = calculate_date_proximity(lost.date_lost, found.date_found)

        # Weighted calculation
        overall_score = (
            (cat_score * 0.25) +
            (loc_score * 0.20) +
            (brand_score * 0.15) +
            (color_score * 0.10) +
            (desc_score * 0.20) +
            (date_score * 0.10)
        )
        
        overall_score = round(overall_score, 2)
        
        signals = {
            "category": round(cat_score, 2),
            "location": round(loc_score, 2),
            "brand": round(brand_score, 2),
            "color": round(color_score, 2),
            "description": round(desc_score, 2),
            "date": round(date_score, 2)
        }
        
        return {
            "overall_score": overall_score,
            "signals": signals
        }

    @staticmethod
    def run_matching_for_all(db: Session, min_score_threshold: float = 0.40) -> List[Match]:
        active_lost = db.query(LostItem).filter(
            LostItem.status.in_([LostItemStatus.ACTIVE_SEARCH, LostItemStatus.POSSIBLE_MATCH])
        ).all()
        
        found_items = db.query(FoundItem).filter(
            FoundItem.status.in_([FoundItemStatus.RECEIVED_BY_ADMIN, FoundItemStatus.POSSIBLE_MATCH])
        ).all()

        
        new_matches = []
        for lost in active_lost:
            for found in found_items:
                res = MatchingService.compare_items(lost, found)
                score = res["overall_score"]
                
                if score >= min_score_threshold:
                    # Check if match record already exists
                    existing_match = db.query(Match).filter(
                        Match.lost_item_id == lost.id,
                        Match.found_item_id == found.id
                    ).first()
                    
                    if existing_match:
                        existing_match.score = score
                        existing_match.signals_json = res["signals"]
                        db.add(existing_match)
                    else:
                        match = Match(
                            lost_item_id=lost.id,
                            found_item_id=found.id,
                            score=score,
                            signals_json=res["signals"],
                            status=MatchStatus.PENDING
                        )
                        db.add(match)
                        db.flush()
                        new_matches.append(match)
                        
                        # Update item statuses to POSSIBLE_MATCH if high confidence
                        if score >= 0.70:
                            if lost.status == LostItemStatus.ACTIVE_SEARCH:
                                lost.status = LostItemStatus.POSSIBLE_MATCH
                            if found.status in [FoundItemStatus.HANDOVER_PENDING, FoundItemStatus.RECEIVED_BY_ADMIN]:
                                found.status = FoundItemStatus.POSSIBLE_MATCH
                            
                            # Notify lost item reporter
                            notif = Notification(
                                user_id=lost.reporter_id,
                                title="Possible Item Match Detected",
                                message=f"We found a potential match ({int(score*100)}% confidence) for your lost item '{lost.title}'. Case ID: {lost.case_id}",
                                type="MATCH_FOUND",
                                case_id=lost.case_id
                            )
                            db.add(notif)
                            
        db.commit()
        return new_matches
