from enum import Enum
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date

router = APIRouter(prefix="/cases", tags=["cases"])

class CaseStatus(str, Enum):
    open = "open"
    investigating = "investigating"
    closed = "closed"
    suspended = "suspended"

class CasePriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class CaseType(str, Enum):
    cyber = "cyber_crimes"
    finance = "financial_crimes"
    casino = "casino_crimes"
    scam = "scam_crimes"
    etc = "etc_crimes"


class Case(BaseModel):
    case_id: str
    case_id: str
    title: str
    case_type: CaseType
    description: str | None = None
    priority: CasePriority
    status: CaseStatus
    createdDate: date
    lastUpdated: date
    assignedOfficer: str
    evidenceCount: int | None = 0


# In-memory "database"
cases_db: list[Case] = []


@router.get("/", summary="List all cases", description="Retrieve a list of all cases.")
def read_cases() -> list[Case]:
    return cases_db


@router.get(
    "/{case_id}",
    summary="Get a case by ID",
    description="Retrieve a specific case using its unique identifier.",
)
def read_case(case_id: str) -> Case:
    for case in cases_db:
        if case.case_id == case_id:
            return case
    raise HTTPException(status_code=404, detail="Case not found")


@router.post(
    "/",
    summary="Create a new case",
    description="Create a new case with the provided details.",
)
async def create_case(case: Case) -> Case:
    cases_db.append(case)
    return case


@router.put(
    "/{case_id}",
    summary="Update a case",
    description="Update an existing case using its unique identifier.",
)
async def update_case(case_id: str, case: Case) -> Case:
    for idx, existing_case in enumerate(cases_db):
        if existing_case.case_id == case_id:
            cases_db[idx] = case
            return case
    raise HTTPException(status_code=404, detail="Case not found")


@router.delete(
    "/{case_id}",
    summary="Delete a case",
    description="Delete a specific case using its unique identifier.",
)
async def delete_case(case_id: int) -> dict:
    for idx, case in enumerate(cases_db):
        if case.case_id == case_id:
            del cases_db[idx]
            return {"case_id": case_id, "message": "Case has been deleted"}
    raise HTTPException(status_code=404, detail="Case not found")
