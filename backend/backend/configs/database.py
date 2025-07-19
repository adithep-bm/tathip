# /database.py

from typing import Annotated
from fastapi import Depends
from sqlmodel import SQLModel, create_engine, Session

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    """
    Creates the database and all tables based on SQLModel metadata.
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    Dependency function that provides a database session for a single request.
    """
    with Session(engine) as session:
        yield session

# Dependency for API endpoints to get a database session
SessionDep = Annotated[Session, Depends(get_session)]