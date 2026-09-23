import sys
import os
from datetime import datetime

# Add current dir to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine, Base
from app.models import User, UserRole, LostItem, FoundItem, LostItemStatus, FoundItemStatus, AuditLog, Notification
from app.core.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Checking test seed accounts...")
        # 1. Admin
        admin = db.query(User).filter(User.email == "admin.test@campus.edu").first()
        if not admin:
            admin = User(
                email="admin.test@campus.edu",
                password_hash=get_password_hash("Admin@12345"),
                full_name="Campus Admin Coordinator",
                roll_number="ADMIN-001",
                department="Student Affairs",
                phone="+1-555-0100",
                role=UserRole.ADMIN
            )
            db.add(admin)
            print("Created Admin account: admin.test@campus.edu / Admin@12345")

        # 2. Student A
        student_a = db.query(User).filter(User.email == "student1.test@campus.edu").first()
        if not student_a:
            student_a = User(
                email="student1.test@campus.edu",
                password_hash=get_password_hash("Student@12345"),
                full_name="Test Student One",
                roll_number="2024-CS-101",
                department="Computer Science",
                phone="+1-555-0101",
                role=UserRole.STUDENT
            )
            db.add(student_a)
            print("Created Student A account: student1.test@campus.edu / Student@12345")

        # 3. Student B
        student_b = db.query(User).filter(User.email == "student2.test@campus.edu").first()
        if not student_b:
            student_b = User(
                email="student2.test@campus.edu",
                password_hash=get_password_hash("Student@12345"),
                full_name="Test Student Two",
                roll_number="2024-EE-205",
                department="Electrical Engineering",
                phone="+1-555-0102",
                role=UserRole.STUDENT
            )
            db.add(student_b)
            print("Created Student B account: student2.test@campus.edu / Student@12345")


        db.commit()
        print("Database seed completed successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
