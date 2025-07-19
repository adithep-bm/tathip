import os
import requests
from fastapi import HTTPException, Query
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from loguru import logger

from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/crawler", tags=["crawler"])

# กำหนดค่า API Key และ Custom Search Engine ID (ควรเก็บเป็นความลับใน env จริง)
api_key = os.getenv("GOOGLE_API_KEY")
cse_id = os.getenv("GOOGLE_CSE_ID")

# ตรวจสอบว่ามี API keys หรือไม่
if not api_key or not cse_id:
    logger.warning(
        "⚠️ Google API keys not configured. Search functionality may not work."
    )

# คำต้องสงสัยสำหรับตรวจจับเว็บพนัน
suspicious_terms = [
    "พนัน",
    "บาคาร่า",
    "casino",
    "หวย",
    "โป๊กเกอร์",
    "slot",
    "แทงบอล",
    "gambling",
    "bet",
]


class SearchResult(BaseModel):
    title: str
    link: str
    snippet: str
    is_suspicious: bool = False


def google_search(query, api_key, cse_id, num=10):
    """
    ฟังก์ชันสำหรับค้นหาผ่าน Google Custom Search API
    """
    url = "https://www.googleapis.com/customsearch/v1"
    params = {"q": query, "key": api_key, "cx": cse_id, "num": num}
    try:
        res = requests.get(url, params=params)
        res.raise_for_status()  # ตรวจสอบว่า request สำเร็จหรือไม่ (status code 2xx)
        return res.json()
    except requests.exceptions.RequestException as e:
        # จัดการ error ที่เกิดจาก request โดยเฉพาะ
        logger.error(f"Error calling Google API: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        return None


async def process_search_results(
    search_data: Dict[str, Any], query: str
) -> List[SearchResult]:
    """
    ประมวลผลผลลัพธ์การค้นหา และตรวจสอบเว็บต้องสงสัย
    """
    results = []
    items = search_data.get("items", [])

    for item in items:
        title = item.get("title", "")
        link = item.get("link", "")
        snippet = item.get("snippet", "")

        # ตรวจสอบว่าเป็นเว็บต้องสงสัยหรือไม่
        combined_text = f"{title} {snippet} {link}".lower()
        is_suspicious = any(term in combined_text for term in suspicious_terms)

        if is_suspicious:
            logger.warning(f"⚠️ Suspicious site detected: {link}")

        result = SearchResult(
            title=title,
            link=link,
            snippet=snippet,
            is_suspicious=is_suspicious,
        )
        results.append(result)

    return results


# --- สร้าง Endpoint ของ API ---
@router.get("/search", response_model=List[SearchResult])
async def search_endpoint(
    query: str = Query(..., min_length=1, description="คำที่ต้องการค้นหา")
):
    """
    Endpoint สำหรับรับคำค้นหา ทำ screenshot เว็บต้องสงสัย และส่งผลลัพธ์กลับไป
    """
    if not query:
        raise HTTPException(status_code=400, detail="กรุณาระบุ 'query' ที่ต้องการค้นหา")

    # ตรวจสอบ API keys
    if not api_key or not cse_id:
        raise HTTPException(
            status_code=500,
            detail="Google API keys not configured. Please set GOOGLE_API_KEY and GOOGLE_CSE_ID in environment variables.",
        )

    try:
        # ค้นหาผ่าน Google Search API
        search_data = google_search(query, api_key, cse_id)

        if not search_data:
            raise HTTPException(
                status_code=500, detail="เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google Search API"
            )

        # ประมวลผลผลลัพธ์และตรวจสอบเว็บต้องสงสัย
        results = await process_search_results(search_data, query)

        suspicious_count = sum(1 for r in results if r.is_suspicious)
        logger.info(
            f"Search completed: {len(results)} results, {suspicious_count} suspicious sites"
        )

        return results

    except ValueError as e:
        # ดักจับ error จากการที่ไม่ได้ตั้งค่า key
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in search endpoint: {e}")
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดภายในระบบ")


@router.get("/test")
async def test_endpoint():
    """
    Endpoint ทดสอบง่ายๆ เพื่อตรวจสอบว่าระบบทำงาน
    """
    return {
        "message": "Crawler API is working!",
        "google_api_configured": bool(api_key and cse_id),
        "suspicious_terms": suspicious_terms,
        "endpoints": [
            "/v1/crawler/search - ค้นหาและตรวจสอบเว็บต้องสงสัย",
            "/v1/crawler/test - endpoint ทดสอบ",
            "/v1/crawler/debug - debug ระบบ",
        ],
    }


@router.get("/debug")
async def debug_endpoint():
    """
    Endpoint สำหรับ debug ระบบ
    """
    try:
        # ตรวจสอบ environment variables
        env_vars = {
            "GOOGLE_API_KEY": "Set" if api_key else "Not set",
            "GOOGLE_CSE_ID": "Set" if cse_id else "Not set",
        }

        return {
            "environment_variables": env_vars,
            "suspicious_terms": suspicious_terms,
            "debug_info": {
                "requests_available": "requests" in str(type(requests)),
                "logger_available": "logger" in locals() or "logger" in globals(),
            },
        }

    except Exception as e:
        return {
            "error": f"Debug failed: {str(e)}",
            "environment_variables": {
                "GOOGLE_API_KEY": "Set" if api_key else "Not set",
                "GOOGLE_CSE_ID": "Set" if cse_id else "Not set",
            },
        }
