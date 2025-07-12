from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/evidences", tags=["evidences"])

class Evidence(BaseModel):
    title: str
    description: str | None = None
    case_id: int