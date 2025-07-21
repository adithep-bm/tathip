# /main.py
import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .configs.logging_config import setup_logging
from . import routers

from .configs.database import create_db_and_tables
from .configs.firebase import initialize_firebase
from .ml.prediction import YoloPredictionService  # หรือ Service อื่นๆ
from jinja2 import Environment, FileSystemLoader

from .configs.registry import models

from fastapi import FastAPI
from pathlib import Path 

app = FastAPI()

load_dotenv()
setup_logging()

# --- Application Setup ---
app = FastAPI(
    title="Superheroes API",
    description="A simple API to manage superheroes.",
    version="1.0.0",
)


# --- Startup Event ---
@app.on_event("startup")
def on_startup():
    """
    This function runs when the application starts.
    It creates the database and tables.
    """
    create_db_and_tables()
    initialize_firebase()
    # Path(__file__).parent คือ path ของโฟลเดอร์ที่ไฟล์ main.py อยู่ (backend/backend/)
    TEMPLATE_DIR = Path(__file__).parent / "templates"
    
    # ⭐️ 3. ตั้งค่า Jinja2 Environment ด้วย Path ที่ถูกต้อง
    app.state.templates = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    print(f"Jinja2 environment configured to look for templates in: {TEMPLATE_DIR}")

    slip_classifier_path = os.getenv("YOLO_SLIP_CLASSIFIER_PATH")
    if slip_classifier_path:
        models["slip_classifier"] = YoloPredictionService(
            model_path=slip_classifier_path
        )

    # เพิ่มโมเดลสำหรับตรวจสอบภาพผิดกฎหมาย
    illegal_image_classifier_path = os.getenv(
        "YOLO_ILLEGAL_IMAGE_CLASSIFIER_PATH",
        "./backend/ml/bestYOLOillegalImageClassified4.pt",
    )
    if illegal_image_classifier_path:
        models["illegal_image_classifier"] = YoloPredictionService(
            model_path=illegal_image_classifier_path
        )


# --- Middleware ---
origins = [
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
# Include all your routers here
app.include_router(routers.router)


# --- Root Endpoint ---
@app.get("/")
def read_root() -> dict:
    """
    Welcome endpoint.
    """
    return {"message": "Welcome to the Superheroes API! Visit /docs for documentation."}
