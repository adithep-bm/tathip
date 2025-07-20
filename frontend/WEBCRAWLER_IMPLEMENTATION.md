# WebCrawler Implementation Guide

## ภาพรวม

หน้า WebCrawlerPage ได้ถูก implement เพื่อเชื่อมต่อกับ Crawler API ที่สร้างใน backend และมีฟีเจอร์ครบถ้วนสำหรับการตรวจสอบเว็บไซต์ต้องสงสัย

## ฟีเจอร์ที่ implement แล้ว

### 1. การเชื่อมต่อ API

- **เชื่อมต่อกับ `/v1/crawler/search`** endpoint
- **แปลง API response** จาก `SearchResult` เป็น `CrawlResult` สำหรับ UI
- **Error handling** เมื่อเกิดข้อผิดพลาดในการเรียก API

### 2. ระบบค้นหา

#### A. ค้นหาด่วน (Manual Search)

- กล่องค้นหาที่สามารถใส่คำค้นหาและกดค้นหาทันที
- รองรับการกด Enter เพื่อค้นหา
- แสดง loading state ขณะกำลังค้นหา

#### B. การทำงานอัตโนมัติ (Auto Crawler)

- ค้นหาตามคำสำคัญที่ตั้งไว้ทั้งหมด
- ทำงานเป็น batch โดยมี delay ระหว่างการค้นหา
- ตรวจสอบว่ามีคำสำคัญก่อนเริ่มการทำงาน

### 3. จัดการคำสำคัญ

- **เพิ่มคำสำคัญใหม่** ผ่านช่องกรอกข้อมูล
- **ลบคำสำคัญ** แต่ละคำ
- **ล้างคำสำคัญทั้งหมด** ด้วยปุ่มเดียว
- **คำสำคัญเริ่มต้น**: ['พนัน', 'บาคาร่า', 'casino', 'แทงบอล']

### 4. แสดงผลลัพธ์

#### A. สถิติสรุป

- จำนวนเว็บไซต์ทั้งหมด
- จำนวนเว็บไซต์ปกติ (สีเขียว)
- จำนวนเว็บไซต์น่าสงสัย (สีเหลือง)
- จำนวนเว็บไซต์ต้องสงสัย (สีแดง)

#### B. รายละเอียดเว็บไซต์

- **ชื่อเว็บไซต์** (title)
- **URL** ของเว็บไซต์
- **คำอธิบาย** (snippet) จาก Google Search
- **คำสำคัญที่พบ** (แยกจาก title และ snippet)
- **สถานะ** (ปกติ/น่าสงสัย/ต้องสงสัย)
- **เวลาที่ตรวจสอบล่าสุด**

### 5. การจัดการข้อมูล

- **ล้างข้อมูลทั้งหมด** ด้วยปุ่มล้างข้อมูล
- **เพิ่มผลลัพธ์ใหม่** ไปยังรายการเดิม (ไม่เขียนทับ)
- **ป้องกันการทำงานซ้ำซ้อน** ขณะกำลังค้นหา

## การทำงานของระบบ

### 1. Data Flow

```
User Input → Frontend (WebCrawlerPage) → API Call → Backend (crawler.py) → Google Search API → Response → Frontend Update
```

### 2. API Integration

```typescript
// เรียก API
const response = await axiosInstance.get(
  `/v1/crawler/search?query=${encodeURIComponent(query)}`
);

// แปลง response
const searchResults: SearchResult[] = response.data;
const newResults: CrawlResult[] = searchResults.map((result) => ({
  id: (results.length + index + 1).toString(),
  url: result.link,
  title: result.title,
  snippet: result.snippet,
  keywords: extractKeywords(result.title + " " + result.snippet),
  status: result.is_suspicious ? "flagged" : "safe",
  lastCrawled: new Date().toLocaleString("th-TH"),
}));
```

### 3. Keyword Extraction

```typescript
const extractKeywords = (text: string): string[] => {
  const suspiciousTerms = [
    "พนัน",
    "บาคาร่า",
    "casino",
    "หวย",
    "โป๊กเกอร์",
    "slot",
    "แทงบอล",
    "gambling",
    "bet",
  ];
  const foundKeywords = suspiciousTerms.filter((term) =>
    text.toLowerCase().includes(term.toLowerCase())
  );
  return foundKeywords.length > 0 ? foundKeywords : ["ไม่พบคำสำคัญ"];
};
```

## UI Components

### 1. Control Panel

- **ค้นหาด่วน**: Input + Search button
- **การทำงานอัตโนมัติ**: Start/Stop button
- **จัดการคำสำคัญ**: Add/Remove keywords

### 2. Results Section

- **สถิติสรุป**: แสดงจำนวนแต่ละประเภท
- **รายการเว็บไซต์**: แสดงรายละเอียดแต่ละเว็บ
- **การจัดการ**: ปุ่มดูรายละเอียด, สร้างคดี, เพิ่มใน Watchlist

### 3. Status Indicators

- **สถานะระบบ**: จุดสีเขียว/เทา แสดงว่ากำลังทำงานหรือไม่
- **สถานะการค้นหา**: Loading spinner และข้อความ
- **สถานะเว็บไซต์**: ไอคอนและสีตามระดับความเสี่ยง

## การใช้งาน

### 1. ค้นหาทันที

1. ใส่คำค้นหาในช่อง "ค้นหาด่วน"
2. กดปุ่ม "ค้นหา" หรือกด Enter
3. รอผลลัพธ์และดูในส่วน "ผลการตรวจสอบ"

### 2. การทำงานอัตโนมัติ

1. เพิ่มคำสำคัญที่ต้องการในส่วน "จัดการคำค้นหา"
2. กดปุ่ม "เริ่มการทำงาน"
3. ระบบจะค้นหาตามคำสำคัญทั้งหมดอัตโนมัติ
4. กดปุ่ม "หยุดการทำงาน" เพื่อหยุด

### 3. จัดการผลลัพธ์

- ดูรายละเอียดเว็บไซต์ด้วยปุ่ม "ดูรายละเอียด"
- สร้างคดีสำหรับเว็บต้องสงสัยด้วยปุ่ม "สร้างคดี"
- เพิ่มเว็บไซต์ใน Watchlist ด้วยปุ่ม "เพิ่มใน Watchlist"
- ล้างข้อมูลทั้งหมดด้วยปุ่ม "ล้างข้อมูล"

## ประโยชน์ของการ Implementation นี้

### 1. ประสิทธิภาพ

- เชื่อมต่อ API จริงแทนข้อมูล mock
- ได้ข้อมูลเว็บไซต์จริงจาก Google Search
- ตรวจจับเว็บต้องสงสัยได้แม่นยำ

### 2. ความสะดวก

- ค้นหาได้ทั้งแบบทันทีและอัตโนมัติ
- จัดการคำสำคัญได้ง่าย
- แสดงผลชัดเจนและเข้าใจง่าย

### 3. ความปลอดภัย

- ใช้ axiosInstance ที่มี authentication
- Error handling ที่ครอบคลุม
- ป้องกันการเรียก API ซ้ำซ้อน

### 4. ความยืดหยุ่น

- เพิ่มคำสำคัญได้ตามต้องการ
- ปรับแต่งการแสดงผลได้
- ขยายฟีเจอร์ได้ในอนาคต
