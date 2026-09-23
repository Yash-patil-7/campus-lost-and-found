from typing import Optional, Any, List, Dict
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models import UserRole, LostItemStatus, FoundItemStatus, MatchStatus, VerificationStatus

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    full_name: str
    email: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    roll_number: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[UserRole] = UserRole.STUDENT

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    role: UserRole
    created_at: datetime

# Lost Item Schemas
class LostItemCreate(BaseModel):
    title: str
    category: str
    brand: Optional[str] = None
    color: Optional[str] = None
    location: str
    date_lost: str
    time_lost: Optional[str] = None
    description: str

class LostItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    case_id: str
    reporter_id: int
    title: str
    category: str
    brand: Optional[str] = None
    color: Optional[str] = None
    location: str
    date_lost: str
    time_lost: Optional[str] = None
    description: str
    image_url: Optional[str] = None
    status: LostItemStatus
    created_at: datetime
    updated_at: datetime
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None

# Found Item Schemas
class FoundItemCreate(BaseModel):
    title: str
    category: str
    brand: Optional[str] = None
    color: Optional[str] = None
    location: str
    date_found: str
    time_found: Optional[str] = None
    description: str

class FoundItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    case_id: str
    finder_id: int
    title: str
    category: str
    brand: Optional[str] = None
    color: Optional[str] = None
    location: str
    date_found: str
    time_found: Optional[str] = None
    description: str
    image_url: Optional[str] = None
    status: FoundItemStatus
    physical_location: Optional[str] = None
    condition_notes: Optional[str] = None
    received_at: Optional[datetime] = None
    received_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    finder_name: Optional[str] = None

# Handover Schema
class HandoverCreate(BaseModel):
    found_item_id: int
    condition: str
    storage_location: str
    notes: Optional[str] = None

class HandoverResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    found_item_id: int
    admin_id: int
    received_at: datetime
    condition: str
    storage_location: str
    notes: Optional[str] = None

# Match Schemas
class MatchSignal(BaseModel):
    description: float
    category: float
    brand: float
    color: float
    location: float
    date: float

class MatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lost_item_id: int
    found_item_id: int
    score: float
    signals_json: Dict[str, float]
    status: MatchStatus
    created_at: datetime
    lost_item: Optional[LostItemResponse] = None
    found_item: Optional[FoundItemResponse] = None

# Verification Schemas
class VerificationCreate(BaseModel):
    match_id: int
    question: str

class VerificationSubmitAnswer(BaseModel):
    answer: str

class VerificationReview(BaseModel):
    passed: bool
    notes: Optional[str] = None

class VerificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    match_id: int
    question: str
    answer: Optional[str] = None
    answer_submitted_at: Optional[datetime] = None
    status: VerificationStatus
    notes: Optional[str] = None
    created_at: datetime
    match: Optional[MatchResponse] = None

# Return Record Schema
class ReturnCreate(BaseModel):
    lost_item_id: int
    found_item_id: int
    recipient_id: int
    verification_method: str
    notes: Optional[str] = None

class ReturnResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lost_item_id: int
    found_item_id: int
    recipient_id: int
    processed_by_id: int
    verification_method: str
    notes: Optional[str] = None
    timestamp: datetime

# Notification Schema
class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    case_id: Optional[str] = None
    created_at: datetime

# Audit Log Schema
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    actor_id: int
    actor_name: Optional[str] = None
    action: str
    case_id: Optional[str] = None
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = None
    timestamp: datetime

# Analytics Schemas
class AnalyticsResponse(BaseModel):
    total_lost: int
    total_found: int
    pending_handovers: int
    items_received: int
    possible_matches: int
    total_returned: int
    total_unclaimed: int
    recovery_rate_percent: float
    avg_time_to_handover_hours: float
    avg_recovery_time_days: float
    category_distribution: Dict[str, int]
    location_distribution: Dict[str, int]
