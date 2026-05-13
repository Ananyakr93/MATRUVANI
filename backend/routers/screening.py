import json
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import ScreeningSession, ReferralLog, PHCDirectory, MotherRecord, ASHAWorker
from backend.schemas import (
    SessionCreate,
    SessionResponse,
    ScreeningHistoryItem,
    SessionListItem,
    ReferralItem,
    MotherCreate,
)

router = APIRouter(prefix="/screening", tags=["Screening"])

@router.post("/mother", response_model=MotherRecord)
def create_mother(data: MotherCreate, db: Session = Depends(get_session)):
    new_mother = MotherRecord(
        asha_id=data.asha_id,
        village_code=data.village_code,
        is_pregnant=data.is_pregnant,
        gestational_week=data.gestational_week,
        days_postpartum=data.days_postpartum,
        district=data.district,
        state=data.state
    )
    db.add(new_mother)
    db.commit()
    db.refresh(new_mother)
    return new_mother

@router.post("/session", response_model=SessionResponse)
def create_session(
    data: SessionCreate, 
    db: Session = Depends(get_session)
):
    mother_id = data.mother_id
    if not mother_id and data.mother_data:
        new_mother = MotherRecord(
            asha_id=data.mother_data.asha_id,
            village_code=data.mother_data.village_code,
            is_pregnant=data.mother_data.is_pregnant,
            gestational_week=data.mother_data.gestational_week,
            days_postpartum=data.mother_data.days_postpartum,
            district=data.mother_data.district,
            state=data.mother_data.state
        )
        db.add(new_mother)
        db.commit()
        db.refresh(new_mother)
        mother_id = new_mother.id
        
    new_session = ScreeningSession(
        mother_id=mother_id,
        asha_id=data.asha_id,
        epds_score=data.epds_score,
        epds_answers=json.dumps(data.epds_answers),
        free_speech_transcript=data.free_speech_transcript,
        divergence_flag=data.divergence_flag,
        ams_score=data.ams_score,
        risk_level=data.risk_level,
        session_date=data.session_date
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return new_session

@router.get("/session/{session_id}", response_model=SessionResponse)
def get_session_by_id(session_id: uuid.UUID, db: Session = Depends(get_session)):
    session_record = db.get(ScreeningSession, session_id)
    if not session_record:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_record

@router.get("/history/{asha_id}", response_model=List[ScreeningHistoryItem])
def get_screening_history(asha_id: uuid.UUID, db: Session = Depends(get_session)):
    # Get last 30 sessions for this ASHA
    statement = (
        select(ScreeningSession)
        .where(ScreeningSession.asha_id == asha_id)
        .order_by(ScreeningSession.created_at.desc())
        .limit(30)
    )
    sessions = db.exec(statement).all()
    
    history = []
    for s in sessions:
        mother = db.get(MotherRecord, s.mother_id)
        history.append(ScreeningHistoryItem(
            session_id=s.id,
            session_date=s.session_date,
            risk_level=s.risk_level,
            divergence_flag=s.divergence_flag,
            village_code=mother.village_code if mother else "N/A",
            epds_score=s.epds_score
        ))
        
    return history

# ── Doctor Dashboard endpoints ────────────────────────────────────────────────

@router.get("/sessions", response_model=List[SessionListItem])
def list_sessions(
    district: str,
    state: str,
    risk_level: Optional[str] = None,
    divergence_flag: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_session),
):
    """
    Paginated session list for the Doctor dashboard table.
    Filterable by district, state, risk_level, and divergence_flag.
    """
    statement = (
        select(ScreeningSession, MotherRecord, ASHAWorker)
        .join(MotherRecord, ScreeningSession.mother_id == MotherRecord.id)
        .join(ASHAWorker, ScreeningSession.asha_id == ASHAWorker.id)
        .where(MotherRecord.district == district)
        .where(MotherRecord.state == state)
        .order_by(ScreeningSession.session_date.desc())
    )
    if risk_level and risk_level != "ALL":
        statement = statement.where(ScreeningSession.risk_level == risk_level)
    if divergence_flag == "FLAGGED":
        statement = statement.where(ScreeningSession.divergence_flag != "GREEN")

    statement = statement.offset(offset).limit(limit)
    results = db.exec(statement).all()

    items = []
    for session, mother, asha in results:
        items.append(SessionListItem(
            session_id=session.id,
            session_date=session.session_date,
            risk_level=session.risk_level,
            divergence_flag=session.divergence_flag,
            ams_score=session.ams_score,
            epds_score=session.epds_score,
            village_code=mother.village_code,
            sub_centre=asha.sub_centre,
            district=mother.district,
            sms_sent=session.sms_sent,
        ))
    return items


@router.get("/referrals", response_model=List[ReferralItem])
def list_referrals(
    district: str,
    state: str,
    db: Session = Depends(get_session),
):
    """
    HIGH and MODERATE risk sessions for the Doctor referral queue.
    Ordered newest-first.
    """
    statement = (
        select(ScreeningSession, MotherRecord, ASHAWorker)
        .join(MotherRecord, ScreeningSession.mother_id == MotherRecord.id)
        .join(ASHAWorker, ScreeningSession.asha_id == ASHAWorker.id)
        .where(MotherRecord.district == district)
        .where(MotherRecord.state == state)
        .where(ScreeningSession.risk_level.in_(["HIGH", "MODERATE"]))
        .order_by(ScreeningSession.session_date.desc())
    )
    results = db.exec(statement).all()

    items = []
    for session, mother, asha in results:
        items.append(ReferralItem(
            session_id=session.id,
            session_date=session.session_date,
            risk_level=session.risk_level,
            divergence_flag=session.divergence_flag,
            epds_score=session.epds_score,
            village_code=mother.village_code,
            sub_centre=asha.sub_centre,
            days_postpartum=mother.days_postpartum,
            gestational_week=mother.gestational_week,
            sms_sent=session.sms_sent,
            session_time=session.created_at.strftime("%I:%M %p"),
        ))
    return items
