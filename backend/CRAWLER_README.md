# 🔍 Web Crawler with Screenshot Feature

## ฟีเจอร์ใหม่: Screenshot และอัปโหลดไปยัง Firebase Storage

### ✨ คุณสมบัติ

1. **Google Custom Search Integration**: ค้นหาผ่าน Google Custom Search API
2. **Suspicious Website Detection**: ตรวจจับเว็บต้องสงสัย (เว็บพนัน) อัตโนมัติ
3. **Automatic Screenshot**: ทำ screenshot เว็บต้องสงสัยและเก็บใน Firebase Storage
4. **Firebase Storage Upload**: อัปโหลดรูปภาพไปยัง Firebase Storage และส่ง URL กลับมา

### 🛠️ Dependencies เพิ่มเติม

```toml
playwright = ">=1.49.0,<2.0.0"
requests = ">=2.32.3,<3.0.0"
```

### 🔧 การติดตั้ง

1. ติดตั้ง dependencies:

```bash
poetry install
```

2. ติดตั้ง Playwright browser:

```bash
poetry run playwright install chromium
```

3. ตั้งค่า environment variables ใน `.env`:

```env
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id
FIREBASE_CRED_PATH=path/to/service-account.json
FIREBASE_STORAGE_BUCKET=your-firebase-bucket.appspot.com
```

### 🚀 API Endpoints

#### 1. Search with Screenshot

```
GET /v1/crawler/search?query=บาคาร่า
```

**Response:**

```json
[
  {
    "title": "ชื่อเว็บไซต์",
    "link": "https://example.com",
    "snippet": "คำอธิบาย",
    "screenshot_url": "https://firebasestorage.googleapis.com/...",
    "is_suspicious": true
  }
]
```

#### 2. Manual Screenshot

```
POST /v1/crawler/screenshot?url=https://example.com&title=Example
```

**Response:**

```json
{
  "success": true,
  "url": "https://example.com",
  "screenshot_url": "https://firebasestorage.googleapis.com/...",
  "message": "Screenshot captured successfully"
}
```

### 🔍 Suspicious Terms Detection

ระบบจะตรวจสอบคำต้องสงสัยเหล่านี้:

- พนัน, บาคาร่า, casino, หวย
- โป๊กเกอร์, slot, แทงบอล
- gambling, bet

### 📸 Screenshot Features

- **Full Page Screenshot**: ทำ screenshot ทั้งหน้า
- **High Resolution**: ความละเอียด 1920x1080
- **Auto Upload**: อัปโหลดไปยัง Firebase Storage อัตโนมัติ
- **Public URL**: ส่ง URL สาธารณะกลับมาใช้งาน

### 🗂️ File Structure

```
screenshots/
  ├── suspicious_site_1_domain.com.png
  ├── suspicious_site_2_domain.com.png
  └── ...
```

### 🛡️ Error Handling

- Timeout handling สำหรับเว็บไซต์ที่โหลดช้า
- Retry mechanism สำหรับการอัปโหลด Firebase
- Graceful error handling สำหรับ screenshot ที่ล้มเหลว

### 📊 Logging

ระบบใช้ `loguru` สำหรับ logging:

- ✅ Screenshot สำเร็จ
- ⚠️ เว็บต้องสงสัยที่พบ
- ❌ Error ต่างๆ

### 🔧 การทดสอบ

รันไฟล์ทดสอบ:

```bash
poetry run python test_crawler.py
```

### 🎯 การใช้งานใน Frontend

```typescript
// เรียก API
const response = await fetch("/v1/crawler/search?query=บาคาร่า");
const results = await response.json();

// แสดงรูป screenshot
results.forEach((result) => {
  if (result.is_suspicious && result.screenshot_url) {
    // แสดงรูป screenshot ในหน้าเว็บ
    console.log("Screenshot URL:", result.screenshot_url);
  }
});
```

### 🔮 Future Enhancements

- [ ] Batch screenshot processing
- [ ] Image compression
- [ ] Screenshot thumbnails
- [ ] Advanced content analysis
- [ ] Real-time monitoring dashboard
