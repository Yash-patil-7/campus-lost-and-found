from enum import Enum as PyEnum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, Enum, JSON
)
from sqlalchemy.orm import relationship
from app.db.database import Base

class UserRole(str, PyEnum):
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"

class LostItemStatus(str, PyEnum):
    SUBMITTED = "SUBMITTED"
    ACTIVE_SEARCH = "ACTIVE_SEARCH"
    POSSIBLE_MATCH = "POSSIBLE_MATCH"
    VERIFICATION = "VERIFICATION"
    RETURNED = "RETURNED"
    CLOSED = "CLOSED"

class FoundItemStatus(str, PyEnum):
    SUBMITTED = "SUBMITTED"
    HANDOVER_PENDING = "HANDOVER_PENDING"
    RECEIVED_BY_ADMIN = "RECEIVED_BY_ADMIN"
    POSSIBLE_MATCH = "POSSIBLE_MATCH"
    OWNER_IDENTIFIED = "OWNER_IDENTIFIED"
    VERIFICATION = "VERIFICATION"
    RETURNED = "RETURNED"
    CLOSED = "CLOSED"

class MatchStatus(str, PyEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class VerificationStatus(str, PyEnum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    PASSED = "PASSED"
    FAILED = "FAILED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    roll_number = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    lost_items = relationship("LostItem", back_populates="reporter")
    found_items = relationship("FoundItem", foreign_keys="[FoundItem.finder_id]", back_populates="finder")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="actor")


class LostItem(Base):
    __tablename__ = "lost_items"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), unique=True, index=True, nullable=False) # e.g., LF-2026-0001
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    brand = Column(String(100), nullable=True)
    color = Column(String(100), nullable=True)
    location = Column(String(255), nullable=False, index=True)
    date_lost = Column(String(50), nullable=False)
    time_lost = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    status = Column(Enum(LostItemStatus), default=LostItemStatus.ACTIVE_SEARCH, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reporter = relationship("User", back_populates="lost_items")
    matches = relationship("Match", back_populates="lost_item")
    returns = relationship("ReturnRecord", back_populates="lost_item")


class FoundItem(Base):
    __tablename__ = "found_items"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), unique=True, index=True, nullable=False) # e.g., FF-2026-0001
    finder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    brand = Column(String(100), nullable=True)
    color = Column(String(100), nullable=True)
    location = Column(String(255), nullable=False, index=True)
    date_found = Column(String(50), nullable=False)
    time_found = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    status = Column(Enum(FoundItemStatus), default=FoundItemStatus.HANDOVER_PENDING, nullable=False, index=True)
    
    physical_location = Column(String(255), nullable=True) # Storage locker/cabinet
    condition_notes = Column(Text, nullable=True)
    received_at = Column(DateTime, nullable=True)
    received_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    finder = relationship("User", foreign_keys=[finder_id], back_populates="found_items")
    received_by = relationship("User", foreign_keys=[received_by_id])
    handovers = relationship("Handover", back_populates="found_item")
    matches = relationship("Match", back_populates="found_item")
    returns = relationship("ReturnRecord", back_populates="found_item")


class Handover(Base):
    __tablename__ = "handovers"

    id = Column(Integer, primary_key=True, index=True)
    found_item_id = Column(Integer, ForeignKey("found_items.id"), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    received_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    condition = Column(String(255), nullable=False)
    storage_location = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)

    found_item = relationship("FoundItem", back_populates="handovers")
    admin = relationship("User")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    lost_item_id = Column(Integer, ForeignKey("lost_items.id"), nullable=False)
    found_item_id = Column(Integer, ForeignKey("found_items.id"), nullable=False)
    score = Column(Float, nullable=False) # 0.0 to 1.0 (or 0% to 100%)
    signals_json = Column(JSON, nullable=False) # Signal breakdowns
    status = Column(Enum(MatchStatus), default=MatchStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lost_item = relationship("LostItem", back_populates="matches")
    found_item = relationship("FoundItem", back_populates="matches")
    verifications = relationship("Verification", back_populates="match")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    answer_submitted_at = Column(DateTime, nullable=True)
    status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    match = relationship("Match", back_populates="verifications")
    reviewed_by = relationship("User")


class ReturnRecord(Base):
    __tablename__ = "return_records"

    id = Column(Integer, primary_key=True, index=True)
    lost_item_id = Column(Integer, ForeignKey("lost_items.id"), nullable=False)
    found_item_id = Column(Integer, ForeignKey("found_items.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    processed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    verification_method = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    lost_item = relationship("LostItem", back_populates="returns")
    found_item = relationship("FoundItem", back_populates="returns")
    recipient = relationship("User", foreign_keys=[recipient_id])
    processed_by = relationship("User", foreign_keys=[processed_by_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(100), default="INFO", nullable=False) # MATCH_FOUND, VERIFICATION_REQ, STATUS_UPDATE, HANDOVER_REC
    is_read = Column(Boolean, default=False, nullable=False)
    case_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(255), nullable=False) # REPORT_CREATED, ITEM_RECEIVED, MATCH_APPROVED, VERIFICATION_PASSED, ITEM_RETURNED
    case_id = Column(String(50), nullable=True)
    old_status = Column(String(100), nullable=True)
    new_status = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    actor = relationship("User", back_populates="audit_logs")
