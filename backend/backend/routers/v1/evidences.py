from fastapi import APIRouter
import io
import zipfile
from typing import List

from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel

from ...configs.registry import models

from ...configs.firebase import upload_file_to_storage
from datetime import datetime
from .cases import cases_db, Case

router = APIRouter(prefix="/evidences", tags=["evidences"])

class Evidence(BaseModel):
  case_id: str
  evidence_id: int | None = None
  evidence_url: str
  created_at: datetime

# Model ใหม่สำหรับ Response ของ Endpoint นี้โดยเฉพาะ
class UploadSlipsResponse(BaseModel):
    message: str
    firebase_url: str

evidence_db: list[Evidence] = []

router.get("/", summary="List all evidences", description="Retrieve a list of all evidences.")
def read_evidences() -> List[Evidence]:
    """
    Endpoint to retrieve all evidences.
    """
    return evidence_db
# --- Endpoint สำหรับจำแนกประเภทสลิปและส่งคืนเฉพาะ URL ---
@router.post(
    "/upload/{case_id}",
    summary="Upload ZIP, classify, and return the Firebase URL of slips-only ZIP",
    response_model=UploadSlipsResponse, # <-- ระบุ Model สำหรับ Response
)
async def upload_and_get_url(
    case_id: str,
    file: UploadFile = File(..., description="A ZIP file with images to classify.")
)-> UploadSlipsResponse:
    """
    รับไฟล์ ZIP, จำแนกรูปภาพ, สร้าง ZIP ใหม่ที่มีเฉพาะสลิป,
    อัปโหลดไปยัง Firebase, และส่งคืนเฉพาะ URL ของไฟล์นั้น
    """
    # 1. ตรวจสอบและดึงโมเดล
    case = next((case for case in cases_db if case.case_id == case_id), None)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with id {case_id} not found"
        )
    
    evidence_id = len(evidence_db) + 1

    evidence = Evidence(
        case_id=case_id,
        evidence_url=firebase_url,
        created_at=datetime.utcnow(),
        evidence_id=evidence_id
    )
    evidence_db.append(evidence)
    case.evidence_ids.append(evidence_id)
    
    slip_classifier = models.get("slip_classifier")
    if not slip_classifier:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The Slip Classifier model is not available."
        )

    # 2. ตรวจสอบประเภทไฟล์
    if file.content_type not in ["application/zip", "application/x-zip-compressed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a ZIP file."
        )

    zip_contents = await file.read()
    slip_images_data = []

    # 3. วนลูปในไฟล์ ZIP เพื่อประมวลผลรูปภาพ
    try:
        with zipfile.ZipFile(io.BytesIO(zip_contents)) as thezip:
            for filename in thezip.namelist():
                image_extensions = ('.png', '.jpg', '.jpeg')
                if filename.lower().endswith(image_extensions) and not filename.startswith('__MACOSX'):
                    image_bytes = thezip.read(filename)
                    
                    # 4. จำแนกประเภท
                    classification = slip_classifier.predict_classify(image_bytes)
                    logger.info(f"Classified '{filename}' as '{classification}'")
                    
                    # 5. หากเป็น 'Slip' ให้เก็บข้อมูลไว้
                    if classification == "Slip":
                        slip_images_data.append({'filename': filename, 'data': image_bytes})

    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid ZIP file."
        )

    # 6. ตรวจสอบว่ามีสลิปหรือไม่
    if not slip_images_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No slips were found in the uploaded ZIP file."
        )
        
    # 7. สร้างไฟล์ ZIP ใหม่ในหน่วยความจำ
    in_memory_zip = io.BytesIO()
    with zipfile.ZipFile(in_memory_zip, 'w', zipfile.ZIP_DEFLATED) as new_zip:
        for item in slip_images_data:
            new_zip.writestr(item['filename'], item['data'])

    # 8. อัปโหลด ZIP ที่มีเฉพาะสลิปไปยัง Firebase Storage
    date_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    new_zip_filename = f"/uploads/slips_only_{date_str}_{file.filename}"
    firebase_url = await upload_file_to_storage(
        in_memory_zip.getvalue(),
        new_zip_filename,
        "application/zip"
    )
    eviedence = Evidence(
        case_id=case_id,
        evidence_url=firebase_url,
        created_at=datetime.utcnow(),
        evidence_id=evidence_id
    )
    evidence_db.append(eviedence)

    # 9. ส่งคืน URL ของ Firebase ในรูปแบบ JSON
    return UploadSlipsResponse(
        message="Slips have been processed and uploaded successfully.",
        firebase_url=firebase_url,
        case_id=case_id,
    )