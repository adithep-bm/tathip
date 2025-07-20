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


async def upload_file_to_storage(file_bytes: bytes, destination_path: str, content_type: str) -> str:
    """
    ฟังก์ชันสำหรับอัปโหลดไฟล์ขึ้น Firebase Storage
    - destination_path: คือ path เต็มที่ต้องการเก็บใน bucket เช่น 'reports/report-123.xlsx'
    """
    try:
        bucket = storage.bucket()
        # **จุดที่แก้ไข:** ใช้ destination_path ที่รับเข้ามาโดยตรง
        blob = bucket.blob(destination_path)

        blob.upload_from_string(file_bytes, content_type=content_type)
        blob.make_public()
        logger.info(f"File uploaded to '{destination_path}' in Firebase Storage.")
        return blob.public_url

    except Exception as e:
        logger.error(f"Error uploading to Firebase: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file to Firebase Storage: {e}"
        )