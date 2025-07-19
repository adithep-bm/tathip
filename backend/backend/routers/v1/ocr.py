from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel, HttpUrl
from pyzbar.pyzbar import decode
# from ...utils.read_save_ocr import save_ocr_results

import requests
import easyocr
import zipfile
import io
import os
from PIL import Image
import torch

# --- ส่วนของการตั้งค่า (เหมือนเดิม) ---
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
ocr_reader = easyocr.Reader(['th', 'en'], gpu=True)

router = APIRouter(prefix="/ocr", tags=["ocr"])

class OcrRequest(BaseModel):
    firebase_url: HttpUrl
    case_id: int | None = None

class OcrResult(BaseModel):
    text: str

class OcrResponse(BaseModel):
    message: str
    results: list[OcrResult]
    case_id: int | None = None

# --- ฟังก์ชัน Helper ที่ปรับปรุงแล้ว ---
def save_ocr_results(case_id: int | None, text: str, filename: str) -> None:
    """บันทึกผลลัพธ์ OCR ลงในไดเรกทอรี local"""
    base_dir = "ocr_results"
    case_dir = os.path.join(base_dir, f"case_{case_id}" if case_id else "uncategorized")
    os.makedirs(case_dir, exist_ok=True)
    output_path = os.path.join(case_dir, f"{filename}.txt")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(text)

def read_ocr_from_image_data(image_data: bytes) -> str:
    """ใช้ OCR เพื่อแปลงข้อความจากข้อมูลภาพ (bytes) โดยตรง"""
    result = ocr_reader.readtext(image_data, detail=0)
    ocr_text = ' '.join(result)
    return ocr_text

def resize_image(image_data: bytes, max_size: int = 1600) -> bytes:
    """ปรับขนาดรูปภาพถ้าขนาดใหญ่เกินไป โดยรักษาสัดส่วน"""
    with Image.open(io.BytesIO(image_data)) as img:
        if max(img.size) > max_size:
            img.thumbnail((max_size, max_size))
            buffer = io.BytesIO()
            img_format = img.format if img.format in ['JPEG', 'PNG'] else 'JPEG'
            img.save(buffer, format=img_format)
            return buffer.getvalue()
    return image_data

# --- Endpoint หลักที่ปรับปรุงตรรกะ ---

@router.post(
    "/process-ocr",
    summary="Process OCR on images from Firebase URL",
    response_model=OcrResponse,
)
async def process_ocr(request: OcrRequest):
    """
    รับ URL ของไฟล์ ZIP, ดึงรูปภาพจากโฟลเดอร์ Slip,
    ตรวจสอบ QR Code ก่อน ถ้าไม่มีจึงประมวลผล OCR และส่งคืนผลลัพธ์
    """
    if not request.firebase_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Firebase URL is required.")
    
    try:
        response = requests.get(str(request.firebase_url))
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Could not download file: {e}")

    zip_contents = response.content
    results = []
    processed_count = 0
    skipped_count = 0

    try:
        zip_buffer = io.BytesIO(zip_contents)
        with zipfile.ZipFile(zip_buffer) as zip_file:
            slip_images = [
                f for f in zip_file.namelist() 
                if f.startswith('Slip/') and f.lower().endswith(('.png', '.jpg', '.jpeg')) and not f.endswith('/')
            ]

            if not slip_images:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No images found in the Slip folder.")

            for image_path in slip_images:
                image_data = zip_file.read(image_path)
                
                # 2. ถ้ามี QR Code ค่อยปรับขนาดและทำ OCR
                resized_image_data = resize_image(image_data)
                ocr_text = read_ocr_from_image_data(resized_image_data)
                
                if ocr_text:
                    processed_count += 1
                    filename = os.path.splitext(os.path.basename(image_path))[0]
                    save_ocr_results(request.case_id, ocr_text, filename)
                    results.append(OcrResult(text=ocr_text))
        
        if not results:
            detail_message = "Could not process any images. All images might contain QR codes or be unreadable."
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail_message)

        return OcrResponse(
            message=f"Successfully processed {processed_count} images. Skipped {skipped_count} images with QR codes.",
            results=results,
            case_id=request.case_id
        )
    
    except zipfile.BadZipFile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ZIP file format.")
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An error occurred while processing OCR: {str(e)}")