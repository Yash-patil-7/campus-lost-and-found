import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.db.database import get_db
from app.models import LostItem, User, UserRole, LostItemStatus, AuditLog, Notification
from app.schemas import LostItemCreate, LostItemResponse
from app.services.storage_service import StorageService
from app.services.matching_service import MatchingService

router = APIRouter(prefix="/lost-items", tags=["Lost Items"])

def generate_case_id(db: Session, prefix: str = "LF") -> str:
    year = datetime.datetime.now().year
    count = db.query(LostItem).count() + 1
    return f"{prefix}-{year}-{count:04d}"

@router.post("", response_model=LostItemResponse, status_code=status.HTTP_201_CREATED)
async def create_lost_item(
    title: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    date_lost: str = Form(...),
    description: str = Form(...),
    brand: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    time_lost: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image_url = None
    if image and image.filename:
        image_url = await StorageService.save_file(image)

    case_id = generate_case_id(db, prefix="LF")
    
    new_lost = LostItem(
        case_id=case_id,
        reporter_id=current_user.id,
        title=title,
        category=category,
        brand=brand,
        color=color,
        location=location,
        date_lost=date_lost,
        time_lost=time_lost,
        description=description,
        image_url=image_url,
        status=LostItemStatus.ACTIVE_SEARCH
    )
    db.add(new_lost)
    db.commit()
    db.refresh(new_lost)

    # Audit log entry
    audit = AuditLog(
        actor_id=current_user.id,
        action="LOST_REPORT_CREATED",
        case_id=case_id,
        new_status=LostItemStatus.ACTIVE_SEARCH.value,
        notes=f"Reported lost item: '{title}' at {location}"
    )
    db.add(audit)

    # Internal notification
    notif = Notification(
        user_id=current_user.id,
        title="Lost Item Report Created",
        message=f"Your lost item report '{title}' (Case ID: {case_id}) is now active in the search index.",
        type="STATUS_UPDATE",
        case_id=case_id
    )
    db.add(notif)
    db.commit()

    # Auto trigger matching service
    MatchingService.run_matching_for_all(db)

    # Attach reporter info for UI
    resp = LostItemResponse.model_validate(new_lost)
    resp.reporter_name = current_user.full_name
    resp.reporter_email = current_user.email
    return resp

@router.get("", response_model=List[LostItemResponse])
def get_lost_items(
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    my_reports: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(LostItem)

    if my_reports:
        query = query.filter(LostItem.reporter_id == current_user.id)

    if category and category != "All":
        query = query.filter(LostItem.category == category)
    if location and location != "All":
        query = query.filter(LostItem.location == location)
    if status_filter and status_filter != "All":
        query = query.filter(LostItem.status == status_filter)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (LostItem.title.ilike(s)) |
            (LostItem.description.ilike(s)) |
            (LostItem.brand.ilike(s)) |
            (LostItem.case_id.ilike(s))
        )

    results = query.order_by(LostItem.created_at.desc()).all()
    output = []
    for item in results:
        resp = LostItemResponse.model_validate(item)
        # Privacy safeguard: only reveal reporter details if user is reporter or admin
        if current_user.role == UserRole.ADMIN or current_user.id == item.reporter_id:
            resp.reporter_name = item.reporter.full_name
            resp.reporter_email = item.reporter.email
        else:
            resp.reporter_name = "Campus Student"
            resp.reporter_email = None
        output.append(resp)
    return output

@router.get("/{item_id}", response_model=LostItemResponse)
def get_lost_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(LostItem).filter(LostItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Lost item report not found.")
    
    resp = LostItemResponse.model_validate(item)
    if current_user.role == UserRole.ADMIN or current_user.id == item.reporter_id:
        resp.reporter_name = item.reporter.full_name
        resp.reporter_email = item.reporter.email
    else:
        resp.reporter_name = "Campus Student"
        resp.reporter_email = None
    return resp
