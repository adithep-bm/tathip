# /main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import routers

from .database import create_db_and_tables
# --- Application Setup ---
app = FastAPI(
    title="Superheroes API",
    description="A simple API to manage superheroes.",
    version="1.0.0",
)

# --- Startup Event ---
@app.on_event("startup")
def on_startup():
    """
    This function runs when the application starts.
    It creates the database and tables.
    """
    create_db_and_tables()

# --- Middleware ---
origins = [
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
# Include all your routers here
app.include_router(routers.router)


# --- Root Endpoint ---
@app.get("/")
def read_root() -> dict:
    """
    Welcome endpoint.
    """
    return {"message": "Welcome to the Superheroes API! Visit /docs for documentation."}