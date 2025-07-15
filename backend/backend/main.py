from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
from . import routers

from sqlmodel import Field, Session, SQLModel, create_engine, select

class Hero(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    age: int | None = Field(default=None, index=True)
    secret_name: str

# Code above omitted 👆

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

# Code below omitted 👇

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]

app = FastAPI()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/heroes/")
def read_heroes(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[Hero]:
    heroes = session.exec(select(Hero).offset(offset).limit(limit)).all()
    return heroes

@app.post("/heroes/")
def create_hero(hero: Hero, session: SessionDep) -> Hero:
    session.add(hero)
    session.commit()
    session.refresh(hero)
    return hero

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

