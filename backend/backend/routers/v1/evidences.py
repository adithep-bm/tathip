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

from ...configs.registry import models

from ...configs.firebase import upload_file_to_storage
from datetime import datetime

router = APIRouter(prefix="/evidences", tags=["evidences"])


class Evidence(BaseModel):
    title: str
    description: str | None = None
    case_id: int


# --- Pydantic Models ---
class ClassificationResult(BaseModel):
    filename: str
    classification: str


# Model ใหม่สำหรับ Response ของ Endpoint นี้โดยเฉพาะ
class UploadSlipsResponse(BaseModel):
    message: str
    firebase_url: str


evidence_db: list[Evidence] = []


# --- Endpoint สำหรับจำแนกประเภทสลิปและส่งคืนเฉพาะ URL ---
@router.post(
    "/upload",
    summary="Upload ZIP, classify, and return the Firebase URL of slips-only ZIP",
    response_model=UploadSlipsResponse,  # <-- ระบุ Model สำหรับ Response
    tags=["Classification"],
)
async def upload_and_get_url(
    file: UploadFile = File(..., description="A ZIP file with images to classify.")
):
    """
    รับไฟล์ ZIP, จำแนกรูปภาพ, สร้าง ZIP ใหม่ที่มีเฉพาะสลิป,
    อัปโหลดไปยัง Firebase, และส่งคืนเฉพาะ URL ของไฟล์นั้น
    """
    # 1. ตรวจสอบและดึงโมเดล
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
                    classification = slip_classifier.predict_classify(image_bytes)
                    logger.info(f"Classified '{filename}' as '{classification}'")

                    # 5. หากเป็น 'Slip' ให้เก็บข้อมูลไว้
                    if classification == "Slip":
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
    new_zip_filename = f"slips_only_{date_str}_{file.filename}"
    firebase_url = await upload_file_to_storage(
        in_memory_zip.getvalue(), new_zip_filename, "application/zip"
    )

    # 9. ส่งคืน URL ของ Firebase ในรูปแบบ JSON
    return UploadSlipsResponse(
        message="Slips have been processed and uploaded successfully.",
        firebase_url=firebase_url,
    )


@router.get("/image/{filename}")
async def get_image(filename: str):
    """
    ส่งภาพกลับไปยัง frontend
    """
    try:
        # กำหนดโฟลเดอร์ที่เก็บภาพ (อาจจะต้องปรับปรุงตาม structure จริง)
        image_dirs = [
            "uploads",
            "temp",
            "images",
            "processed_images",
            ".",  # current directory as fallback
        ]

        image_path = None
        # ค้นหาไฟล์ในโฟลเดอร์ต่าง ๆ
        for dir_path in image_dirs:
            potential_path = Path(dir_path) / filename
            if potential_path.exists() and potential_path.is_file():
                image_path = potential_path
                break

        if not image_path or not image_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Image file '{filename}' not found",
            )

        # ตรวจสอบว่าเป็นไฟล์ภาพหรือไม่
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}
        if image_path.suffix.lower() not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is not a valid image format",
            )

        # ส่งไฟล์กลับ
        return FileResponse(
            path=str(image_path),
            media_type=f"image/{image_path.suffix[1:]}",
            filename=filename,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving image {filename}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error serving image: {str(e)}",
        )


@router.post("/download-category-zip/{category}")
async def download_category_zip(category: str, filenames: List[str]):
    """
    สร้างและดาวน์โหลด ZIP file ของไฟล์ในหมวดหมู่ที่ระบุ

    Args:
        category: ชื่อหมวดหมู่ (weapon, drug, pornography, vape, other)
        filenames: รายชื่อไฟล์ที่ต้องการรวมใน ZIP
    """
    try:
        # ไดเรกทอรีที่ต้องค้นหาไฟล์
        search_directories = [
            Path("illegal_images"),
            Path("legal_images"),
            Path("output"),
            Path("uploads"),
            Path("temp"),
        ]

        # สร้าง ZIP file ใน memory
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            files_added = 0

            for filename in filenames:
                # ค้นหาไฟล์ในไดเรกทอรีต่างๆ
                file_path = None
                for directory in search_directories:
                    potential_path = directory / filename
                    if potential_path.exists() and potential_path.is_file():
                        file_path = potential_path
                        break

                if file_path:
                    # เพิ่มไฟล์ลงใน ZIP
                    zip_file.write(file_path, filename)
                    files_added += 1
                    logger.info(f"Added {filename} to ZIP from {file_path}")
                else:
                    logger.warning(f"File {filename} not found in any directory")

            if files_added == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No files found for the specified category",
                )

        zip_buffer.seek(0)

        # ส่ง ZIP file กลับ
        return StreamingResponse(
            io.BytesIO(zip_buffer.read()),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={category}_images.zip"
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating category ZIP for {category}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating ZIP file: {str(e)}",
        )
