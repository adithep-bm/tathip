from pathlib import Path # ⭐️ 1. Import Path
from jinja2 import Environment, FileSystemLoader

# ⭐️ 2. สร้าง Path ไปยังโฟลเดอร์หลักของแอปพลิเคชัน (backend/)
# Path(__file__) คือ path ของไฟล์ config.py นี้
# .parent คือการถอยขึ้นไป 1 โฟลเดอร์ (จาก configs/ ไปยัง backend/)
TEMPLATE_DIR = Path(__file__).parent.parent 

# ⭐️ 3. ใช้ Path ที่สร้างขึ้นมาในการตั้งค่า loader
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

# โหลด template เตรียมไว้
template = env.get_template("report_template.html")