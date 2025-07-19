# 🔧 Troubleshooting: Screenshot = NULL

## ปัญหาที่พบบ่อย

### 1. 🔍 ตรวจสอบสาเหตุ

ใช้ endpoint debug เพื่อตรวจสอบระบบ:

```bash
curl http://localhost:8000/v1/crawler/debug
```

### 2. 🧪 ทดสอบ Screenshot แบบง่าย

ทดสอบ screenshot โดยไม่ต้องใช้ Firebase:

```bash
curl -X POST "http://localhost:8000/v1/crawler/screenshot-test"
curl -X POST "http://localhost:8000/v1/crawler/screenshot-test?url=https://www.google.com"
```

**ผลลัพธ์ที่คาดหวัง:**

```json
{
  "success": true,
  "url": "https://www.google.com",
  "screenshot_size_bytes": 123456,
  "message": "Screenshot test successful! (Not uploaded to Firebase)",
  "firebase_upload": "Skipped for testing"
}
```

## 🔧 สาเหตุที่อาจทำให้ Screenshot = NULL

### 1. ⚙️ Firebase Configuration ไม่ถูกต้อง

**ตรวจสอบ:**

```bash
# ตรวจสอบว่ามีไฟล์ service account หรือไม่
ls backend/service-account.json

# ตรวจสอบ environment variables
echo $FIREBASE_CRED_PATH
echo $FIREBASE_STORAGE_BUCKET
```

**แก้ไข:**

```env
# ใน .env file
FIREBASE_CRED_PATH=backend/service-account.json
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

### 2. 🌐 เว็บไซต์ไม่สามารถเข้าถึงได้

**ตรวจสอบ:**

- เว็บไซต์มี CAPTCHA หรือ bot detection
- เว็บไซต์ต้องการ authentication
- เว็บไซต์โหลดช้าหรือ timeout

**แก้ไข:**

```bash
# ทดสอบกับเว็บไซต์ง่ายๆ ก่อน
curl -X POST "http://localhost:8000/v1/crawler/screenshot-test?url=https://www.google.com"
```

### 3. 🚫 Playwright ไม่ทำงาน

**ตรวจสอบ:**

```bash
# ตรวจสอบว่า browser ติดตั้งแล้วหรือไม่
poetry run playwright install --help
```

**แก้ไข:**

```bash
# ติดตั้ง browser อีกครั้ง
poetry run playwright install chromium
```

### 4. 💾 Firebase Storage Permission

**ตรวจสอบ:**

- Service account มี Storage Admin permissions
- Firebase Storage Rules อนุญาตการเขียน
- Project billing เปิดอยู่

### 5. 🔗 Network Issues

**ตรวจสอบ:**

```bash
# ทดสอบการเชื่อมต่อ internet
ping google.com

# ทดสอบ Firebase connectivity
curl -I https://firebasestorage.googleapis.com
```

## 🔍 Debug Steps

### Step 1: ทดสอบพื้นฐาน

```bash
curl http://localhost:8000/v1/crawler/test
curl http://localhost:8000/v1/crawler/debug
```

### Step 2: ทดสอบ Screenshot ไม่ใช้ Firebase

```bash
curl -X POST "http://localhost:8000/v1/crawler/screenshot-test"
```

### Step 3: ดู Logs

ดู terminal ที่รัน server เพื่อดู error messages:

```
🎯 Starting screenshot for: https://example.com
🚀 Launching browser...
📡 Navigating to: https://example.com
📷 Taking screenshot...
✅ Screenshot taken, size: 123456 bytes
📄 Generated filename: example.png
☁️ Uploading to Firebase Storage...
❌ Firebase upload returned None  <-- ปัญหาอยู่ตรงนี้
```

### Step 4: ทดสอบ Firebase แยก

```python
# ทดสอบ Firebase แยกใน Python shell
from backend.configs.firebase import upload_file_to_storage
import asyncio

async def test():
    test_data = b"test data"
    result = await upload_file_to_storage(test_data, "test.txt", "text/plain")
    print(result)

asyncio.run(test())
```

## 🛠️ วิธีแก้ไขทีละขั้น

### 1. ถ้า screenshot-test ทำงาน แต่ screenshot ไม่ทำงาน

➡️ ปัญหาอยู่ที่ Firebase upload

### 2. ถ้า screenshot-test ไม่ทำงาน

➡️ ปัญหาอยู่ที่ Playwright หรือ network

### 3. ถ้า debug แสดง Firebase config ไม่ถูกต้อง

➡️ ตั้งค่า environment variables ใหม่

## 📞 การขอความช่วยเหลือ

เมื่อขอความช่วยเหลือ ให้แนบ:

1. ผลลัพธ์จาก `/debug` endpoint
2. ผลลัพธ์จาก `/screenshot-test` endpoint
3. Error logs จาก terminal
4. Environment variables configuration (ไม่ต้องแนบ secret keys)
