# 🚀 Quick Start Guide - Crawler API

## 1. เริ่มต้นใช้งาน

### ตรวจสอบว่า server รันอยู่หรือไม่:

```bash
# รัน server (ใน terminal แยก)
poetry run fastapi dev backend/main.py --port 8000

# ตรวจสอบสถานะ (ใน browser หรือ terminal ใหม่)
curl http://localhost:8000/v1/crawler/test
```

## 2. ทดสอบ API พื้นฐาน

### ทดสอบ endpoint หลัก:

```bash
# ทดสอบว่าระบบทำงาน
curl http://localhost:8000/v1/crawler/test

# ผลลัพธ์ที่คาดหวัง:
{
  "message": "Crawler API is working!",
  "google_api_configured": false,  # จะเป็น true ถ้าตั้งค่า API key แล้ว
  "suspicious_terms": ["พนัน", "บาคาร่า", "casino", ...],
  "endpoints": [...]
}
```

## 3. ทดสอบ Screenshot (ไม่ต้องใช้ Google API)

```bash
# ทดสอบ screenshot เว็บไซต์ง่ายๆ
curl -X POST "http://localhost:8000/v1/crawler/screenshot?url=https://www.google.com&title=Google"

# ผลลัพธ์ที่คาดหวัง:
{
  "success": true,
  "url": "https://www.google.com",
  "screenshot_url": "https://firebase-storage-url/screenshot.png",
  "message": "Screenshot captured successfully"
}
```

## 4. ทดสอบ Search (ต้องมี Google API Key)

```bash
# ถ้าตั้งค่า API key แล้ว
curl "http://localhost:8000/v1/crawler/search?query=บาคาร่า"

# ถ้ายังไม่ได้ตั้งค่า จะได้ error:
{
  "detail": "Google API keys not configured. Please set GOOGLE_API_KEY and GOOGLE_CSE_ID in environment variables."
}
```

## 5. การตั้งค่า Google API (เพื่อให้ Search ทำงาน)

1. สร้างไฟล์ `.env` จาก `.env.example`:

```bash
cp .env.example .env
```

2. แก้ไขไฟล์ `.env`:

```env
GOOGLE_API_KEY=your_actual_api_key
GOOGLE_CSE_ID=your_actual_cse_id
FIREBASE_CRED_PATH=backend/service-account.json
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

3. Restart server:

```bash
poetry run fastapi dev backend/main.py --port 8000
```

## 6. ตรวจสอบ API Documentation

เปิดเบราว์เซอร์ไปที่: `http://localhost:8000/docs`

---

## 🔧 Troubleshooting

### ถ้าได้ Error 500:

1. ตรวจสอบว่า server รันอยู่หรือไม่
2. ตรวจสอบ logs ใน terminal ที่รัน server
3. ทดสอบ `/test` endpoint ก่อน

### ถ้า Screenshot ไม่ทำงาน:

1. ตรวจสอบว่า Firebase ตั้งค่าถูกต้องหรือไม่
2. ตรวจสอบ internet connection
3. ลองใช้ URL ที่ง่ายๆ เช่น google.com

### ถ้า Search ไม่ทำงาน:

1. ตรวจสอบ Google API Key และ CSE ID
2. ตรวจสอบ quota ของ Google API
3. ทดสอบ API key ผ่าน Google API Console
