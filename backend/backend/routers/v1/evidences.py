import io
import zipfile
from typing import List

from fastapi import APIRouter, File, UploadFile, HTTPException, status
from loguru import logger
from pydantic import BaseModel

from ...configs.registry import models

from ...configs.firebase import upload_file_to_storage

router = APIRouter(prefix="/evidences", tags=["evidences"])

class Evidence(BaseModel):
  title: str
  description: str | None = None
  case_id: int

# --- Pydantic Models ---
class ClassificationResult(BaseModel):
    filename: str
    classification: str

class UploadAndClassifyResponse(BaseModel):
    message: str
    firebase_url: str
    results: List[ClassificationResult]

evidence_db: list[Evidence] = []

# --- Endpoint สำหรับจำแนกประเภทสลิป ---
@router.post(
    "/upload",
    summary="Upload ZIP and classify images as Slip/Other",
    response_model=UploadAndClassifyResponse,
    tags=["Classification"]
)
async def upload_and_classify_slip(
    file: UploadFile = File(..., description="A ZIP file with images to classify.")
):
    """
    รับไฟล์ ZIP, แตกไฟล์รูปภาพ, และใช้โมเดลจำแนกประเภทว่าเป็นสลิปหรือไม่
    """
    # 1. ตรวจสอบและดึงโมเดลที่ต้องการจาก Registry
    slip_classifier = models.get("slip_classifier")
    if not slip_classifier:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The Slip Classifier model is not available."
        )

    # 2. ตรวจสอบประเภทไฟล์ที่อัปโหลด
    if file.content_type not in ["application/zip", "application/x-zip-compressed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a ZIP file."
        )

    # 3. อ่านข้อมูลไฟล์และอัปโหลดไป Firebase
    zip_contents = await file.read()
    firebase_url = await upload_file_to_storage(zip_contents, file.filename, file.content_type)
    
    classification_results = []
    image_extensions = ('.png', '.jpg', '.jpeg')

    # 4. วนลูปในไฟล์ ZIP เพื่อประมวลผลรูปภาพ
    try:
        with zipfile.ZipFile(io.BytesIO(zip_contents)) as thezip:
            for filename in thezip.namelist():
                # คัดกรองเฉพาะไฟล์รูปภาพ
                if filename.lower().endswith(image_extensions) and not filename.startswith('__MACOSX'):
                    image_bytes = thezip.read(filename)
                    
                    # 5. เรียกใช้เมธอด predict จาก service ที่เลือกไว้
                    classification = slip_classifier.predict_classify(image_bytes)
                    logger.info(f"Classified '{filename}' as '{classification}'")
                    
                    classification_results.append(
                        ClassificationResult(filename=filename, classification=classification)
                    )
    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid ZIP file."
        )

    # 6. ส่งผลลัพธ์ทั้งหมดกลับไป
    return UploadAndClassifyResponse(
        message="Classification complete",
        firebase_url=firebase_url,
        results=classification_results
    )