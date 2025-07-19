# /main.py
import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .configs.logging_config import setup_logging
from . import routers

from .configs.database import create_db_and_tables
from .configs.firebase import initialize_firebase
from .ml.prediction import YoloPredictionService # หรือ Service อื่นๆ

from .configs.registry import models

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

    slip_classifier_path = os.getenv("YOLO_SLIP_CLASSIFIER_PATH")
    if slip_classifier_path:
        models["slip_classifier"] = YoloPredictionService(model_path=slip_classifier_path)


# --- Middleware ---
origins = [
    "http://10.119.65.140",
    "http://10.119.65.140:5173",
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
