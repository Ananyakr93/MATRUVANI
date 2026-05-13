from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
import uuid

from backend.database import get_session
from backend.models import ASHAWorker
from backend.schemas import ASHARegister, ASHALogin, ASHAResponse

router = APIRouter(prefix="/asha", tags=["ASHA"])

@router.post("/register")
def register_asha(data: ASHARegister, session: Session = Depends(get_session)):
    statement = select(ASHAWorker).where(ASHAWorker.phone_hash == data.phone_hash)
    existing = session.exec(statement).first()
    
    if existing:
        return {"asha_id": existing.id, "message": "ASHA already registered."}
        
    new_asha = ASHAWorker(
        phone_hash=data.phone_hash,
        district=data.district,
        sub_centre=data.sub_centre,
        state=data.state
    )
    session.add(new_asha)
    session.commit()
    session.refresh(new_asha)
    
    return {"asha_id": new_asha.id, "message": "ASHA registered successfully."}

@router.post("/login", response_model=ASHAResponse)
def login_asha(data: ASHALogin, session: Session = Depends(get_session)):
    statement = select(ASHAWorker).where(ASHAWorker.phone_hash == data.phone_hash)
    existing = session.exec(statement).first()
    
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASHA worker not found.")
        
    return ASHAResponse(
        asha_id=existing.id,
        district=existing.district,
        sub_centre=existing.sub_centre,
        state=existing.state
    )
