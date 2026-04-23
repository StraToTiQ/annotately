from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import engine
from .routers import annotations, auth, comments

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AnotationBlog API",
    description="Backend API for the AnotationBlog browser extension",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(annotations.router)
app.include_router(comments.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AnotationBlog API"}
