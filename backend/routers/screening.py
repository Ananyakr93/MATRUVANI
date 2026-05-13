import json
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import ScreeningSession, ReferralLog, PHCDirectory
from backend.schemas import SessionCreate, SessionResponse, ScreeningHistoryItem

router = APIRouter(prefix="/screening", tags=["Screening"])

def send_high_risk_sms_task(session_id: uuid.UUID, village_code: str):
    # Simulated SMS sending in background
    print(f"BACKGROUND SMS: MATRUVANI: Village [{village_code}] HIGH risk EPDS screening. Session: {str(session_id)[:8]}. Please follow up. -NHM")
    # For a real implementation, you would query the PHC for this village and hit MSG91

@router.post("/session", response_model=SessionResponse)
def create_session(
    data: SessionCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session)
):
    new_session = ScreeningSession(
        mother_id=data.mother_id,
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
    
    if new_session.risk_level == 'HIGH':
        # Trigger background task to send SMS
        # In a real scenario, we'd look up the village_code via MotherRecord
        # For simplicity, passing a placeholder or resolving it here.
        # Let's resolve the village code from mother record
        # Note: we need to import MotherRecord
        from backend.models import MotherRecord
        mother = db.get(MotherRecord, new_session.mother_id)
        village_code = mother.village_code if mother else "UNKNOWN"
        background_tasks.add_task(send_high_risk_sms_task, new_session.id, village_code)
        
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
        from backend.models import MotherRecord
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
