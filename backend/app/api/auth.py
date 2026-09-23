from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.db.database import get_db
from app.models import User, UserRole, AuditLog
from app.schemas import UserCreate, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        password_hash=hashed_pwd,
        full_name=user_in.full_name,
        roll_number=user_in.roll_number,
        department=user_in.department,
        phone=user_in.phone,
        role=user_in.role or UserRole.STUDENT
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    audit = AuditLog(
        actor_id=new_user.id,
        action="USER_REGISTERED",
        notes=f"User registered with role {new_user.role}"
    )
    db.add(audit)
    db.commit()

    return new_user

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
