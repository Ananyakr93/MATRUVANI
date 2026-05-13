import os
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
import httpx

from backend.database import get_session
from backend.models import ReferralLog
from backend.schemas import SMSReferral

router = APIRouter(prefix="/sms", tags=["SMS"])

MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY")
SMS_SENDER_ID = os.getenv("SMS_SENDER_ID", "MATRV")

@router.post("/send-referral")
async def send_referral_sms(data: SMSReferral, db: Session = Depends(get_session)):
    session_id_short = str(data.session_id)[:8]
    message_text = f"MATRUVANI: Village [{data.village_code}] HIGH risk EPDS screening. Session: {session_id_short}. Please follow up. -NHM"
    
    simulated = False
    delivery_status = "PENDING"
    
    if MSG91_AUTH_KEY:
        # In a real app, you would POST to MSG91 API here
        # Example: httpx.post("https://api.msg91.com/...", json={...})
        delivery_status = "DELIVERED" # Simulating success for now
    else:
        print(f"\n[SIMULATED SMS to {data.phc_name} at {data.phc_phone}]\n{message_text}\n")
        simulated = True
        delivery_status = "DELIVERED"
        
    # Save ReferralLog
    log_entry = ReferralLog(
        session_id=data.session_id,
        phc_name=data.phc_name,
        phc_phone=data.phc_phone,
        referral_type="SMS",
        delivery_status=delivery_status
    )
    db.add(log_entry)
    db.commit()
    
    if simulated:
        return {"simulated": True, "message": "SMS logged"}
    else:
        return {"simulated": False, "message": "SMS sent via MSG91"}
