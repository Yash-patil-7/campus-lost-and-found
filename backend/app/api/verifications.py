from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.db.database import get_db
from app.models import Verification, VerificationStatus, Match, User, UserRole, LostItemStatus, FoundItemStatus, AuditLog, Notification

from app.schemas import VerificationCreate, VerificationSubmitAnswer, VerificationReview, VerificationResponse, MatchResponse

router = APIRouter(prefix="/verifications", tags=["Verifications"])

@router.post("", response_model=VerificationResponse, status_code=status.HTTP_201_CREATED)
def create_verification_request(
    verif_in: VerificationCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == verif_in.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    # Update item statuses to VERIFICATION
    match.lost_item.status = LostItemStatus.VERIFICATION
    match.found_item.status = FoundItemStatus.VERIFICATION

    verification = Verification(
        match_id=match.id,
        question=verif_in.question,
        status=VerificationStatus.PENDING
    )
    db.add(verification)

    # Audit log
    audit = AuditLog(
        actor_id=current_admin.id,
        action="VERIFICATION_REQUESTED",
        case_id=match.lost_item.case_id,
        new_status=LostItemStatus.VERIFICATION.value,
        notes=f"Ownership verification requested for Student {match.lost_item.reporter.full_name}. Question: '{verif_in.question}'"
    )
    db.add(audit)

    # Notification to student
    notif = Notification(
        user_id=match.lost_item.reporter_id,
        title="Ownership Verification Question Received",
        message=f"Admin sent a verification question for your lost item report '{match.lost_item.title}': {verif_in.question}",
        type="VERIFICATION_REQ",
        case_id=match.lost_item.case_id
    )
    db.add(notif)
    db.commit()
    db.refresh(verification)

    res = VerificationResponse.model_validate(verification)
    res.match = MatchResponse.model_validate(match)
    return res

@router.get("", response_model=List[VerificationResponse])
def get_verifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Verification)
    
    if current_user.role != UserRole.ADMIN:
        # Filter verifications belonging to current user's lost items
        query = query.join(Match).join(Match.lost_item).filter(Match.lost_item.has(reporter_id=current_user.id))

    results = query.order_by(Verification.created_at.desc()).all()
    output = []
    for v in results:
        res = VerificationResponse.model_validate(v)
        res.match = MatchResponse.model_validate(v.match)
        output.append(res)
    return output

@router.post("/{verification_id}/answer", response_model=VerificationResponse)
def submit_verification_answer(
    verification_id: int,
    answer_in: VerificationSubmitAnswer,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verif = db.query(Verification).filter(Verification.id == verification_id).first()
    if not verif:
        raise HTTPException(status_code=404, detail="Verification request not found.")

    if verif.match.lost_item.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to answer this verification.")

    verif.answer = answer_in.answer
    verif.answer_submitted_at = datetime.utcnow()
    verif.status = VerificationStatus.SUBMITTED

    audit = AuditLog(
        actor_id=current_user.id,
        action="VERIFICATION_ANSWER_SUBMITTED",
        case_id=verif.match.lost_item.case_id,
        notes=f"Student submitted verification answer: '{answer_in.answer}'"
    )
    db.add(audit)
    db.commit()
    db.refresh(verif)

    res = VerificationResponse.model_validate(verif)
    res.match = MatchResponse.model_validate(verif.match)
    return res

@router.post("/{verification_id}/review", response_model=VerificationResponse)
def review_verification(
    verification_id: int,
    review_in: VerificationReview,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    verif = db.query(Verification).filter(Verification.id == verification_id).first()
    if not verif:
        raise HTTPException(status_code=404, detail="Verification request not found.")

    verif.reviewed_by_id = current_admin.id
    verif.notes = review_in.notes

    if review_in.passed:
        verif.status = VerificationStatus.PASSED
        verif.match.found_item.status = FoundItemStatus.OWNER_IDENTIFIED
        
        audit = AuditLog(
            actor_id=current_admin.id,
            action="VERIFICATION_PASSED",
            case_id=verif.match.lost_item.case_id,
            new_status=FoundItemStatus.OWNER_IDENTIFIED.value,
            notes=f"Admin {current_admin.full_name} APPROVED ownership verification for student {verif.match.lost_item.reporter.full_name}."
        )
        db.add(audit)

        notif = Notification(
            user_id=verif.match.lost_item.reporter_id,
            title="Ownership Verified - Ready for Pickup!",
            message=f"Congratulations! Your ownership for '{verif.match.lost_item.title}' has been verified. Please visit the Admin office to collect your item.",
            type="STATUS_UPDATE",
            case_id=verif.match.lost_item.case_id
        )
        db.add(notif)
    else:
        verif.status = VerificationStatus.FAILED
        verif.match.lost_item.status = LostItemStatus.ACTIVE_SEARCH
        
        audit = AuditLog(
            actor_id=current_admin.id,
            action="VERIFICATION_FAILED",
            case_id=verif.match.lost_item.case_id,
            new_status=LostItemStatus.ACTIVE_SEARCH.value,
            notes=f"Admin {current_admin.full_name} REJECTED ownership verification answer."
        )
        db.add(audit)

        notif = Notification(
            user_id=verif.match.lost_item.reporter_id,
            title="Verification Unsuccessful",
            message=f"Verification for '{verif.match.lost_item.title}' could not be confirmed. Case returned to active search.",
            type="STATUS_UPDATE",
            case_id=verif.match.lost_item.case_id
        )
        db.add(notif)

    db.commit()
    db.refresh(verif)

    res = VerificationResponse.model_validate(verif)
    res.match = MatchResponse.model_validate(verif.match)
    return res
