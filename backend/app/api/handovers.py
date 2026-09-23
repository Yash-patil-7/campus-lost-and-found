from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.database import get_db
from app.models import FoundItem, Handover, User, FoundItemStatus, AuditLog, Notification
from app.schemas import HandoverCreate, HandoverResponse
from app.services.matching_service import MatchingService

router = APIRouter(prefix="/admin/handovers", tags=["Admin Handovers"])

@router.post("", response_model=HandoverResponse, status_code=status.HTTP_201_CREATED)
def record_physical_handover(
    handover_in: HandoverCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    found_item = db.query(FoundItem).filter(FoundItem.id == handover_in.found_item_id).first()
    if not found_item:
        raise HTTPException(status_code=404, detail="Found item report not found.")

    old_status = found_item.status.value

    # Update item status to RECEIVED_BY_ADMIN
    found_item.status = FoundItemStatus.RECEIVED_BY_ADMIN
    found_item.physical_location = handover_in.storage_location
    found_item.condition_notes = handover_in.condition
    found_item.received_at = datetime.utcnow()
    found_item.received_by_id = current_admin.id

    # Create handover log
    handover = Handover(
        found_item_id=found_item.id,
        admin_id=current_admin.id,
        received_at=datetime.utcnow(),
        condition=handover_in.condition,
        storage_location=handover_in.storage_location,
        notes=handover_in.notes
    )
    db.add(handover)

    # Audit log
    audit = AuditLog(
        actor_id=current_admin.id,
        action="PHYSICAL_ITEM_RECEIVED",
        case_id=found_item.case_id,
        old_status=old_status,
        new_status=FoundItemStatus.RECEIVED_BY_ADMIN.value,
        notes=f"Physical item received by Admin {current_admin.full_name}. Storage: '{handover_in.storage_location}', Condition: '{handover_in.condition}'"
    )
    db.add(audit)

    # Notify finder that item has been received by admin
    notif = Notification(
        user_id=found_item.finder_id,
        title="Physical Item Handover Confirmed",
        message=f"Administrator has confirmed receipt of found item '{found_item.title}' (Case ID: {found_item.case_id}). Thank you for your support!",
        type="HANDOVER_REC",
        case_id=found_item.case_id
    )
    db.add(notif)
    db.commit()
    db.refresh(handover)

    # Re-run matching for received item
    MatchingService.run_matching_for_all(db)

    return handover
