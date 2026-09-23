from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.db.database import get_db
from app.models import Match, MatchStatus, LostItem, FoundItem, User, UserRole, LostItemStatus, FoundItemStatus, AuditLog, Notification
from app.schemas import MatchResponse, LostItemResponse, FoundItemResponse
from app.services.matching_service import MatchingService

router = APIRouter(prefix="/matches", tags=["Matches"])

@router.post("/run", response_model=List[MatchResponse])
def trigger_matching(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    matches = MatchingService.run_matching_for_all(db)
    return get_matches(db=db, current_user=current_admin)

@router.get("", response_model=List[MatchResponse])
def get_matches(
    min_score: float = 0.30,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Match).filter(Match.score >= min_score)
    if status_filter:
        query = query.filter(Match.status == status_filter)

    # If student, only show matches involving their lost or found items
    if current_user.role == UserRole.STUDENT:
        user_lost_ids = [l.id for l in db.query(LostItem.id).filter(LostItem.reporter_id == current_user.id).all()]
        user_found_ids = [f.id for f in db.query(FoundItem.id).filter(FoundItem.finder_id == current_user.id).all()]
        query = query.filter(
            (Match.lost_item_id.in_(user_lost_ids)) | (Match.found_item_id.in_(user_found_ids))
        )

    results = query.order_by(Match.score.desc()).all()
    output = []
    for m in results:
        res = MatchResponse.model_validate(m)
        res.lost_item = LostItemResponse.model_validate(m.lost_item)
        res.found_item = FoundItemResponse.model_validate(m.found_item)
        output.append(res)
    return output

@router.get("/{match_id}", response_model=MatchResponse)
def get_match_detail(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    res = MatchResponse.model_validate(match)
    res.lost_item = LostItemResponse.model_validate(match.lost_item)
    res.found_item = FoundItemResponse.model_validate(match.found_item)
    return res

@router.post("/{match_id}/approve", response_model=MatchResponse)
def approve_match(
    match_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    match.status = MatchStatus.APPROVED
    match.lost_item.status = LostItemStatus.POSSIBLE_MATCH
    match.found_item.status = FoundItemStatus.POSSIBLE_MATCH

    audit = AuditLog(
        actor_id=current_admin.id,
        action="MATCH_APPROVED",
        case_id=match.lost_item.case_id,
        notes=f"Match approved between Lost {match.lost_item.case_id} and Found {match.found_item.case_id} (Score: {int(match.score*100)}%)"
    )
    db.add(audit)

    notif = Notification(
        user_id=match.lost_item.reporter_id,
        title="Match Confirmed by Admin",
        message=f"Admin has confirmed a candidate match for your lost item '{match.lost_item.title}'. Verification step pending.",
        type="MATCH_FOUND",
        case_id=match.lost_item.case_id
    )
    db.add(notif)
    db.commit()
    db.refresh(match)

    res = MatchResponse.model_validate(match)
    res.lost_item = LostItemResponse.model_validate(match.lost_item)
    res.found_item = FoundItemResponse.model_validate(match.found_item)
    return res

@router.post("/{match_id}/reject", response_model=MatchResponse)
def reject_match(
    match_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    match.status = MatchStatus.REJECTED

    audit = AuditLog(
        actor_id=current_admin.id,
        action="MATCH_REJECTED",
        case_id=match.lost_item.case_id,
        notes=f"Match rejected between Lost {match.lost_item.case_id} and Found {match.found_item.case_id}"
    )
    db.add(audit)
    db.commit()
    db.refresh(match)

    res = MatchResponse.model_validate(match)
    res.lost_item = LostItemResponse.model_validate(match.lost_item)
    res.found_item = FoundItemResponse.model_validate(match.found_item)
    return res
