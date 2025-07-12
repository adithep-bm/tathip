from fastapi import FastAPI
from . import routers

app = FastAPI()
app.include_router(routers.router)


@app.get("/")
def read_root() -> dict:
    return {"message": "Welcome to the API"}
