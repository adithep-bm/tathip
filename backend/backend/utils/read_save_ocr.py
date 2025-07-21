import io
import os
from PIL import Image
from loguru import logger
import re
from pyzbar.pyzbar import decode
import pandas as pd

def has_qr_code(image_data: bytes) -> bool:
    try:
        return len(decode(Image.open(io.BytesIO(image_data)))) > 0
    except Exception:
        return False
    
# --- ฟังก์ชัน Helper ที่ปรับปรุงแล้ว ---
def save_ocr_results(case_id: int | None, text: str, filename: str) -> None:
    """บันทึกผลลัพธ์ OCR ลงในไดเรกทอรี local"""
    base_dir = "ocr_results"
    case_dir = os.path.join(base_dir, f"case_{case_id}" if case_id else "uncategorized")
    os.makedirs(case_dir, exist_ok=True)
    output_path = os.path.join(case_dir, f"{filename}.txt")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(text)

def detect_bank(text):
    """Detect bank from OCR text content."""
    text_lower = text.strip().lower()
    words = text.strip().lower().split()

    if words and words[0] == 'scb':
        return 'scb'
    
    elif words and words[0] == 'krungthai':
        return 'krungthai'
    
    elif re.search(r'\bgsb\b', text_lower) or 'ธนาคารออมสิน' in text_lower:
        return 'gsb'

    elif (
        (match_kbank_regex := re.search(r'(จาก|^)\s*[นสย]\.?\s*[\u0E00-\u0E7F\s\.]+ธ\.?กสิกรไทย', text)) or
        (has_kasikorn := 'กสิกรไทย' in text_lower) or
        (has_kbank := 'kbank' in text_lower) or
        (has_kplus := 'k+' in text_lower) or
        (has_make := 'ake' in text_lower)
    ):
        # 🔍 Show what matched
        # if match_kbank_regex:
        #     print("🔍 Matched regex: sender name + ธ.กสิกรไทย")
        #     print("→", match_kbank_regex.group())
        # elif has_kasikorn:
        #     print("🔍 Matched: 'กสิกรไทย' in text_lower")
        # elif has_kbank:
        #     print("🔍 Matched: 'kbank' in text_lower")
        # elif has_kplus:
        #     print("🔍 Matched: 'k+' in text_lower")
        # elif has_make:
        #     print("🔍 Matched: 'ake' in text_lower")

        return 'kbank'
    
    elif words and words[0] == 'bangkok':
        return 'bangkok'
    
    else:
        return 'unknown'


def handle_scb(text, image_path):
    print("🔁 ไทยพาณิชย์ (SCB)")

    # ใช้ re เพื่อแยกบรรทัดที่ไม่ว่าง
    lines = [line.strip() for line in text.split('\n') if line.strip()]

    # ใช้ re เพื่อดึงข้อความตั้งแต่ "โอนเงินสำเร็จ" เป็นต้นไปเป็น datetime
    date_match = re.search(r'โอนเงินสำเร็จ(.*?)รหัสอ้างอิง', text, re.DOTALL)
    date = date_match.group(1).strip() if date_match else 'ไม่พบวันที่'
    
    # ใช้ re เพื่อจับชื่อผู้โอนและเลขบัญชีจากคำว่า "จาก"
    sender_name_match = re.search(r'จาก\s*([\u0E00-\u0E7F]+\s[\u0E00-\u0E7F]+\s?[\u0E00-\u0E7F]+)', text)
    sender_name = sender_name_match.group(1) if sender_name_match else 'ไม่พบชื่อผู้โอน'
    
    # ใช้ re เพื่อจับเลขบัญชีผู้โอนจากคำว่า "จาก" (เลขบัญชีอาจจะมีช่องว่างหรือขีดกลาง)
    sender_acc_match = re.search(r'((?:x{1,3}[\s-]?){1,2}\d{3,4}-?\d?)', text.lower())
    sender_acc = sender_acc_match.group(1) if sender_acc_match else 'ไม่พบเลขบัญชี'
    
    # ใช้ re เพื่อจับชื่อผู้รับและเลขบัญชีผู้รับจากคำว่า "ไปยัง"
    # ชื่อผู้รับ (รองรับคำนำหน้า เช่น น.ส. / นาย / นาง)
    receiver_name_match = re.search(  r'ไปยัง\s*((?:[นสย]\.?\s*)?(?:[\u0E00-\u0E7F\.]+(?:\s+[\u0E00-\u0E7F]+)*))', text)
    receiver_name = receiver_name_match.group(1).strip() if receiver_name_match else 'ไม่พบชื่อผู้รับ'

    # ใช้ re เพื่อจับเลขบัญชีผู้รับจากคำว่า "ไปยัง" (เลขบัญชีผู้รับก็อาจมีช่องว่างหรือขีดกลาง)
    receiver_acc_match = re.search(r'ไปยัง.*?((?:x{1,3}[\s-]?){1,2}\d{3,4}-?\d?)', text.lower())
    receiver_acc = receiver_acc_match.group(1) if receiver_acc_match else "ไม่พบเลขบัญชีผู้รับ"
    
    # ใช้ re เพื่อจับจำนวนเงินจากคำว่า "จำนวนเงิน"
    amount_match = re.search(r'จำนวนเงิน\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', text)
    amount = amount_match.group(1) if amount_match else "ไม่พบจำนวนเงิน"

    qr_result = read_qr_code(image_path)

    # debug
    success_index = text.lower().find("โอนเงินสำเร็จ")
    if success_index != -1:
        after_success = text[success_index:success_index + 100]
        print("🧾 ข้อความหลัง 'โอนเงินสำเร็จ':", after_success)
    else:
        print("❌ ไม่พบคำว่า 'โอนเงินสำเร็จ'")

    # Output ข้อมูลที่แยกออกจาก OCR
    print("👤 ผู้โอน:", sender_name)
    print("   เลขบัญชี:", sender_acc)
    print("👤 ผู้รับ:", receiver_name)
    print("   เลขบัญชี:", receiver_acc)
    print("💰 จำนวนเงิน:", amount)
    print("📅 วันที่โอน:", date)
    print("QR code text:", qr_result)

    return {
        "sender_name": sender_name,
        "sender_bank": "ไทยพาณิชย์",
        "sender_acc": sender_acc,
        "receiver_name": receiver_name,
        "receiver_bank": "ไม่ระบุ",  # SCB slip มักไม่มีชื่อธนาคารผู้รับ
        "receiver_acc": receiver_acc,
        "amount": amount,
        "date": date,
        "qr_code_text": qr_result
    }

def handle_krungthai(text, image_path):
    print("🔁 กรุงไทย")

    # ใช้ re เพื่อแยกบรรทัดที่ไม่ว่าง
    lines = [line.strip() for line in text.split('\n') if line.strip()]

    # ใช้ re เพื่อดึงข้อความตั้งแต่ "โอนเงินสำเร็จ" เป็นต้นไปเป็น datetime
    date_match = re.search(r'วันที่ทำรายการ\s+(\d{1,2}\s[ก-ฮ]{1,5}\.[ก-ฮ]{1,5}\.\s\d{4}\s\d{2}:\d{2})', text, re.DOTALL)
    date = date_match.group(1).strip() if date_match else 'ไม่พบวันที่'
    
    # ดึงข้อความตั้งแต่ "จาก" เป็นต้นไป
    sender_segment = text[text.find("จาก"):text.find("ไปยัง") if "ไปยัง" in text else len(text)]
    # ชื่อผู้โอน
    sender_name_match = re.search(r'จาก\s*((?:[นสย]\.?\s*)?(?:[\u0E00-\u0E7F\.]+))', sender_segment)
    sender_name = sender_name_match.group(1).strip() if sender_name_match else 'ไม่พบชื่อผู้โอน'
    # ธนาคารผู้โอน
    sender_bank_match = re.search(r'จาก\s+[\u0E00-\u0E7F\s.]+?\s+([\u0E00-\u0E7F]+)', sender_segment)
    sender_bank = sender_bank_match.group(1) if sender_bank_match else 'ไม่พบชื่อธนาคารผู้โอน'
    # เลขบัญชีผู้โอน
    sender_acc_match = re.search(r'(?:x{1,3}[\s-]?){1,2}\d{3,4}-?\d?', sender_segment.lower())
    sender_acc = sender_acc_match.group() if sender_acc_match else 'ไม่พบเลขบัญชี'

    # ดึงข้อความตั้งแต่ "ไปยัง" เป็นต้นไป
    receiver_segment = text[text.find("ไปยัง"):text.find("จำนวน") if "จำนวน" in text else len(text)]
    # ชื่อผู้รับ
    receiver_name_match = re.search(
        r'ไปยัง\s*((?:น\.ส\.|นางสาว|นาย|นาง)?\s*[\u0E00-\u0E7F]+(?:\s[\u0E00-\u0E7F]+)?)',receiver_segment
    )
    receiver_name = receiver_name_match.group(1).strip() if receiver_name_match else 'ไม่พบชื่อผู้รับ'
    # ธนาคารผู้รับ
    receiver_bank_match = re.search(r'ไปยัง\s+[\u0E00-\u0E7F\s.]+?\s+([\u0E00-\u0E7F]+)?\s+([\u0E00-\u0E7F]+)?\s+([\u0E00-\u0E7F]+)', receiver_segment)
    receiver_bank = receiver_bank_match.group(3) if receiver_bank_match else 'ไม่พบชื่อธนาคารผู้รับ'
    # เลขบัญชีผู้รับ
    receiver_acc_match = re.search(r'(?:x{1,3}[\s-]?){1,2}\d{3,4}-?\d?', receiver_segment.lower())
    receiver_acc = receiver_acc_match.group() if receiver_acc_match else 'ไม่พบเลขบัญชี'

    # จำนวนเงิน
    amount_match = re.search(r'จำนวนเงิน\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', text)
    amount = amount_match.group(1) if amount_match else "ไม่พบจำนวนเงิน"

    qr_result = read_qr_code(image_path)

    # Output แสดงผล
    print("sender_segment:", sender_segment)
    print("receiver_segment:", receiver_segment)
    print("👤 ผู้โอน:", sender_name)
    print("   ธนาคาร:", sender_bank)
    print("   เลขบัญชี:", sender_acc)
    print("👤 ผู้รับ:", receiver_name)
    print("   ธนาคาร:", receiver_bank)
    print("   เลขบัญชี:", receiver_acc)
    print("💰 จำนวนเงิน:", amount)
    print("📅 วันที่โอน:", date)
    print("QR code text:", qr_result)

    # Return ข้อมูล
    return {
        'sender_name': sender_name,
        'sender_bank': sender_bank,
        'sender_acc': sender_acc,
        'receiver_name': receiver_name,
        'receiver_bank': receiver_bank,
        'receiver_acc': receiver_acc,
        'amount': amount,
        'date' : date,
        "qr_code_text": qr_result
    }

def handle_gsb(text, image_path):
    print("🔁 ออมสิน (GSB)")

    # Sender name
    sender_name_match = re.search(r'จาก\s+([นาย|นาง|น.ส.|นางสาว]*[\u0E00-\u0E7F\s]+?)\s+ธนาคารออมสิน', text)
    sender_name = sender_name_match.group(1).strip() if sender_name_match else "ไม่พบชื่อผู้โอน"

    # ใช้ re เพื่อดึงข้อความตั้งแต่ "โอนเงินสำเร็จ" เป็นต้นไปเป็น datetime
    date_match = re.search(r'รหัสอ้างอิง:\s+(\d{10,20}[^\w\d]?\d{5,20})\s+(\d{1,2}[ก-ฮ]{1,5}\.[ก-ฮ]{1,5}\.\s\d{4}\s\d{2}:\d{2})', text, re.DOTALL)
    date = date_match.group(2).strip() if date_match else 'ไม่พบวันที่'

    # Sender bank
    sender_bank = "ธนาคารออมสิน" if "ธนาคารออมสิน" in text else "ไม่พบชื่อธนาคารผู้โอน"

    # Sender account
    sender_acc_match = re.search(r'ธนาคารออมสิน\s+(\d{4}x{4,}[\d]+)', text)
    sender_acc = sender_acc_match.group(1) if sender_acc_match else "ไม่พบเลขบัญชีผู้โอน"

    # Receiver name: รองรับ "เติมเงินพร้อมเพย์" และมี . หรือ ~ คั่น
    receiver_name_match = re.search(
        r'ถึง\s+([นาย|นาง|น\.ส\.|นางสาว]*[\u0E00-\u0E7F\s.]+?)\s+(?:เติมเงิน)?\s*(?:พร้อมเพย์|พร้อมจ่าย)',
        text
    )
    receiver_name = receiver_name_match.group(1).strip() if receiver_name_match else "ไม่พบชื่อผู้รับ"

    # Receiver bank
    receiver_bank_match = re.search(r'(เติมเงิน)?\s*(พร้อมเพย์|พร้อมจ่าย)', text)
    receiver_bank = receiver_bank_match.group(0).strip() if receiver_bank_match else "ไม่พบช่องทางผู้รับ"

    # Receiver account: รองรับช่องว่าง, 'เาง', หรือไม่มี space ระหว่าง
    receiver_acc_match = re.search(
        r'(?:พร้อมเพย์|พร้อมจ่าย)[\s\w]*?(\d{4}x{4,}[\d]+)', text
    )
    receiver_acc = receiver_acc_match.group(1) if receiver_acc_match else "ไม่พบเลขบัญชีผู้รับ"

    # Amount
    amount_match = re.search(r'จำนวนเงิน\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', text)
    amount = amount_match.group(1) if amount_match else "ไม่พบจำนวนเงิน"

    qr_result = read_qr_code(image_path)

    # Output ข้อมูลที่แยกออกจาก OCR
    print("👤 ผู้โอน:", sender_name)
    print("   เลขบัญชี:", sender_acc)
    print("👤 ผู้รับ:", receiver_name)
    print("   เลขบัญชี:", receiver_acc)
    print("💰 จำนวนเงิน:", amount)
    print("📅 วันที่โอน:", date)
    print("QR code text:", qr_result)

    return {
        "sender_name": sender_name,
        "sender_bank": "ธนาคารออมสิน",
        "sender_acc": sender_acc,
        "receiver_name": receiver_name,
        "receiver_bank": receiver_bank,
        "receiver_acc": receiver_acc,
        "amount": amount,
        "date": date,
        "qr_code_text": qr_result
    }

def handle_kbank(text, image_path): 
    print("🔁 กสิกรไทย (KBank)")

    # Sender name
    sender_name_match = re.search(
        r'(?:น\.ส\.|นางสาว|นาย|นาง)\s*[\u0E00-\u0E7F]+\s[\u0E00-\u0E7F\.]+',
        text
    )
    sender_name = sender_name_match.group() if sender_name_match else "ไม่พบชื่อผู้โอน"

    # ใช้ re เพื่อดึงข้อความตั้งแต่ "โอนเงินสำเร็จ" เป็นต้นไปเป็น datetime
    date_match = re.search(r'โอนเงินสำเร็จ(.*?\น.)', text, re.DOTALL)
    date = date_match.group(1).strip() if date_match else 'ไม่พบวันที่'

    # Sender bank (assume first ธ.กสิกรไทย after sender name)
    sender_bank_match = re.search(
        r'{}[\s.]*ธ\.กสิกรไทย'.format(re.escape(sender_name)),
        text
    )
    sender_bank = "ธ.กสิกรไทย" if sender_bank_match else "ไม่พบชื่อธนาคารผู้โอน"

    # Sender account (first masked pattern)
    sender_acc_match = re.search(
        r'(?:x{1,3}[\s\-]?){1,3}\d{3,4}-?(?:\d|x)?',
        text.lower()
    )
    sender_acc = sender_acc_match.group() if sender_acc_match else "ไม่พบเลขบัญชีผู้โอน"

    # Receiver name (second name after first account)
    receiver_name_match = re.findall(
        r'(?:น\.ส\.|นางสาว|นาย|นาง)\s*[\u0E00-\u0E7F]+\s[\u0E00-\u0E7F\.]+',
        text
    )
    receiver_name = receiver_name_match[1] if len(receiver_name_match) > 1 else "ไม่พบชื่อผู้รับ"

    # Receiver bank (second ธ.กสิกรไทย)
    receiver_bank_match = re.findall(
        r'ธ\.กสิกรไทย',
        text
    )
    receiver_bank = receiver_bank_match[1] if len(receiver_bank_match) > 1 else "ไม่พบชื่อธนาคารผู้รับ"

    # Receiver account (second masked pattern)
    receiver_acc_match = re.findall(
        r'(?:x{1,3}[\s\-]?){1,3}\d{3,4}-?(?:\d|x)?',
        text.lower()
    )
    receiver_acc = receiver_acc_match[1] if len(receiver_acc_match) > 1 else "ไม่พบเลขบัญชีผู้รับ"

    # Amount
    amount_match = re.search(
        r'จำนวน:\s*([\d,]+\.\d{2})',
        text
    )
    amount = amount_match.group(1) if amount_match else "ไม่พบจำนวนเงิน"

    qr_result = read_qr_code(image_path)

    # Output
    print("👤 ผู้โอน:", sender_name)
    print("   ธนาคาร:", sender_bank)
    print("   เลขบัญชี:", sender_acc)
    print("👤 ผู้รับ:", receiver_name)
    print("   ธนาคาร:", receiver_bank)
    print("   เลขบัญชี:", receiver_acc)
    print("💰 จำนวนเงิน:", amount)
    print("📅 วันที่โอน:", date)
    print("QR code text:", qr_result)

    return {
        "sender_name": sender_name,
        "sender_bank": "ธนาคารกสิกรไทย",
        "sender_acc": sender_acc,
        "receiver_name": receiver_name,
        "receiver_bank": receiver_bank,
        "receiver_acc": receiver_acc,
        "amount": amount,
        "date": date,
        "qr_code_text": qr_result
    }

def handle_bangkok(text, image_path): 
    print("🔁 กรุงเทพ")

    # Sender name
    sender_name_match = re.search(r'จาก\s+(น\.ส\.|นางสาว|นาย|นาง)\s*([\u0E00-\u0E7F]+)', text)
    sender_name = f"{sender_name_match.group(1)} {sender_name_match.group(2)}" if sender_name_match else "ไม่พบชื่อผู้โอน"

    # ใช้ re เพื่อดึงข้อความตั้งแต่ "โอนเงินสำเร็จ" เป็นต้นไปเป็น datetime
    date_match = re.search(r'รายการสำเร็จ(.*?)จำนวนเงิน', text, re.DOTALL)
    date = date_match.group(1).strip() if date_match else 'ไม่พบวันที่'

    # Sender account (look for 3-digit + dash + masked)
    sender_acc_match = re.search(r'จาก.*?(\d{3}-\d(?:[\s\-]?[x\d]{3,6}))', text.lower())
    sender_acc = sender_acc_match.group(1) if sender_acc_match else 'ไม่พบเลขบัญชี'

    # Sender bank
    sender_bank = "ธนาคารกรุงเทพ" if "ธนาคารกรุงเทพ" in text else "ไม่พบชื่อธนาคารผู้โอน"

    # Receiver name (match first Thai full name after 'ไปที่')
    receiver_name_match = re.search(r'ไปที่.*?(น\.ส\.|นางสาว|นาย|นาง)?\s*([\u0E00-\u0E7F\s]+?)\s+\d{3}', text)
    receiver_name = f"{receiver_name_match.group(1)} {receiver_name_match.group(2).strip()}" if receiver_name_match else "ไม่พบชื่อผู้รับ"

    # Receiver account
    receiver_acc_match = re.search(r'จาก.*?(\d{3}-\d(?:[\s\-]?[x]{1,3}){0,2}[\s\-]?\d{2,4})', text.lower())
    receiver_acc = receiver_acc_match.group(1) if receiver_acc_match else "ไม่พบเลขบัญชีผู้รับ"

    # Receiver bank
    receiver_bank_match = re.search(r'ไปที่.*?(ธนาคาร[\u0E00-\u0E7F]+)', text)
    receiver_bank = receiver_bank_match.group(1) if receiver_bank_match else ("พร้อมเพย์" if "พร้อมเพย์" in text else "ไม่พบชื่อธนาคารผู้รับ")

    # Amount
    amount_match = re.search(r'จำนวนเงิน\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', text)
    amount = amount_match.group(1) if amount_match else "ไม่พบจำนวนเงิน"

    qr_result = read_qr_code(image_path)

    # Output
    print("👤 ผู้โอน:", sender_name)
    print("   ธนาคาร:", sender_bank)
    print("   เลขบัญชี:", sender_acc)
    print("👤 ผู้รับ:", receiver_name)
    print("   ช่องทาง:", receiver_bank)
    print("   เลขบัญชี:", receiver_acc)
    print("💰 จำนวนเงิน:", amount)
    print("📅 วันที่โอน:", date)
    print("QR code text:", qr_result)

    return {
        "sender_name": sender_name,
        "sender_bank": "กรุงเทพ",
        "sender_acc": sender_acc,
        "receiver_name": receiver_name,
        "receiver_bank": receiver_bank,
        "receiver_acc": receiver_acc,
        "amount": amount,
        "date": date,
        "qr_code_text": qr_result
    }

def handle_unknown(text, image_path): 
    print("⚠️ ไม่สามารถระบุธนาคารได้")

# Additional Functions
def log_data(file_name, bank, sender_name, sender_bank, sender_acc, receiver_name, receiver_bank, receiver_acc, amount):
    row = [
        file_name,
        bank,
        sender_name,
        sender_bank,
        sender_acc,
        receiver_name,
        receiver_bank,
        receiver_acc,
        amount
    ]
    row
    return row


def read_qr_code(image_path):
    """อ่าน QR Code จากภาพ และคืนค่าข้อความใน QR (ถ้ามี)"""
    if not os.path.exists(image_path):
        return "ไม่พบภาพ"

    try:
        img = Image.open(image_path)
        decoded_objects = decode(img)

        if not decoded_objects:
            return "ไม่พบ QR Code"
        return decoded_objects[0].data.decode("utf-8")

    except Exception as e:
        return f"Error: {str(e)}"