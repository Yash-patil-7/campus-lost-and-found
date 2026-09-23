from datetime import datetime, timedelta
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.security import require_admin
from app.db.database import get_db
from app.models import LostItem, FoundItem, Handover, Match, Verification, ReturnRecord, AuditLog, User, LostItemStatus, FoundItemStatus, MatchStatus
from app.schemas import AnalyticsResponse, AuditLogResponse

router = APIRouter(prefix="/admin", tags=["Admin Dashboard & Analytics"])

@router.get("/analytics", response_model=AnalyticsResponse)
def get_admin_analytics(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_lost = db.query(LostItem).count()
    total_found = db.query(FoundItem).count()
    pending_handovers = db.query(FoundItem).filter(FoundItem.status == FoundItemStatus.HANDOVER_PENDING).count()
    items_received = db.query(FoundItem).filter(FoundItem.status.in_([FoundItemStatus.RECEIVED_BY_ADMIN, FoundItemStatus.POSSIBLE_MATCH, FoundItemStatus.OWNER_IDENTIFIED, FoundItemStatus.VERIFICATION])).count()
    possible_matches = db.query(Match).filter(Match.status == MatchStatus.PENDING, Match.score >= 0.50).count()
    total_returned = db.query(ReturnRecord).count()
    
    # Items in hand for over 30 days without return
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    total_unclaimed = db.query(FoundItem).filter(
        FoundItem.status == FoundItemStatus.RECEIVED_BY_ADMIN,
        FoundItem.received_at <= thirty_days_ago
    ).count()

    recovery_rate_percent = round((total_returned / total_lost * 100), 1) if total_lost > 0 else 0.0

    # Calculate average time to handover in hours
    handovers = db.query(Handover).all()
    if handovers:
        durations = []
        for h in handovers:
            item = h.found_item
            if item and item.created_at and h.received_at:
                durations.append((h.received_at - item.created_at).total_seconds() / 3600.0)
        avg_time_to_handover_hours = round(sum(durations) / len(durations), 1) if durations else 0.0
    else:
        avg_time_to_handover_hours = 0.0

    # Calculate average recovery time in days
    returns = db.query(ReturnRecord).all()
    if returns:
        return_days = []
        for r in returns:
            if r.lost_item and r.lost_item.created_at and r.timestamp:
                return_days.append((r.timestamp - r.lost_item.created_at).total_seconds() / 86400.0)
        avg_recovery_time_days = round(sum(return_days) / len(return_days), 1) if return_days else 0.0
    else:
        avg_recovery_time_days = 0.0

    # Category distribution
    cat_rows = db.query(LostItem.category, func.count(LostItem.id)).group_by(LostItem.category).all()
    category_distribution = {cat: count for cat, count in cat_rows}

    # Location distribution
    loc_rows = db.query(LostItem.location, func.count(LostItem.id)).group_by(LostItem.location).all()
    location_distribution = {loc: count for loc, count in loc_rows}

    return AnalyticsResponse(
        total_lost=total_lost,
        total_found=total_found,
        pending_handovers=pending_handovers,
        items_received=items_received,
        possible_matches=possible_matches,
        total_returned=total_returned,
        total_unclaimed=total_unclaimed,
        recovery_rate_percent=recovery_rate_percent,
        avg_time_to_handover_hours=avg_time_to_handover_hours,
        avg_recovery_time_days=avg_recovery_time_days,
        category_distribution=category_distribution,
        location_distribution=location_distribution
    )

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    case_id: Optional[str] = None,
    action: Optional[str] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if case_id:
        query = query.filter(AuditLog.case_id == case_id)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.timestamp.desc()).all()
    output = []
    for log in logs:
        res = AuditLogResponse.model_validate(log)
        res.actor_name = log.actor.full_name if log.actor else "System"
        output.append(res)
    return output

@router.post("/generate-announcement")
def generate_college_announcement(
    case_id: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    lost_item = db.query(LostItem).filter(LostItem.case_id == case_id).first()
    found_item = db.query(FoundItem).filter(FoundItem.case_id == case_id).first()

    if lost_item:
        msg = f"""📢 **OFFICIAL CAMPUS LOST ITEM NOTICE**

📌 **Item**: {lost_item.title}
🏷️ **Category**: {lost_item.category}
🎨 **Color / Brand**: {lost_item.color or 'N/A'} / {lost_item.brand or 'N/A'}
📍 **Last Seen Location**: {lost_item.location}
📅 **Date Lost**: {lost_item.date_lost}
📝 **Details**: {lost_item.description}

🆔 **Case Reference ID**: {lost_item.case_id}

If you have found this item or have relevant information, please submit a report on the Campus Lost & Found System or contact the Lost & Found Administrator office immediately.
"""
        return {"case_id": case_id, "formatted_announcement": msg}
    elif found_item:
        msg = f"""📢 **OFFICIAL CAMPUS FOUND ITEM NOTICE**

📌 **Item Found**: {found_item.title}
🏷️ **Category**: {found_item.category}
📍 **Found Location**: {found_item.location}
📅 **Date Found**: {found_item.date_found}

🆔 **Case Reference ID**: {found_item.case_id}

If you believe this item belongs to you, please log in to the Campus Lost & Found System to initiate ownership verification with the Administrator.
"""
        return {"case_id": case_id, "formatted_announcement": msg}
    else:
        raise HTTPException(status_code=404, detail="Case ID not found.")

@router.post("/reset-test-db")
def reset_test_db(db: Session = Depends(get_db)):
    from app.models import LostItem, FoundItem, Handover, Match, Verification, ReturnRecord, Notification, AuditLog
    db.query(ReturnRecord).delete()
    db.query(Verification).delete()
    db.query(Match).delete()
    db.query(Handover).delete()
    db.query(FoundItem).delete()
    db.query(LostItem).delete()
    db.query(Notification).delete()
    db.query(AuditLog).delete()
    db.commit()
    return {"message": "Test database records reset successfully."}

