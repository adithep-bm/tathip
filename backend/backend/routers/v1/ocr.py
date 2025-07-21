#routes/v1/ocr.py
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from loguru import logger
from pydantic import BaseModel
from pyzbar.pyzbar import decode
from ...utils.read_save_ocr import has_qr_code, save_ocr_results,detect_bank,handle_gsb,handle_scb, handle_krungthai, handle_kbank, handle_bangkok, handle_unknown
import pandas as pd
from pathlib import Path
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

# สร้างโฟลเดอร์สำหรับเก็บไฟล์ Excel
EXCEL_DIR = Path("excel_files")
EXCEL_DIR.mkdir(exist_ok=True)

class OcrRequest(BaseModel):
    firebase_url: str
    case_id: str
    evidence_id: int

class OcrResponse(BaseModel):
    message: str
    results: list
    case_id: str | None = None
    excel_url: str

class OcrResult(BaseModel):
    evidence_id: int
    case_id: str
    file: str
    bank: str
    sender_name: str
    sender_bank: str
    sender_acc: str
    receiver_name: str
    receiver_bank: str
    receiver_acc: str
    amount: str
    date: str
    qr_code_text: str

ocr_db: list[OcrResult] = []

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
@router.get("/",summary="List all OCR results", description="Retrieve a list of all OCR results.")
def read_ocr_results() -> list[OcrResult]:
    """
    Endpoint to retrieve all OCR results.
    """
    return ocr_db

@router.post(
    "/process-ocr",
    summary="Process OCR on images from Firebase URL and save Excel locally",
    response_model=OcrResponse,
)
async def process_ocr(request: OcrRequest):
    """
    รับ URL ของไฟล์ ZIP, ดึงรูปภาพจากโฟลเดอร์ Slip,
    ตรวจสอบ QR Code ก่อน ถ้ามีจึงประมวลผล OCR และบันทึก Excel ลงเครื่อง
    """
    # Import cases_db from cases module to get case_title
    from ...routers.v1.cases import cases_db
    from ...routers.v1.evidences import evidence_db
    
    if not request.firebase_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Firebase URL is required.")
    
    # Get case information
    case_info = next((c for c in cases_db if c.case_id == request.case_id), None)
    case_title = case_info.title if case_info else "ไม่พบข้อมูลคดี"
    
    try:
        response = requests.get(str(request.firebase_url))
        response.raise_for_status()
        zip_contents = response.content
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=404, detail=f"Could not download file: {e}")
    
    results = []
    paths = []
    results_filter = []
    processed_count = int(0)
    skipped_count = int(0)

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
                    paths.append({image_name: image_data})  # เปลี่ยนเป็น image_data

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
                
                # ส่ง image_data แทน image_path
                image_data = paths[i][key]
                
                if bank_name == 'scb':
                    data = handle_scb(text, image_data)
                elif bank_name == 'krungthai':
                    data = handle_krungthai(text, image_data)
                elif bank_name == 'kbank':
                    data = handle_kbank(text, image_data)
                elif bank_name == 'bangkok':
                    data = handle_bangkok(text, image_data)
                elif bank_name == 'gsb':
                    data = handle_gsb(text, image_data)
                else:
                    data = handle_unknown(text, image_data)
                
                # อัปเดตข้อมูลใน row ถ้ามี data คืนมา
                if data:
                    row.update(data)
                print(row)

                i += 1
                results_filter.append(row)
                ocr_db.append(OcrResult(
                    evidence_id=request.evidence_id, 
                    case_id=request.case_id,
                    **row
                ))
                
        # สร้าง DataFrame และเพิ่มข้อมูล case ใน header
        df = pd.DataFrame(results_filter)
        
        # สร้างไฟล์ Excel พร้อมข้อมูล case ในส่วนหัว
        output_buffer = io.BytesIO()
        with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
            # เขียนข้อมูล case ในส่วนหัว
            case_info_df = pd.DataFrame([
                ["รหัสคดี:", request.case_id],
                ["ชื่อคดี:", case_title],
                ["รหัสหลักฐาน:", str(request.evidence_id)],
                ["วันที่ประมวลผล:", datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
                ["", ""],  # บรรทัดว่าง
                ["ข้อมูลการวิเคราะห์ slip:", ""]
            ])
            
            # เขียนข้อมูล case info ก่อน
            case_info_df.to_excel(writer, sheet_name='OCR Results', 
                                 index=False, header=False, startrow=0)
            
            # เขียนข้อมูล OCR results ตามหลัง
            df.to_excel(writer, sheet_name='OCR Results', 
                       index=False, startrow=len(case_info_df) + 1)
            
            # จัดรูปแบบ worksheet
            worksheet = writer.sheets['OCR Results']
            
            # ปรับความกว้างของ column
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
            
            # จัดรูปแบบส่วนหัว (case information)
            from openpyxl.styles import Font, PatternFill
            
            header_font = Font(bold=True, size=12)
            header_fill = PatternFill(start_color="CCE5FF", end_color="CCE5FF", fill_type="solid")
            
            for row_num in range(1, len(case_info_df) + 1):
                cell_a = worksheet[f'A{row_num}']
                cell_b = worksheet[f'B{row_num}']
                if cell_a.value and str(cell_a.value).endswith(':'):
                    cell_a.font = header_font
                    cell_a.fill = header_fill
                    cell_b.font = Font(size=11)

        output_buffer.seek(0)

        # บันทึกไฟล์ Excel ลงเครื่อง
        date_str = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        export_filename = f"ocr_results_{request.case_id}_{date_str}.xlsx"
        
        # สร้างโฟลเดอร์สำหรับแต่ละคดี
        case_excel_dir = EXCEL_DIR / request.case_id
        case_excel_dir.mkdir(exist_ok=True)
        
        excel_path = case_excel_dir / export_filename
        
        # เขียนไฟล์ลงดิสก์
        with open(excel_path, 'wb') as f:
            f.write(output_buffer.getvalue())
        
        logger.info(f"Saved Excel file to: {excel_path}")
        
        # สร้าง URL สำหรับดาวน์โหลด
        download_url = f"/ocr/download/{request.case_id}/{export_filename}"
        
        # อัปเดต evidence ด้วย excel_url (local path)
        evidence = next((e for e in evidence_db if e.evidence_id == request.evidence_id), None)
        if evidence:
            evidence.excel_url = str(excel_path)  # เก็บ local path
            logger.info(f"Updated evidence {request.evidence_id} with excel_url: {excel_path}")
        else:
            logger.warning(f"Evidence with ID {request.evidence_id} not found")
            
        if not results:
            detail_message = "Could not process any images. All images might contain QR codes or be unreadable."
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail_message)

        return OcrResponse(
            message=f"Successfully processed {processed_count} images. Skipped {skipped_count} images without QR codes.",
            results=results_filter,
            case_id=request.case_id,
            excel_url=download_url  # ส่ง download URL แทน Firebase URL
        )
        
    except zipfile.BadZipFile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ZIP file format.")
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An error occurred while processing OCR: {str(e)}")

# เพิ่ม endpoint สำหรับดาวน์โหลด Excel file
@router.get("/download/{case_id}/{filename}")
async def download_ocr_excel(case_id: str, filename: str):
    """
    ดาวน์โหลดไฟล์ Excel ผลลัพธ์ OCR
    """
    try:
        # เพิ่ม .xlsx extension หากไม่มี
        if not filename.endswith('.xlsx'):
            filename = f"{filename}.xlsx"
            
        excel_path = EXCEL_DIR / case_id / filename
        print(f"Looking for Excel file at: {excel_path}")
        
        # Debug: ดูว่ามีไฟล์อะไรอยู่ในโฟลเดอร์บ้าง
        case_dir = EXCEL_DIR / case_id
        if case_dir.exists():
            print(f"Files in directory {case_dir}:")
            for file in case_dir.iterdir():
                print(f"  - {file.name}")
        
        if not excel_path.exists():
            # หากไฟล์ไม่มี ลองหาไฟล์ที่ชื่อคล้ายกัน
            case_dir = EXCEL_DIR / case_id
            if case_dir.exists():
                matching_files = []
                base_filename = filename.replace('.xlsx', '')  # ลบ .xlsx ออกก่อนเพื่อหา pattern
                
                for file in case_dir.glob('*.xlsx'):
                    if base_filename in file.name:
                        matching_files.append(file)
                
                if matching_files:
                    # ใช้ไฟล์ล่าสุดที่ตรงกัน
                    excel_path = max(matching_files, key=lambda f: f.stat().st_mtime)
                    print(f"Found matching file: {excel_path}")
                else:
                    available_files = [f.name for f in case_dir.glob('*.xlsx')]
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Excel file '{filename}' not found for case {case_id}. Available files: {available_files}"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Case directory not found: {case_id}"
                )
        
        print(f"Serving file: {excel_path}")
        
        return FileResponse(
            path=str(excel_path),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=excel_path.name,
            headers={"Content-Disposition": f"attachment; filename={excel_path.name}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading Excel file {filename} for case {case_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading Excel file: {str(e)}"
        )

@router.get("/files/{case_id}")
async def list_ocr_files(case_id: str):
    """
    แสดงรายการไฟล์ Excel ทั้งหมดของคดี
    """
    try:
        case_excel_dir = EXCEL_DIR / case_id
        
        if not case_excel_dir.exists():
            return {"case_id": case_id, "files": []}
        
        files = []
        for file_path in case_excel_dir.iterdir():
            if file_path.is_file() and file_path.suffix == '.xlsx':
                stat = file_path.stat()
                files.append({
                    "filename": file_path.name,
                    "size": stat.st_size,
                    "created": datetime.datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "download_url": f"/ocr/download/{case_id}/{file_path.name}"
                })
        
        return {"case_id": case_id, "files": files}
        
    except Exception as e:
        logger.error(f"Error listing Excel files for case {case_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing files: {str(e)}"
        )