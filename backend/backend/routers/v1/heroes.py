# /routers/v1/heroes.py

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from typing import List

from ...configs.database import SessionDep  # นำเข้า Dependency จากไฟล์ database.py
from ...models import Hero          # นำเข้า Model จากไฟล์ models.py

# สร้าง Router instance
# prefix="/api/v1/heroes" ทำให้ทุก path ในไฟล์นี้ขึ้นต้นด้วย /api/v1/heroes
# tags=["Heroes"] ช่วยจัดกลุ่มในหน้าเอกสาร /docs
router = APIRouter(prefix="/heroes", tags=["Heroes"])


@router.post("/", response_model=Hero)
def create_hero(hero: Hero, session: SessionDep) -> Hero:
    """
    Create a new hero.
    """
    session.add(hero)
    session.commit()
    session.refresh(hero)
    return hero


@router.get("/", response_model=List[Hero])
def read_heroes(
    session: SessionDep,
    offset: int = 0,
    limit: int = Query(default=100, le=100),
) -> List[Hero]:
    """
    Read a list of heroes with pagination.
    """
    heroes = session.exec(select(Hero).offset(offset).limit(limit)).all()
    return heroes