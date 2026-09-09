import base64
import os
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import ChatRequest, ChatResponse, EcommerceAnalyzeRequest, EcommerceAnalyzeResponse
from app.services.agent_service import run_chat
from src.core.pipeline import run_pipeline

load_dotenv()

app = FastAPI(
    title="Lunar Vision API",
    version="1.0.0",
    description="Multi-Agent Platform for Business Intelligence, E-Commerce Analytics, and Competitive Watch",
)

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
allowed_origins_env = os.getenv("FRONTEND_ORIGINS", ",".join(default_origins))
allowed_origins: List[str] = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

for origin in default_origins:
    if origin not in allowed_origins:
        allowed_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {
        "status": "healthy",
        "service": "Lunar Vision Platform",
        "version": "1.0.0",
    }


@app.get("/api/v1/sample-dataset")
def get_sample_dataset() -> dict:
    """Return a pre-generated rich e-commerce sample dataset (Olist format) for instant demo/testing."""
    sample_path = Path(__file__).resolve().parent.parent / "sample_data" / "ecommerce_sample.csv"
    if not sample_path.exists():
        raise HTTPException(status_code=404, detail="Sample dataset not found")

    with open(sample_path, "rb") as f:
        raw_bytes = f.read()

    b64_content = base64.b64encode(raw_bytes).decode("utf-8")
    return {
        "name": "ecommerce_sample.csv",
        "mime_type": "text/csv",
        "content_base64": b64_content,
        "rows": 350,
        "description": "Olist e-commerce sample with orders, revenue, delivery dates, categories, and reviews",
    }


@app.post("/api/v1/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    try:
        result = run_chat(
            message=payload.message,
            agent_type=payload.agent_type,
            session_id=payload.session_id,
            chat_history=[message.model_dump() for message in payload.chat_history or []],
            uploaded_files=[file.model_dump() for file in payload.uploaded_files or []],
        )
        return ChatResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {exc}")


@app.post("/api/v1/ecommerce/analyze", response_model=EcommerceAnalyzeResponse)
def ecommerce_analyze(payload: EcommerceAnalyzeRequest) -> EcommerceAnalyzeResponse:
    if not payload.uploaded_files:
        raise HTTPException(status_code=400, detail="Please upload at least one CSV, Excel, or SQLite file.")

    allowed_extensions = (".csv", ".xlsx", ".db", ".sqlite", ".sqlite3")
    file_item = None
    for candidate in payload.uploaded_files:
        if candidate.name.lower().endswith(allowed_extensions):
            file_item = candidate
            break

    if file_item is None:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload CSV, XLSX, or SQLite database files.")

    try:
        raw_bytes = base64.b64decode(file_item.content_base64)
        result = run_pipeline(file_item.name, raw_bytes, prompt=payload.prompt or "")
        return EcommerceAnalyzeResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ecommerce analysis failed: {exc}")


# Mount competitive intelligence routes seamlessly
try:
    from src.api.api.app import app as ci_app
    app.include_router(ci_app.router)
except Exception as exc:
    import logging
    logging.getLogger(__name__).warning(f"Competitive Intelligence sub-router failed to mount: {exc}")
