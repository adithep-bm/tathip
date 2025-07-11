from fastapi import FastAPI

app = FastAPI()


@app.get("cases/{case_id}")
def read_item(item_id: int, q: str | None = None) -> dict:
    return {"item_id": item_id, "q": q}


@app.post("/case")
async def create_case(case: dict) -> dict:
    return {"case": case}


@app.put("/case/{case_id}")
async def update_case(case_id: int, case: dict) -> dict:
    return {"case_id": case_id, "case": case}


@app.delete("/case/{case_id}")
async def delete_casae(case_id: int) -> dict:
    return {"case_id : ", case_id, "has been deleted"}
