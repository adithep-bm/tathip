# file: database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL สำหรับเชื่อมต่อ PostgreSQL (เปลี่ยน user, password, host, dbname ตามจริง)
# รูปแบบ: "postgresql://user:password@host/dbname"
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/cases_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency สำหรับใช้ใน endpoint
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()