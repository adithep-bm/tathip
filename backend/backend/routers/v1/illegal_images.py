from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel
import io
import zipfile
from typing import List, Dict

from ...configs.registry import models
from ...configs.firebase import upload_file_to_storage
from datetime import datetime

router = APIRouter(prefix="/illegal-images", tags=["illegal-images"])


# --- Pydantic Models ---
class ClassificationResult(BaseModel):
    filename: str
    classification: str
    confidence: float | None = None


class IllegalImagesSeparationResponse(BaseModel):
    message: str
    total_images: int
    legal_images: int
    illegal_images: int
    legal_zip_url: str | None = None
    illegal_zip_url: str | None = None
    classifications: List[ClassificationResult]
    processed_count: int | None = None  # จำนวนที่ประมวลผลแล้ว


# --- Endpoint สำหรับแยกภาพที่ผิดกฎหมาย ---
@router.post(
    "/separate",
    summary="Separate legal and illegal images from uploaded ZIP or images",
    response_model=IllegalImagesSeparationResponse,
    tags=["Classification"],
)
async def separate_illegal_images(
    file: UploadFile = File(
        ..., description="A ZIP file with images or a single image file to classify."
    )
):
    """
    รับไฟล์ ZIP หรือไฟล์ภาพเดี่ยว, จำแนกภาพที่ผิดกฎหมาย,
    สร้าง ZIP 2 ไฟล์ (ภาพปกติ และ ภาพผิดกฎหมาย),
    อัปโหลดไปยัง Firebase, และส่งคืน URL ของทั้งสองไฟล์
    """
    # 1. ตรวจสอบและดึงโมเดล
    illegal_image_classifier = models.get("illegal_image_classifier")
    if not illegal_image_classifier:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The Illegal Image Classifier model is not available.",
        )

    # 2. ตรวจสอบประเภทไฟล์
    is_zip = file.content_type in ["application/zip", "application/x-zip-compressed"]
    is_image = file.content_type in [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/bmp",
    ]

    if not is_zip and not is_image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a ZIP file or an image file (JPG, PNG, GIF, BMP).",
        )

    file_contents = await file.read()
    legal_images_data = []
    illegal_images_data = []
    classifications = []

    # 3. ประมวลผลไฟล์
    try:
        if is_zip:
            # ประมวลผล ZIP file
            with zipfile.ZipFile(io.BytesIO(file_contents)) as thezip:
                for filename in thezip.namelist():
                    image_extensions = (".png", ".jpg", ".jpeg", ".gif", ".bmp")
                    if filename.lower().endswith(
                        image_extensions
                    ) and not filename.startswith("__MACOSX"):
                        image_bytes = thezip.read(filename)

                        # จำแนกประเภท
                        classification, confidence = (
                            illegal_image_classifier.predict_classify(image_bytes)
                        )
                        logger.info(
                            f"Classified '{filename}' as '{classification}' with confidence {confidence:.3f}"
                        )

                        # เก็บผลการจำแนก
                        classifications.append(
                            ClassificationResult(
                                filename=filename,
                                classification=classification,
                                confidence=confidence,
                            )
                        )

                        # แยกตามประเภท - other = ปกติ, อื่นๆ = ผิดกฎหมาย
                        if classification.lower() == "other":
                            legal_images_data.append(
                                {"filename": filename, "data": image_bytes}
                            )
                        else:
                            illegal_images_data.append(
                                {"filename": filename, "data": image_bytes}
                            )
        else:
            # ประมวลผลไฟล์ภาพเดี่ยว
            classification, confidence = illegal_image_classifier.predict_classify(
                file_contents
            )
            logger.info(
                f"Classified '{file.filename}' as '{classification}' with confidence {confidence:.3f}"
            )

            # เก็บผลการจำแนก
            classifications.append(
                ClassificationResult(
                    filename=file.filename,
                    classification=classification,
                    confidence=confidence,
                )
            )

            # แยกตามประเภท - other = ปกติ, อื่นๆ = ผิดกฎหมาย
            if classification.lower() == "other":
                legal_images_data.append(
                    {"filename": file.filename, "data": file_contents}
                )
            else:
                illegal_images_data.append(
                    {"filename": file.filename, "data": file_contents}
                )

    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid ZIP file.",
        )
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}",
        )

    # 4. สร้างและอัปโหลดไฟล์ ZIP สำหรับภาพปกติ
    legal_zip_url = None
    if legal_images_data:
        legal_zip_buffer = io.BytesIO()
        with zipfile.ZipFile(legal_zip_buffer, "w", zipfile.ZIP_DEFLATED) as legal_zip:
            for item in legal_images_data:
                legal_zip.writestr(item["filename"], item["data"])

        date_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        legal_zip_filename = (
            f"legal_images_{date_str}_{file.filename.split('.')[0]}.zip"
        )
        legal_zip_url = await upload_file_to_storage(
            legal_zip_buffer.getvalue(), legal_zip_filename, "application/zip"
        )

    # 5. สร้างและอัปโหลดไฟล์ ZIP สำหรับภาพผิดกฎหมาย
    illegal_zip_url = None
    if illegal_images_data:
        illegal_zip_buffer = io.BytesIO()
        with zipfile.ZipFile(
            illegal_zip_buffer, "w", zipfile.ZIP_DEFLATED
        ) as illegal_zip:
            for item in illegal_images_data:
                illegal_zip.writestr(item["filename"], item["data"])

        date_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        illegal_zip_filename = (
            f"illegal_images_{date_str}_{file.filename.split('.')[0]}.zip"
        )
        illegal_zip_url = await upload_file_to_storage(
            illegal_zip_buffer.getvalue(), illegal_zip_filename, "application/zip"
        )

    # 6. ส่งคืนผลลัพธ์
    total_images = len(legal_images_data) + len(illegal_images_data)

    return IllegalImagesSeparationResponse(
        message="Images have been processed and separated successfully.",
        total_images=total_images,
        legal_images=len(legal_images_data),
        illegal_images=len(illegal_images_data),
        legal_zip_url=legal_zip_url,
        illegal_zip_url=illegal_zip_url,
        classifications=classifications,
    )


# --- Endpoint สำหรับตรวจสอบเฉพาะภาพเดี่ยว ---
@router.post(
    "/check-single",
    summary="Check if a single image is illegal",
    response_model=ClassificationResult,
    tags=["Classification"],
)
async def check_single_image(
    file: UploadFile = File(..., description="A single image file to classify.")
):
    """
    ตรวจสอบภาพเดี่ยวว่าผิดกฎหมายหรือไม่
    """
    # 1. ตรวจสอบและดึงโมเดล
    illegal_image_classifier = models.get("illegal_image_classifier")
    if not illegal_image_classifier:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The Illegal Image Classifier model is not available.",
        )

    # 2. ตรวจสอบประเภทไฟล์
    if file.content_type not in [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/bmp",
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload an image file (JPG, PNG, GIF, BMP).",
        )

    # 3. ประมวลผลภาพ
    try:
        image_bytes = await file.read()
        classification, confidence = illegal_image_classifier.predict_classify(
            image_bytes
        )
        logger.info(
            f"Classified '{file.filename}' as '{classification}' with confidence {confidence:.3f}"
        )

        return ClassificationResult(
            filename=file.filename, classification=classification, confidence=confidence
        )

    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image: {str(e)}",
        )
