import os
import uuid
from datetime import datetime, date
from typing import Optional

from sqlmodel import SQLModel, Field


class ASHAWorker(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    phone_hash: str
    district: str
    sub_centre: str
    state: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)


class MotherRecord(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    asha_id: uuid.UUID = Field(foreign_key="ashaworker.id")
    anonymous_token: str
    gestational_week: Optional[int] = Field(default=None)
    days_postpartum: Optional[int] = Field(default=None)
    village_code: str
    district: str
    state: str
    preferred_language: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ScreeningSession(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    mother_id: uuid.UUID = Field(foreign_key="motherrecord.id")
    asha_id: uuid.UUID = Field(foreign_key="ashaworker.id")
    epds_score: int
    epds_answers: str
    free_speech_transcript: Optional[str] = Field(default=None)
    divergence_flag: str
    ams_score: Optional[float] = Field(default=None)
    risk_level: str
    sms_sent: bool = Field(default=False)
    session_date: date
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReferralLog(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="screeningsession.id")
    phc_name: str
    phc_phone: str
    referral_type: str
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    delivery_status: str


class PHCDirectory(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    district: str
    sub_centre: str
    phc_name: str
    phc_phone: str
    medical_officer_name: str
    state: str
