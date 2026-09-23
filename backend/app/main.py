import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.database import engine, Base
from app.api import (
    auth,
    lost_items,
    found_items,
    handovers,
    matches,
    verifications,
    returns,
    notifications,
    admin
)

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Campus Lost & Found Management System API Backend"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(lost_items.router, prefix=settings.API_V1_STR)
app.include_router(found_items.router, prefix=settings.API_V1_STR)
app.include_router(handovers.router, prefix=settings.API_V1_STR)
app.include_router(matches.router, prefix=settings.API_V1_STR)
app.include_router(verifications.router, prefix=settings.API_V1_STR)
app.include_router(returns.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }
