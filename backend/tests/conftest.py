import os
import sys

# Ensure backend directory is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app

from app.db.database import Base, get_db
from app.core.security import get_password_hash
from app.models import User, UserRole

from sqlalchemy.pool import StaticPool

# Use in-memory SQLite database for testing with StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Seed default test users
    admin = User(
        email="admin.test@campus.edu",
        password_hash=get_password_hash("Admin@12345"),
        full_name="Campus Admin Coordinator",
        role=UserRole.ADMIN
    )
    student_a = User(
        email="student1.test@campus.edu",
        password_hash=get_password_hash("Student@12345"),
        full_name="Test Student One",
        role=UserRole.STUDENT
    )
    student_b = User(
        email="student2.test@campus.edu",
        password_hash=get_password_hash("Student@12345"),
        full_name="Test Student Two",
        role=UserRole.STUDENT
    )

    session.add_all([admin, student_a, student_b])
    session.commit()
    
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
