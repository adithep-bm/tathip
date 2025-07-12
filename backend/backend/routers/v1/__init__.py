from fastapi import APIRouter
from . import cases,evidences

router = APIRouter(prefix="/v1")
router.include_router(cases.router)
router.include_router(evidences.router)
