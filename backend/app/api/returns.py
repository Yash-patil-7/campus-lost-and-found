from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.database import get_db
from app.models import LostItem, FoundItem, ReturnRecord, User, LostItemStatus, FoundItemStatus, AuditLog, Notification
from app.schemas import ReturnCreate, ReturnResponse

router = APIRouter(prefix="/returns", tags=["Returns"])

@router.post("", response_model=ReturnResponse, status_code=status.HTTP_201_CREATED)
def record_item_return(
    return_in: ReturnCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    lost_item = db.query(LostItem).filter(LostItem.id == return_in.lost_item_id).first()
    found_item = db.query(FoundItem).filter(FoundItem.id == return_in.found_item_id).first()
    recipient = db.query(User).filter(User.id == return_in.recipient_id).first()

    if not lost_item or not found_item or not recipient:
        raise HTTPException(status_code=404, detail="Lost item, found item, or recipient user not found.")

    old_lost_status = lost_item.status.value
    old_found_status = found_item.status.value

    # Update item statuses to RETURNED
    lost_item.status = LostItemStatus.RETURNED
    found_item.status = FoundItemStatus.RETURNED

    return_record = ReturnRecord(
        lost_item_id=lost_item.id,
        found_item_id=found_item.id,
        recipient_id=recipient.id,
        processed_by_id=current_admin.id,
        verification_method=return_in.verification_method,
        notes=return_in.notes,
        timestamp=datetime.utcnow()
    )
    db.add(return_record)

    # Audit log entry
    audit = AuditLog(
        actor_id=current_admin.id,
        action="ITEM_RETURNED",
        case_id=lost_item.case_id,
        old_status=old_lost_status,
        new_status=LostItemStatus.RETURNED.value,
        notes=f"Item '{lost_item.title}' physically returned to Student {recipient.full_name}. Verified via: '{return_in.verification_method}'"
    )
    db.add(audit)

    # Notifications
    notif_owner = Notification(
        user_id=recipient.id,
        title="Item Return Completed - Case Closed",
        message=f"Your lost item '{lost_item.title}' (Case ID: {lost_item.case_id}) has been successfully returned to you. Case is now closed.",
        type="STATUS_UPDATE",
        case_id=lost_item.case_id
    )
    db.add(notif_owner)

    notif_finder = Notification(
        user_id=found_item.finder_id,
        title="Found Item Successfully Returned!",
        message=f"The item you found '{found_item.title}' (Case ID: {found_item.case_id}) has been successfully returned to its verified owner. Great job!",
        type="STATUS_UPDATE",
        case_id=found_item.case_id
    )
    db.add(notif_finder)

    db.commit()
    db.refresh(return_record)

    return return_record
