from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/classifier-image", tags=["classifier_image"])

class ClasssifierImage(BaseModel):
    title: str
    description: str | None = None
    case_id: int