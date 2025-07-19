# /configs/firebase.py

import os
import firebase_admin
from firebase_admin import credentials, storage
from fastapi import HTTPException, status

# นำ logger เข้ามาใช้งาน
from loguru import logger

def initialize_firebase():
    """
    อ่านค่าจาก Environment และเริ่มต้นการเชื่อมต่อ Firebase
    """
    cred_path = os.getenv("FIREBASE_CRED_PATH")
    bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")

    if not cred_path or not bucket_name:
        # ใช้ logger.error แทน print เพื่อแสดงข้อผิดพลาด
        logger.error("Firebase environment variables not set!")
        raise ValueError("Firebase env vars not set: FIREBASE_CRED_PATH, FIREBASE_STORAGE_BUCKET")

    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'storageBucket': bucket_name
    })
    
    # ใช้ logger.success แทน print เพื่อแสดงข้อความที่สำเร็จ
    logger.success("Firebase initialized successfully.")

async def upload_file_to_storage(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    ฟังก์ชันสำหรับอัปโหลดไฟล์ขึ้น Firebase Storage
    """
    try:
        bucket = storage.bucket()
        blob = bucket.blob(f"zip_uploads/{filename}")

        blob.upload_from_string(
            file_bytes,
            content_type=content_type
        )
        blob.make_public()
        logger.info(f"File '{filename}' uploaded to Firebase Storage.")
        return blob.public_url

    except Exception as e:
        logger.error(f"Error uploading to Firebase: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file to Firebase Storage: {e}"
        )