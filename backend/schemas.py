import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


class SessionCreate(BaseModel):
    mother_id: uuid.UUID
    asha_id: uuid.UUID
    epds_score: int
    epds_answers: List[int]
    free_speech_transcript: Optional[str] = None
    divergence_flag: str
    ams_score: Optional[float]
    risk_level: str
    session_date: date


class SessionResponse(BaseModel):
    id: uuid.UUID
    mother_id: uuid.UUID
    asha_id: uuid.UUID
    epds_score: int
    divergence_flag: str
    ams_score: Optional[float]
    risk_level: str
    sms_sent: bool
    session_date: date
    created_at: datetime


class ASHARegister(BaseModel):
    phone_hash: str
    district: str
    sub_centre: str
    state: str

class ASHALogin(BaseModel):
    phone_hash: str

class ASHAResponse(BaseModel):
    asha_id: uuid.UUID
    district: str
    sub_centre: str
    state: str

class ScreeningHistoryItem(BaseModel):
    session_id: uuid.UUID
    session_date: date
    risk_level: str
    divergence_flag: str
    village_code: str
    epds_score: int

class DashboardStats(BaseModel):
    total_screened: int
    high_risk_count: int
    moderate_risk_count: int
    detection_rate: float
    divergence_rate: float
    dark_villages: List[str]
    trend_last_30_days: List[dict]
    language_breakdown: dict
    asha_coverage: int

class HeatmapItem(BaseModel):
    village_code: str
    district: str
    risk_rate: float
    total_sessions: int

class SMSReferral(BaseModel):
    session_id: uuid.UUID
    phc_phone: str
    phc_name: str
    risk_level: str
    village_code: str


class ScreeningAnalysis(BaseModel):
    epds_score: int
    divergence_flag: str
    ams_score: Optional[float]
    risk_level: str
    recommended_action: str


class AnalyzeRequest(BaseModel):
    answers: List[int]
    transcript: str
    language: str


class AnalyzeResponse(BaseModel):
    epds_score: int
    risk_level: str
    divergence_flag: str
    ams_score: float
    asha_script: dict
    matched_phrases: List[str]
