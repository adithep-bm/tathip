# app/core/logging_config.py
import sys
from loguru import logger

def setup_logging():
    """
    ตั้งค่า Loguru logger ให้สวยงาม
    """
    logger.remove() # ลบ config เริ่มต้นออกก่อน
    logger.add(
        sys.stderr, # แสดงผลทางหน้าจอ (เหมือน print)
        colorize=True, # เปิดใช้งานสี
        format="<level>{level: <8}:</level> {message}"
    )
    # คุณสามารถเพิ่ม logger.add() เพื่อเซฟลงไฟล์ก็ได้
    # logger.add("logs/file_{time}.log", rotation="10 MB")