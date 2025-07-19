# 🔍 Crawler API คู่มือการใช้งาน

## การเริ่มต้นใช้งาน

### 1. รัน Backend Server

```bash
poetry run fastapi dev backend/main.py --port 8000
```

### 2. เข้าถึง API Documentation

เปิดเบราว์เซอร์ไปที่: `http://localhost:8000/docs`

---

## 📋 API Endpoints

### 🔍 `/v1/crawler/search` - ค้นหาและ Screenshot เว็บต้องสงสัย

**Method:** `GET`

**Parameters:**

- `query` (required): คำที่ต้องการค้นหา

**ตัวอย่างการใช้งาน:**

#### 1. ผ่าน Browser/Postman:

```
GET http://localhost:8000/v1/crawler/search?query=บาคาร่า
GET http://localhost:8000/v1/crawler/search?query=แทงหวย
GET http://localhost:8000/v1/crawler/search?query=casino
```

#### 2. ผ่าน curl:

```bash
curl "http://localhost:8000/v1/crawler/search?query=บาคาร่า"
```

#### 3. ผ่าน Python:

```python
import requests

response = requests.get("http://localhost:8000/v1/crawler/search",
                       params={"query": "บาคาร่า"})
results = response.json()
print(results)
```

**Response Format:**

```json
[
  {
    "title": "ชื่อเว็บไซต์",
    "link": "https://example.com",
    "snippet": "คำอธิบายสั้นๆ",
    "screenshot_url": "https://firebase-storage-url/screenshot.png",
    "is_suspicious": true
  }
]
```

---

### 📸 `/v1/crawler/screenshot` - Screenshot เว็บไซต์โดยเฉพาะ

**Method:** `POST`

**Parameters:**

- `url` (required): URL ที่ต้องการ screenshot
- `title` (optional): ชื่อของเว็บไซต์

**ตัวอย่างการใช้งาน:**

#### 1. ผ่าน curl:

```bash
curl -X POST "http://localhost:8000/v1/crawler/screenshot?url=https://www.google.com&title=Google"
```

#### 2. ผ่าน Python:

```python
import requests

response = requests.post("http://localhost:8000/v1/crawler/screenshot",
                        params={
                            "url": "https://www.google.com",
                            "title": "Google Search"
                        })
result = response.json()
print(f"Screenshot URL: {result['screenshot_url']}")
```

**Response Format:**

```json
{
  "success": true,
  "url": "https://www.google.com",
  "screenshot_url": "https://firebase-storage-url/screenshot.png",
  "message": "Screenshot captured successfully"
}
```

---

## 🎯 คำที่ระบบจะตรวจจับเป็นเว็บต้องสงสัย

ระบบจะทำ screenshot อัตโนมัติเมื่อพบคำเหล่านี้:

- พนัน
- บาคาร่า
- casino
- หวย
- โป๊กเกอร์
- slot
- แทงบอล
- gambling
- bet

---

## 🔧 Environment Variables ที่จำเป็น

สร้างไฟล์ `.env` ใน backend folder:

```env
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id
FIREBASE_CRED_PATH=path/to/service-account.json
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
```

---

## 📝 ตัวอย่างการใช้งานใน Frontend

### React/TypeScript:

```typescript
interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  screenshot_url?: string;
  is_suspicious: boolean;
}

const searchSuspiciousWebsites = async (
  query: string
): Promise<SearchResult[]> => {
  try {
    const response = await fetch(
      `http://localhost:8000/v1/crawler/search?query=${encodeURIComponent(
        query
      )}`
    );
    const results: SearchResult[] = await response.json();

    // Filter only suspicious sites
    const suspiciousSites = results.filter((site) => site.is_suspicious);

    return suspiciousSites;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};

// Usage
const handleSearch = async () => {
  const suspiciousSites = await searchSuspiciousWebsites("บาคาร่า");

  suspiciousSites.forEach((site) => {
    console.log(`Found suspicious site: ${site.title}`);
    console.log(`URL: ${site.link}`);
    if (site.screenshot_url) {
      console.log(`Screenshot: ${site.screenshot_url}`);
    }
  });
};
```

---

## 🚀 วิธีการทดสอบ

### 1. ทดสอบ Search API:

```bash
# ค้นหาคำที่น่าจะเจอเว็บพนัน
curl "http://localhost:8000/v1/crawler/search?query=บาคาร่า"
curl "http://localhost:8000/v1/crawler/search?query=แทงหวย"
curl "http://localhost:8000/v1/crawler/search?query=casino"
```

### 2. ทดสอบ Screenshot API:

```bash
# Screenshot เว็บไซต์ทั่วไป
curl -X POST "http://localhost:8000/v1/crawler/screenshot?url=https://www.google.com"

# Screenshot เว็บไซต์พร้อมชื่อ
curl -X POST "http://localhost:8000/v1/crawler/screenshot?url=https://www.facebook.com&title=Facebook"
```

---

## 📦 ผลลัพธ์ที่ได้

1. **ผลการค้นหา**: รายการเว็บไซต์ที่เจอจาก Google Search
2. **การตรวจจับ**: ระบบจะแยกเว็บไซต์ต้องสงสัยออกมา (`is_suspicious: true`)
3. **Screenshot**: เว็บไซต์ต้องสงสัยจะถูก screenshot อัตโนมัติ
4. **Firebase Storage**: ภาพ screenshot จะถูกเก็บใน Firebase Storage
5. **URL**: ได้ URL สาธารณะของภาพ screenshot เพื่อแสดงใน Frontend

---

## ⚠️ หมายเหตุ

- การ screenshot อาจใช้เวลา 5-15 วินาที ต่อเว็บไซต์
- บางเว็บไซต์อาจบล็อกการ screenshot
- ต้องมี Google Custom Search API Key ที่ใช้งานได้
- ต้อง setup Firebase Storage ให้เรียบร้อย
