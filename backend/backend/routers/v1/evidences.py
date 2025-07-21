from fastapi import APIRouter
import io
import zipfile
from typing import List
import os
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import StreamingResponse, FileResponse
from loguru import logger
from pydantic import BaseModel
import os

from ...configs.registry import models

from ...configs.firebase import upload_file_to_storage
from datetime import datetime
from .cases import cases_db, Case

router = APIRouter(prefix="/evidences", tags=["evidences"])


class Evidence(BaseModel):
    filename: str
    case_title: str
    case_id: str
    evidence_url: str
    created_at: datetime
    evidence_type: str
    evidence_id: int
    excel_url: str | None = None  # เพิ่ม field นี้
    confidence: float | None = None  # เพิ่ม field สำหรับ confidence ของโมเดล


# --- Pydantic Models ---
class ClassificationResult(BaseModel):
    filename: str
    classification: str


# Model ใหม่สำหรับ Response ของ Endpoint นี้โดยเฉพาะ
class UploadSlipsResponse(BaseModel):
    message: str
    firebase_url: str
    case_id: str
    evidence_id : int
    evidence_type : str | None = "slip"
    confidence: float | None = None  # เพิ่ม field สำหรับ confidence ของโมเดล
    filename: str | None = None  # เพิ่ม field สำหรับชื่อไฟล์


evidence_db: list[Evidence] = []


@router.get("/", summary="List all evidences", description="Retrieve a list of all evidences.")
def read_evidences() -> List[Evidence]:
    """
    Endpoint to retrieve all evidences.
    """
    return evidence_db
@router.get("/{case_id}", summary="Get evidences by case ID", description="Retrieve evidences for a specific case ID.")
def read_evidences_by_case(case_id: str) -> List[Evidence]:
    """
    Endpoint to retrieve evidences for a specific case ID.
    """
    evidences = [evidence for evidence in evidence_db if evidence.case_id == case_id]
    if not evidences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No evidences found for case ID {case_id}"
        )
    return evidences
# --- Endpoint สำหรับจำแนกประเภทสลิปและส่งคืนเฉพาะ URL ---
@router.post(
    "/upload/{case_id}",
    summary="Upload ZIP, classify, and return the Firebase URL of slips-only ZIP",
    response_model=UploadSlipsResponse,  # <-- ระบุ Model สำหรับ Response
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
    case.evidence_ids.append(evidence_id)

    slip_classifier = models.get("slip_classifier")
    if not slip_classifier:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The Slip Classifier model is not available.",
        )

    # 2. ตรวจสอบประเภทไฟล์
    if file.content_type not in ["application/zip", "application/x-zip-compressed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a ZIP file.",
        )

    zip_contents = await file.read()
    slip_images_data = []

    # 3. วนลูปในไฟล์ ZIP เพื่อประมวลผลรูปภาพ
    try:
        with zipfile.ZipFile(io.BytesIO(zip_contents)) as thezip:
            for filename in thezip.namelist():
                image_extensions = (".png", ".jpg", ".jpeg")
                if filename.lower().endswith(
                    image_extensions
                ) and not filename.startswith("__MACOSX"):
                    image_bytes = thezip.read(filename)

                    # 4. จำแนกประเภท
                    classification, confidence = slip_classifier.predict_classify(image_bytes)
                    logger.info(f"Classified '{filename}' as '{classification}'")

                    if classification == 'Slip':
                        filename_in_zip = os.path.join("Slip", os.path.basename(filename))
                        slip_images_data.append({'filename': filename_in_zip, 'data': image_bytes})
                        slip_images_data.append(
                            {"filename": filename, "data": image_bytes}
                        )

    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid ZIP file.",
        )

    # 6. ตรวจสอบว่ามีสลิปหรือไม่
    if not slip_images_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No slips were found in the uploaded ZIP file.",
        )

    # 7. สร้างไฟล์ ZIP ใหม่ในหน่วยความจำ
    in_memory_zip = io.BytesIO()
    with zipfile.ZipFile(in_memory_zip, "w", zipfile.ZIP_DEFLATED) as new_zip:
        for item in slip_images_data:
            new_zip.writestr(item["filename"], item["data"])

    # 8. อัปโหลด ZIP ที่มีเฉพาะสลิปไปยัง Firebase Storage
    date_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    new_zip_filename = f"uploads/slips_only_{date_str}_{file.filename}"
    firebase_url = await upload_file_to_storage(
        in_memory_zip.getvalue(), new_zip_filename, "application/zip"
    )
    evidence = Evidence(
        filename=file.filename,
        case_title=case.title,
        case_id=case_id,
        evidence_url=firebase_url,
        created_at=datetime.utcnow(),
        evidence_type="slip",
        evidence_id=evidence_id,
        confidence=confidence
    )
    evidence_db.append(evidence)
    case.evidenceCount += 1

    # 9. ส่งคืน URL ของ Firebase ในรูปแบบ JSON
    return UploadSlipsResponse(
        message="Slips have been processed and uploaded successfully.",
        firebase_url=firebase_url,
        case_id=case_id,
        evidence_id=evidence_id,
        evidence_type="slip",
        confidence=confidence,
        filename=file.filename
    )

@router.get("/excel/{evidence_id}", summary="Download Excel file for evidence")
async def download_evidence_excel(evidence_id: int):
    """
    ดาวน์โหลดไฟล์ Excel ที่เกี่ยวข้องกับหลักฐาน
    """
    try:
        # ค้นหา evidence ที่ต้องการ
        evidence = next((e for e in evidence_db if e.evidence_id == evidence_id), None)
        
        if not evidence:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Evidence with ID {evidence_id} not found"
            )
        
        # ตรวจสอบว่ามี Excel URL หรือไม่
        if not evidence.excel_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No Excel file found for evidence ID {evidence_id}"
            )
        
        # กรณีที่ excel_url เป็น local file path
        if evidence.excel_url.startswith('/') or evidence.excel_url.startswith('evidence_files'):
            excel_path = Path(evidence.excel_url)
            
            # ถ้าเป็น relative path ให้เพิ่ม base directory
            if not excel_path.is_absolute():
                excel_path = Path("evidence_files") / evidence.case_id / excel_path.name
            
            if not excel_path.exists():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Excel file not found at path: {excel_path}"
                )
            
            # ส่งไฟล์กลับ
            return FileResponse(
                path=str(excel_path),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename=f"ocr_results_{evidence.case_id}_{evidence_id}.xlsx",
                headers={"Content-Disposition": f"attachment; filename=ocr_results_{evidence.case_id}_{evidence_id}.xlsx"}
            )
        
        # กรณีที่ excel_url เป็น Firebase URL (สำหรับ backward compatibility)
        elif evidence.excel_url.startswith('http'):
            # ดาวน์โหลดจาก Firebase URL
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(evidence.excel_url)
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Excel file not accessible from URL"
                    )
                
                # ส่งไฟล์กลับ
                return StreamingResponse(
                    io.BytesIO(response.content),
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f"attachment; filename=ocr_results_{evidence.case_id}_{evidence_id}.xlsx"}
                )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Excel URL format"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading Excel for evidence {evidence_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading Excel file: {str(e)}"
        )

# เพิ่ม endpoint สำหรับ preview Excel data (ไม่ดาวน์โหลด)
@router.get("/excel/preview/{evidence_id}", summary="Preview Excel data for evidence")
async def preview_evidence_excel(evidence_id: int, limit: int = 10):
    """
    แสดงตัวอย่างข้อมูลใน Excel file โดยไม่ต้องดาวน์โหลด
    """
    try:
        # ค้นหา evidence
        evidence = next((e for e in evidence_db if e.evidence_id == evidence_id), None)
        
        if not evidence:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Evidence with ID {evidence_id} not found"
            )
        
        if not evidence.excel_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No Excel file found for evidence ID {evidence_id}"
            )
        
        import pandas as pd
        
        # อ่านไฟล์ Excel
        if evidence.excel_url.startswith('/') or evidence.excel_url.startswith('evidence_files'):
            excel_path = Path(evidence.excel_url)
            if not excel_path.is_absolute():
                excel_path = Path("evidence_files") / evidence.case_id / excel_path.name
            
            if not excel_path.exists():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Excel file not found"
                )
            
            # อ่านข้อมูลจากไฟล์
            df = pd.read_excel(excel_path)
            
        elif evidence.excel_url.startswith('http'):
            # ดาวน์โหลดและอ่านจาก URL
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(evidence.excel_url)
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Excel file not accessible"
                    )
                
                df = pd.read_excel(io.BytesIO(response.content))
        
        # จำกัดจำนวนแถวที่แสดง
        preview_data = df.head(limit)
        
        return {
            "evidence_id": evidence_id,
            "case_id": evidence.case_id,
            "total_rows": len(df),
            "preview_rows": len(preview_data),
            "columns": df.columns.tolist(),
            "data": preview_data.to_dict('records')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error previewing Excel for evidence {evidence_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error previewing Excel file: {str(e)}"
        )

# เพิ่ม endpoint สำหรับดูข้อมูล evidence พร้อม Excel status
@router.get("/with-excel-status/{case_id}", summary="Get evidences with Excel file status")
async def get_evidences_with_excel_status(case_id: str):
    """
    ดึงรายการหลักฐานพร้อมสถานะไฟล์ Excel
    """
    try:
        evidences = [e for e in evidence_db if e.case_id == case_id]
        
        if not evidences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No evidences found for case {case_id}"
            )
        
        result = []
        for evidence in evidences:
            excel_status = {
                "has_excel": bool(evidence.excel_url),
                "excel_accessible": False,
                "excel_size": None
            }
            
            # ตรวจสอบว่าไฟล์ Excel เข้าถึงได้หรือไม่
            if evidence.excel_url:
                try:
                    if evidence.excel_url.startswith('/') or evidence.excel_url.startswith('evidence_files'):
                        excel_path = Path(evidence.excel_url)
                        if not excel_path.is_absolute():
                            excel_path = Path("evidence_files") / evidence.case_id / excel_path.name
                        
                        if excel_path.exists():
                            excel_status["excel_accessible"] = True
                            excel_status["excel_size"] = excel_path.stat().st_size
                    
                    elif evidence.excel_url.startswith('http'):
                        # สำหรับ Firebase URL - อาจจะใช้ HEAD request เพื่อตรวจสอบ
                        excel_status["excel_accessible"] = True  # สมมติว่าเข้าถึงได้
                        
                except Exception:
                    pass
            
            result.append({
                **evidence.dict(),
                "excel_status": excel_status
            })
        
        return {"case_id": case_id, "evidences": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting evidences with Excel status for case {case_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving evidence data: {str(e)}"
        )
