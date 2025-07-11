from fastapi import APIRouter
from . import cases

router = APIRouter(prefix="/v1")
router.include_router(cases.router)
