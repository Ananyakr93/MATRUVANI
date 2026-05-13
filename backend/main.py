"""
MATRUVANI — FastAPI Backend
Perinatal mental health screening API for ASHA workers in rural India.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, create_engine

load_dotenv()

# ── Database ──────────────────────────────────────────────────────────────────

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./matruvani.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


from backend.database import create_db_and_tables
from backend.schemas import AnalyzeRequest, AnalyzeResponse
from backend.epds_engine import (
    EPDS_QUESTIONS,
    calculate_epds_score,
    run_lexicon_matching,
    compute_ams,
    final_risk_assessment,
    ASHA_SCRIPTS
)
# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    create_db_and_tables()
    yield


# ── App Factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="MATRUVANI",
    description="AI-powered perinatal mental health screening API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from fastapi import Request
from fastapi.responses import JSONResponse

# ── Global Exception Handler ──────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "detail": "An unexpected error occurred."}
    )

from backend.routers import asha, screening, dashboard, sms
app.include_router(asha.router, prefix="/api/v1")
app.include_router(screening.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(sms.router, prefix="/api/v1")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/v1/epds/questions")
async def get_epds_questions(language: str = 'hi'):
    """Return EPDS questions in the requested language."""
    # Build a localized version of the questions
    localized_questions = {}
    for q_id, q_data in EPDS_QUESTIONS.items():
        localized_questions[q_id] = {
            'text': q_data.get(language, q_data['en']),
            'options': q_data.get(f'options_{language}', []),
            'scoring': q_data['scoring']
        }
    return {"language": language, "questions": localized_questions}


@app.post("/api/v1/screening/analyze", response_model=AnalyzeResponse)
async def analyze_screening(request: AnalyzeRequest):
    """Run full clinical AI analysis on screening data."""
    # 1. EPDS Score
    epds_score, epds_risk = calculate_epds_score(request.answers)
    
    # 2. Lexicon Match
    lexicon_result = run_lexicon_matching(request.transcript)
    
    # 3. AMS Calculation
    ams_score, divergence_flag = compute_ams(epds_score, lexicon_result)
    
    # 4. Final Risk
    final_risk = final_risk_assessment(epds_score, divergence_flag)
    
    # 5. ASHA Script
    script_data = ASHA_SCRIPTS.get(final_risk, ASHA_SCRIPTS['LOW'])
    asha_script = script_data.get(request.language, script_data['hi'])
    
    return AnalyzeResponse(
        epds_score=epds_score,
        risk_level=final_risk,
        divergence_flag=divergence_flag,
        ams_score=ams_score,
        asha_script=asha_script,
        matched_phrases=lexicon_result['matched_phrases']
    )
