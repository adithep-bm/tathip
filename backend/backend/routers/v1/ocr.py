#routes/v1/ocr.py
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel, HttpUrl
from pyzbar.pyzbar import decode
from ...utils.read_save_ocr import has_qr_code, save_ocr_results,detect_bank,handle_gsb,handle_scb, handle_krungthai, handle_kbank, handle_bangkok, handle_unknown
from ...configs.firebase import upload_file_to_storage
import pandas as pd

import requests
import easyocr
import zipfile
import io
import os
from PIL import Image
import torch
import datetime

# --- ส่วนของการตั้งค่า (เหมือนเดิม) ---
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
ocr_reader = easyocr.Reader(['th', 'en'], gpu=True)

router = APIRouter(prefix="/ocr", tags=["ocr"])

class OcrRequest(BaseModel):
    firebase_url: HttpUrl
    case_id: int | None = None

class OcrResponse(BaseModel):
    message: str
    case_id: int | None = None
    excel_url: str | None = None  # เพิ่ม field สำหรับ URL ของไฟล์ Excel

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
    ตรวจสอบ QR Code ก่อน ถ้ามีจึงประมวลผล OCR และส่งคืนผลลัพธ์
    """
    if not request.firebase_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Firebase URL is required.")
    
    try:
        response = requests.get(str(request.firebase_url))
        response.raise_for_status()
        zip_contents = response.content
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=404, detail=f"Could not download file: {e}")
    
    zip_contents = response.content
    results = []
    paths = []
    results_filter = []
    processed_count = 0
    skipped_count = 0

    try:
        zip_buffer = io.BytesIO(zip_contents)
        with zipfile.ZipFile(zip_buffer) as zip_file:
            slip_images = [
                f for f in zip_file.namelist() 
                if f.startswith('Slip/') and f.lower().endswith(('.png', '.jpg', '.jpeg')) and not f.endswith('/')
            ]

            print(slip_images)

            if not slip_images:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No images found in the Slip folder.")

            for image_path in slip_images:
                image_data = zip_file.read(image_path)
                image_name = os.path.basename(image_path)

                # 1. ตรวจสอบ QR Code ก่อน
                if not has_qr_code(image_data):
                    logger.info(f"ข้ามรูปภาพที่ไม่มี QR code: {image_path}")
                    skipped_count += 1
                    continue  # ข้ามไปรูปถัดไป

                # 2. ถ้ามี QR Code ค่อยปรับขนาดและทำ OCR
                resized_image_data = resize_image(image_data)
                ocr_text = read_ocr_from_image_data(resized_image_data)
                if ocr_text:
                    processed_count += 1
                    filename = os.path.splitext(os.path.basename(image_path))[0]
                    save_ocr_results(request.case_id, ocr_text, filename)
                    results.append({image_name: ocr_text})
                    paths.append({image_name: image_path})

        ## นำค่าจากresult detect_bank และแสดงผลตามbank 
        i = 0 
        for item in results:
            for key, text in item.items():
                bank_name = detect_bank(text)
                filename = key
                row = {
                    "file": filename,
                    "bank": bank_name,
                    "sender_name": "-",
                    "sender_bank": "-",
                    "sender_acc": "-",
                    "receiver_name": "-",
                    "receiver_bank": "-",
                    "receiver_acc": "-",
                    "amount": "-",
                    "date": "-",
                    "qr_code_text": "-"
                }
                if bank_name == 'scb':
                    data = handle_scb(text,paths[i][key])
                elif bank_name == 'krungthai':
                    data = handle_krungthai(text,paths[i][key])
                elif bank_name == 'kbank':
                    data = handle_kbank(text,paths[i][key])
                elif bank_name == 'bangkok':
                    data = handle_bangkok(text,paths[i][key])
                elif bank_name == 'gsb':
                    data = handle_gsb(text,paths[i][key])
                else:
                    handle_unknown(text,paths[i][key])
                    data = {}
                # อัปเดตข้อมูลใน row ถ้ามี data คืนมา
                if data:
                    row.update(data)
                print(row)

                i += 1
                results_filter.append(row)
                print(results_filter)
        df = pd.DataFrame(results_filter)
        output_buffer = io.BytesIO()
        df.to_excel(output_buffer, index=False, engine='openpyxl')
        output_buffer.seek(0)

        # อัปโหลดไฟล์ไปยัง Firebase
        export_filename = f"ocr_results_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        firebae_url = await upload_file_to_storage(
            file_bytes=output_buffer.getvalue(),
            destination_path=f"ocr_results/{export_filename}",
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        if not results:
            detail_message = "Could not process any images. All images might contain QR codes or be unreadable."
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail_message)

        return OcrResponse(
            message=f"Successfully processed {processed_count} images. Skipped {skipped_count} images with QR codes.",
            results=results_filter,
            case_id=request.case_id,
            excel_url=firebae_url  # ส่งคืน URL ของไฟล์ Excel ที่อัปโหลด
        )
    
    except zipfile.BadZipFile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ZIP file format.")
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An error occurred while processing OCR: {str(e)}")