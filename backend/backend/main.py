<<<<<<< Updated upstream
from fastapi import FastAPI
from . import routers

app = FastAPI()
app.include_router(routers.router)


@app.get("/")
def read_root() -> dict:
    return {"message": "Welcome to the API"}
=======
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import routers

app = FastAPI()
app.include_router(routers.router)

origins = [
    "http://localhost",
    "http://localhost:5173", # ตัวอย่าง: หาก Frontend ของคุณรันบน Port 3000
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,         # ระบุรายชื่อ origins ที่อนุญาต
    allow_credentials=True,        # อนุญาตการส่ง credentials (เช่น cookies)
    allow_methods=["*"],           # อนุญาต HTTP methods ทั้งหมด ("GET", "POST", "PUT", etc.)
    allow_headers=["*"],           # อนุญาต HTTP headers ทั้งหมด
)

@app.get("/")
def read_root() -> dict:
    return {"message": "Welcome to the API"}
>>>>>>> Stashed changes
