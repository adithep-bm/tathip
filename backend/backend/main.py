from fastapi import FastAPI

app = FastAPI()


@app.get(
    "/cases",
    tags=["cases"],
    summary="List all cases",
    description="Retrieve a list of all cases.",
)
def read_cases() -> dict:
    return {"cases": [{"case_id": 1}, {"case_id": 2}]}


@app.get(
    "/cases/{case_id}",
    tags=["cases"],
    summary="Get a case by ID",
    description="Retrieve a specific case using its unique identifier.",
)
def read_case(case_id: int, q: str | None = None) -> dict:
    return {"case_id": case_id, "q": q}


@app.post(
    "/cases",
    tags=["cases"],
    summary="Create a new case",
    description="Create a new case with the provided details.",
)
async def create_case(case: dict) -> dict:
    return {"case": case}


@app.put(
    "/cases/{case_id}",
    tags=["cases"],
    summary="Update a case",
    description="Update an existing case using its unique identifier.",
)
async def update_case(case_id: int, case: dict) -> dict:
    return {"case_id": case_id, "case": case}


@app.delete(
    "/cases/{case_id}",
    tags=["cases"],
    summary="Delete a case",
    description="Delete a specific case using its unique identifier.",
)
async def delete_casae(case_id: int) -> dict:
    return {"case_id : ", case_id, "has been deleted"}
