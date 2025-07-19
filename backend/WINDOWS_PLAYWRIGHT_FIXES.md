# การแก้ไขปัญหา Playwright บน Windows

## ปัญหาที่พบ

- `NotImplementedError` ใน asyncio subprocess บน Windows
- Browser ปิดตัวเองขณะทำงาน (TargetClosedError)
- Playwright ไม่สามารถทำงานได้เสถียรบน Windows

## แนวทางแก้ไข

### 1. ปรับปรุง `capture_screenshot()` function

- เพิ่ม fallback mechanism
- ใช้ `_try_playwright_screenshot()` ก่อน
- หากล้มเหลว ใช้ `_try_fallback_screenshot()`

### 2. ปรับ Browser Configuration สำหรับ Windows

```python
browser_args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-ipc-flooding-protection',
    '--disable-features=VizDisplayCompositor',
    '--headless',
    '--remote-debugging-port=0',
    '--single-process',  # สำหรับ Windows
    '--disable-web-security',
    '--ignore-certificate-errors',
    '--disable-background-networking'
]
```

### 3. เพิ่ม Placeholder Screenshot

- สร้าง endpoint `/screenshot-simple` สำหรับทดสอบ
- ใช้ PIL (Pillow) สร้างรูป placeholder
- อัปโหลดไปยัง Firebase Storage เพื่อทดสอบ

### 4. ปรับ Context และ Page Management

```python
context = await browser.new_context(
    viewport={"width": 1920, "height": 1080},
    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
)
page = await context.new_page()
```

## วิธีการทดสอบ

### 1. ทดสอบ Placeholder Screenshot

```bash
curl -X POST "http://localhost:8000/v1/crawler/screenshot-simple"
```

### 2. ทดสอบ Playwright Screenshot

```bash
curl -X POST "http://localhost:8000/v1/crawler/screenshot?url=https://www.google.com&title=Google"
```

### 3. ทดสอบผ่าน Search

```bash
curl -X GET "http://localhost:8000/v1/crawler/search?query=พนัน"
```

## แนวทางทางเลือก (หากปัญหายังคงอยู่)

### 1. ใช้ Windows Subsystem for Linux (WSL)

```bash
# ติดตั้ง WSL และรัน backend ใน Linux environment
wsl --install
```

### 2. ใช้ Docker

```dockerfile
FROM python:3.11-slim
# รัน backend ใน container
```

### 3. ใช้ Alternative Libraries

- **html2image**: สำหรับ screenshot แบบง่าย
- **selenium**: ใช้ WebDriver แทน Playwright
- **pyppeteer**: Python wrapper สำหรับ Puppeteer

### 4. ใช้ External Services

- **Puppeteer Service**: รัน Puppeteer แยกเป็น service
- **Screenshot APIs**: ใช้ external APIs เช่น htmlcsstoimage.com

## การติดตั้ง Dependencies เพิ่มเติม

### สำหรับ html2image

```bash
poetry add html2image
```

### สำหรับ selenium

```bash
poetry add selenium webdriver-manager
```

## หมายเหตุ

- Windows มักมีปัญหากับ subprocess และ browser automation
- ควรพิจารณาใช้ Linux environment สำหรับ production
- Fallback mechanism ช่วยให้ระบบยังคงทำงานได้แม้ Playwright ล้มเหลว
