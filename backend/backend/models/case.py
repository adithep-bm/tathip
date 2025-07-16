from datetime import date
from enum import Enum
from sqlmodel import Field, SQLModel
from typing import Optional

class CaseType(str, Enum):
    CYBER = "cyber_crimes"
    FINANCE = "financial_crimes"
    CASINO = "casino_crimes"
    SCAM = "scam_crimes"
    ETC = "etc_crimes"

class CasePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class CaseStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    CLOSED = "closed"
    SUSPENDED = "suspended"

class Case(SQLModel, table=True):
    __tablename__ = "cases"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    case_type: CaseType
    description: Optional[str] = Field(default=None)
    priority: CasePriority
    status: CaseStatus
    created_date: date = Field(default=date.today())
    last_updated: date = Field(default=date.today())
    assigned_officer: str = Field(index=True)
    evidence_count: Optional[int] = Field(default=0)