from fastapi import APIRouter
from . import cases, evidences, auths, heroes, crawler, illegal_images, ocr, reports

router = APIRouter(prefix="/v1")
router.include_router(cases.router)
router.include_router(evidences.router)
router.include_router(auths.router)
router.include_router(heroes.router)
router.include_router(crawler.router)
router.include_router(ocr.router)
router.include_router(illegal_images.router)
router.include_router(reports.router)