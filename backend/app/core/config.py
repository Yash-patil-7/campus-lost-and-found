import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Campus Lost & Found Management System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super_secret_campus_lost_and_found_jwt_key_2026_dev_prod_secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite default, easily swappable with PostgreSQL via environment variable
    DATABASE_URL: str = "sqlite:///./lost_and_found.db"
    
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    MAX_FILE_SIZE_MB: int = 10
    
    # Allowed categories and campus locations
    CATEGORIES: list[str] = [
        "Electronics",
        "ID Cards / Documents",
        "Books & Stationery",
        "Bags & Wallets",
        "Keys",
        "Clothing & Accessories",
        "Other"
    ]
    
    LOCATIONS: list[str] = [
        "Computer Lab 204",
        "Central Library",
        "Campus Canteen",
        "Main Building 1st Floor",
        "Auditorium",
        "Sports Complex",
        "Science Block",
        "Admin Office",
        "Parking Area",
        "Other"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
