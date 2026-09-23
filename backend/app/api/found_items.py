import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.db.database import get_db
from app.models import FoundItem, User, UserRole, FoundItemStatus, AuditLog, Notification
from app.schemas import FoundItemResponse
from app.services.storage_service import StorageService
from app.services.matching_service import MatchingService

router = APIRouter(prefix="/found-items", tags=["Found Items"])

def generate_found_case_id(db: Session, prefix: str = "FF") -> str:
    year = datetime.datetime.now().year
    count = db.query(FoundItem).count() + 1
    return f"{prefix}-{year}-{count:04d}"

@router.post("", response_model=FoundItemResponse, status_code=status.HTTP_201_CREATED)
async def create_found_item(
    title: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    date_found: str = Form(...),
    description: str = Form(...),
    brand: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    time_found: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image_url = None
    if image and image.filename:
        image_url = await StorageService.save_file(image)

    case_id = generate_found_case_id(db, prefix="FF")
    
    # Found report initial state is HANDOVER_PENDING
    new_found = FoundItem(
        case_id=case_id,
        finder_id=current_user.id,
        title=title,
        category=category,
        brand=brand,
        color=color,
        location=location,
        date_found=date_found,
        time_found=time_found,
        description=description,
        image_url=image_url,
        status=FoundItemStatus.HANDOVER_PENDING
    )
    db.add(new_found)
    db.commit()
    db.refresh(new_found)

    # Audit log entry
    audit = AuditLog(
        actor_id=current_user.id,
        action="FOUND_REPORT_CREATED",
        case_id=case_id,
        new_status=FoundItemStatus.HANDOVER_PENDING.value,
        notes=f"Found item reported: '{title}' at {location}. Handover pending."
    )
    db.add(audit)

    # Notification with handover instructions
    notif = Notification(
        user_id=current_user.id,
        title="Found Item Report Submitted - Action Required",
        message=f"Thank you for reporting found item '{title}' (Case ID: {case_id}). Please physically hand over the item to the Campus Lost & Found Admin office.",
        type="HANDOVER_PENDING",
        case_id=case_id
    )
    db.add(notif)
    db.commit()

    # Trigger matching engine
    MatchingService.run_matching_for_all(db)

    resp = FoundItemResponse.model_validate(new_found)
    resp.finder_name = current_user.full_name
    return resp

@router.get("", response_model=List[FoundItemResponse])
def get_found_items(
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    my_reports: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FoundItem)

    if my_reports:
        query = query.filter(FoundItem.finder_id == current_user.id)

    if category and category != "All":
        query = query.filter(FoundItem.category == category)
    if location and location != "All":
        query = query.filter(FoundItem.location == location)
    if status_filter and status_filter != "All":
        query = query.filter(FoundItem.status == status_filter)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (FoundItem.title.ilike(s)) |
            (FoundItem.description.ilike(s)) |
            (FoundItem.brand.ilike(s)) |
            (FoundItem.case_id.ilike(s))
        )

    results = query.order_by(FoundItem.created_at.desc()).all()
    output = []
    for item in results:
        resp = FoundItemResponse.model_validate(item)
        if current_user.role == UserRole.ADMIN or current_user.id == item.finder_id:
            resp.finder_name = item.finder.full_name
        else:
            resp.finder_name = "Campus Student"
        output.append(resp)
    return output

@router.get("/{item_id}", response_model=FoundItemResponse)
def get_found_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(FoundItem).filter(FoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Found item report not found.")
    
    resp = FoundItemResponse.model_validate(item)
    if current_user.role == UserRole.ADMIN or current_user.id == item.finder_id:
        resp.finder_name = item.finder.full_name
    else:
        resp.finder_name = "Campus Student"
    return resp
