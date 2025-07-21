from pydantic import BaseModel
from enum import Enum
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlmodel import select
from typing import Any, Dict, List
from datetime import date
import requests
import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt
import io
import os
import uuid
from ...configs.config import template # ⭐️ นำเข้า template จากไฟล์ config
from weasyprint import HTML

router = APIRouter(prefix="/reports", tags=["reports"])
# --- ⭐️ UPDATE: เพิ่มฟังก์ชันแปลงวันที่ภาษาไทย ---

def convert_thai_date(thai_date_str: str) -> pd.Timestamp:
    """
    แปลง String วันที่และเวลาภาษาไทย (เช่น '16 มิ.ย. 68, 19:26')
    ให้เป็น datetime object ที่ถูกต้อง
    """
    if not isinstance(thai_date_str, str):
        return pd.NaT

    try:
        thai_month_map = {
            'ม.ค.': '01', 'ก.พ.': '02', 'มี.ค.': '03', 'เม.ย.': '04', 'พ.ค.': '05', 'มิ.ย.': '06',
            'ก.ค.': '07', 'ส.ค.': '08', 'ก.ย.': '09', 'ต.ค.': '10', 'พ.ย.': '11', 'ธ.ค.': '12'
        }
        
        # แทนที่เดือนไทยด้วยตัวเลข
        for th_month, month_num in thai_month_map.items():
            thai_date_str = thai_date_str.replace(th_month, month_num)
        
        # แยกส่วนประกอบของวันที่
        parts = thai_date_str.replace(',', '').split() # ผลลัพธ์ -> ['16', '06', '68', '19:26']
        day = int(parts[0])
        month = int(parts[1])
        buddhist_year_short = int(parts[2])
        time_parts = parts[3].split(':')
        hour = int(time_parts[0])
        minute = int(time_parts[1])
        
        # แปลงปี พ.ศ. ให้เป็น ค.ศ.
        gregorian_year = buddhist_year_short + 2500 - 543
        
        return pd.Timestamp(year=gregorian_year, month=month, day=day, hour=hour, minute=minute)

    except (ValueError, IndexError):
        # ถ้าแปลงค่าไม่ได้ ให้คืนค่าว่าง
        return pd.NaT
    
class ReportType(str, Enum):
    summary = "summary"
    case_details = "case_details"
    network_graph = "network_graph"


class Reports(BaseModel):
    report_id : str = str(uuid.uuid4())  # สร้าง UUID สำหรับ report_id
    case_id: str
    report_type: ReportType
    case_title: str
    evidence_id: int | None = None
    date_from: date | None = None
    date_to: date | None = None
    description: str | None = None
    report_content: Dict[str, Any] | None = None
    created_at: date = date.today()

# Model สำหรับ Request ที่จะส่งเข้ามา
class ReportRequest(BaseModel):
    excel_url: str
    case_id: str
    case_title: str
    report_type: ReportType # ⭐️ UPDATE: รับประเภทรายงานที่ต้องการ

reports_db: List[Reports] = []

@router.get("/", summary="List all reports", description="Retrieve a list of all reports.")
def read_reports() -> List[Reports]:
    """
    Endpoint to retrieve all reports.
    """
    return reports_db

@router.post("/", summary="Create a new report", description="Create a new report with the provided details.")
def create_report(report: Reports) -> Reports:
    """
    Endpoint to create a new report.
    """
    if not report.case_id or not report.case_title:
        raise HTTPException(status_code=400, detail="Case ID and title are required.")
    
    reports_db.append(report)
    return report

@router.post("/generate", response_model=Reports,)
async def generate_report(request: ReportRequest):
    try:
        response = requests.get(str(request.excel_url))
        response.raise_for_status()
        df = pd.read_excel(io.BytesIO(response.content), header=7)

        required_columns = ['sender_acc', 'receiver_acc', 'amount', 'date']
        if not all(col in df.columns for col in required_columns):
            missing_cols = [col for col in required_columns if col not in df.columns]
            raise HTTPException(status_code=400, detail=f"Excel header is missing columns: {missing_cols}")

        df['amount'] = df['amount'].astype(str).str.replace(',', '')
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        df.dropna(subset=['amount'], inplace=True)

        df['date'] = df['date'].apply(convert_thai_date)
        df.dropna(subset=['date'], inplace=True)

        report_data = {}
        description = ""
        
        if request.report_type == ReportType.summary:
            description = f"Summary report for case {request.case_id}"
            start_date_val = df['date'].min()
            end_date_val = df['date'].max()
            report_data = {
                "total_transactions": len(df),
                "total_amount": float(df['amount'].sum()),
                "average_amount": float(df['amount'].mean()),
                "unique_senders": int(df['sender_acc'].nunique()),
                "unique_receivers": int(df['receiver_acc'].nunique()),
                "start_date": start_date_val.strftime('%Y-%m-%d') if pd.notna(start_date_val) else None,
                "end_date": end_date_val.strftime('%Y-%m-%d') if pd.notna(end_date_val) else None,
            }
        elif request.report_type == ReportType.in_depth_analysis:
            description = f"In-depth analysis for case {request.case_id}"
            receiver_analysis = df.groupby('receiver_acc')['amount'].agg(['sum', 'count']).reset_index()
            receiver_analysis.rename(columns={'sum': 'total_amount', 'count': 'transaction_count'}, inplace=True)
            sender_analysis = df.groupby('sender_acc')['amount'].agg(['sum', 'count']).reset_index()
            sender_analysis.rename(columns={'sum': 'total_amount', 'count': 'transaction_count'}, inplace=True)
            report_data = {
                "analysis_by_receiver": receiver_analysis.to_dict('records'),
                "analysis_by_sender": sender_analysis.to_dict('records'),
            }
        
        new_report = Reports(
            case_id=request.case_id,
            case_title=request.case_title,
            report_type=request.report_type,
            report_content=report_data,
            description=description
        )
        reports_db.append(new_report)
        return new_report
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")
    

# --- ⭐️ UPDATE: เพิ่ม Endpoint สำหรับ Export PDF ---
@router.get("/reports/{report_id}/export-pdf")
async def export_report_to_pdf(report_id: str, request: Request):
    # ค้นหารายงานจาก ID ใน DB (in-memory list)
    report_to_export = next((report for report in reports_db if report.report_id == report_id), None)

    if not report_to_export:
        raise HTTPException(status_code=404, detail="Report not found")

    # สร้าง HTML จาก template และข้อมูล
    # ⭐️ ดึง template engine จาก request.app.state
    template = request.app.state.templates.get_template("report_template.html")
    html_out = template.render(report=report_to_export)
    # แปลง HTML เป็น PDF ใน memory
    pdf_bytes = HTML(string=html_out).write_pdf()

    # สร้างชื่อไฟล์
    pdf_filename = f"report_{report_to_export.case_id}_{report_to_export.report_id[:8]}.pdf"

    # ส่งไฟล์ PDF กลับไปให้ User ดาวน์โหลด
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={pdf_filename}"}
    )