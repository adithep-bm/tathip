from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

router = APIRouter(prefix="/auths", tags=["auths"])

class User(BaseModel):
    id: int
    username: str
    full_name: str | None = None
    email: str | None = None
    is_active: bool = True

class LoginRequest(BaseModel):
    username: str
    password: str

@router.get("/me", response_model=User)
async def get_current_user(request: Request):
    access_token = request.cookies.get("accessToken")
    #ทำverify เพิ่มว่าaccess_token ถูกต้องหรือไม่
    # ตัวอย่างการตรวจสอบ access_token (ควรเปลี่ยนเป็นการตรวจสอบจริงจากฐานข้อมูลหรือระบบยืนยันตัวตน)
    if not access_token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if access_token == "test":
        return User(
            id=1,
            username="officer001",
            full_name="Police Officer",
            email="officer001@example.com",
            is_active=True
        )
    raise HTTPException(status_code=401, detail="Unauthorized")

@router.post("/login", response_model=User)
async def login(credentials: LoginRequest, response: Response):
    # ตัวอย่างตรวจสอบ username และ password (ควรเปลี่ยนเป็นตรวจสอบจากฐานข้อมูลจริง)
    if credentials.username == "officer001" and credentials.password == "secure123":
        # ตัวอย่าง access_token จริงควรสร้างแบบ JWT
        access_token = "test"
        response.set_cookie(
            key="accessToken",
            value=access_token,
            httponly=True,
            max_age=60*60*24,  # 1 วัน
            path="/",
            secure=False,      # เปลี่ยนเป็น True ถ้าใช้ HTTPS
            samesite="lax"
        )
        return User(
            id=1,
            username="officer001",
            full_name="Police Officer",
            email="officer001@example.com",
            is_active=True
        )
    raise HTTPException(status_code=401, detail="ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง")