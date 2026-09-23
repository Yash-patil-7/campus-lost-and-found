import os
import uuid
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

class StorageService:
    @staticmethod
    async def save_file(file: UploadFile) -> str:
        # Validate filename and extension
        filename = file.filename or ""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{ext}'. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Read content to validate size
        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB"
            )

        # Generate unique filename
        unique_name = f"{uuid.uuid4().hex}{ext}"
        target_path = os.path.join(settings.UPLOAD_DIR, unique_name)

        with open(target_path, "wb") as f:
            f.write(content)

        return f"/uploads/{unique_name}"
