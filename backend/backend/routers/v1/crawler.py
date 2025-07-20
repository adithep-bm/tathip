import os
import requests
from fastapi import HTTPException, Query
from fastapi import APIRouter
from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/crawler", tags=["crawler"])

# กำหนดค่า API Key และ Custom Search Engine ID (ควรเก็บเป็นความลับใน env จริง)
api_key = os.getenv("GOOGLE_API_KEY")
cse_id = os.getenv("GOOGLE_CSE_ID")

def google_search(query, api_key, cse_id, num=10):
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "q": query,
        "key": api_key,
        "cx": cse_id,
        "num": num
    }
    try:
        res = requests.get(url, params=params)
        res.raise_for_status()  # ตรวจสอบว่า request สำเร็จหรือไม่ (status code 2xx)
        return res.json()
    except requests.exceptions.RequestException as e:
        # จัดการ error ที่เกิดจาก request โดยเฉพาะ
        print(f"Error calling Google API: {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None
    
# --- สร้าง Endpoint ของ API ---
@router.get("/search")
def search_endpoint(query: str = Query(..., min_length=1, description="คำที่ต้องการค้นหา")):
    """
    Endpoint สำหรับรับคำค้นหาและส่งผลลัพธ์กลับไป
    """
    if not query:
        raise HTTPException(status_code=400, detail="กรุณาระบุ 'query' ที่ต้องการค้นหา")

    try:
        search_results = google_search(query,api_key, cse_id)
        print(search_results.get("items", []))  # แสดงผลลัพธ์ที่ได้จาก Google Search
        if search_results:
            return search_results
        else:
            # กรณีที่ Google Search คืนค่า None กลับมา (เกิดข้อผิดพลาด)
            raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google Search API")
    except ValueError as e:
        # ดักจับ error จากการที่ไม่ได้ตั้งค่า key
        raise HTTPException(status_code=500, detail=str(e))