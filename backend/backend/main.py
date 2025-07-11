from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Case(BaseModel):
    case_id: int
    title: str
    description: str | None = None
    status: str | None = None


@app.get(
    "/cases",
    tags=["cases"],
    summary="List all cases",
    description="Retrieve a list of all cases.",
)
def read_cases() -> list[Case]:
    return [
        Case(
            case_id=1,
            title="Sample Case 1",
            description="This is a sample case.",
            status="open",
        ),
        Case(
            case_id=2,
            title="Sample Case 2",
            description="This is another sample case.",
            status="closed",
        ),
    ]


@app.get(
    "/cases/{case_id}",
    tags=["cases"],
    summary="Get a case by ID",
    description="Retrieve a specific case using its unique identifier.",
)
def read_case(case_id: int, page: int = 1, size_per_page: int = 50) -> Case:
    return Case(
        case_id=case_id,
        title="Sample Case",
        description="This is a sample case.",
        status="open",
    )


@app.post(
    "/cases",
    tags=["cases"],
    summary="Create a new case",
    description="Create a new case with the provided details.",
)
async def create_case(case: Case) -> Case:
    return case


@app.put(
    "/cases/{case_id}",
    tags=["cases"],
    summary="Update a case",
    description="Update an existing case using its unique identifier.",
)
async def update_case(case_id: int, case: Case) -> Case:
    return case


@app.delete(
    "/cases/{case_id}",
    tags=["cases"],
    summary="Delete a case",
    description="Delete a specific case using its unique identifier.",
)
async def delete_casae(case_id: int) -> dict:
    return {"case_id : ", case_id, "has been deleted"}
