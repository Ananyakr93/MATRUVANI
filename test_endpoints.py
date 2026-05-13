import requests
import uuid
import datetime
import json
from sqlmodel import Session
from backend.database import engine
from backend.models import MotherRecord

BASE_URL = "http://127.0.0.1:8001/api/v1"

def inject_mother(asha_id):
    with Session(engine) as session:
        m = MotherRecord(
            asha_id=uuid.UUID(asha_id),
            anonymous_token="token123",
            village_code="VIL001",
            district="Bengaluru Rural",
            state="Karnataka",
            preferred_language="hi"
        )
        session.add(m)
        session.commit()
        session.refresh(m)
        return str(m.id)

def test_endpoints():
    print("Testing /health...")
    resp = requests.get("http://127.0.0.1:8001/health")
    assert resp.status_code == 200, f"Health failed: {resp.text}"

    print("Testing /asha/register...")
    asha_data = {
        "phone_hash": "hash123",
        "district": "Bengaluru Rural",
        "sub_centre": "Hoskote Town",
        "state": "Karnataka"
    }
    resp = requests.post(f"{BASE_URL}/asha/register", json=asha_data)
    assert resp.status_code == 200, f"Register failed: {resp.text}"
    asha_id = resp.json()["asha_id"]

    print("Testing /asha/login...")
    resp = requests.post(f"{BASE_URL}/asha/login", json={"phone_hash": "hash123"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"

    mother_id = inject_mother(asha_id)

    print("Testing /screening/analyze...")
    analyze_data = {
        "answers": [0,0,0,0,0,0,0,0,0,0],
        "transcript": "main bahut theek hoon",
        "language": "hi"
    }
    resp = requests.post(f"{BASE_URL}/screening/analyze", json=analyze_data)
    assert resp.status_code == 200, f"Analyze failed: {resp.text}"
    analyze_result = resp.json()

    print("Testing /screening/session...")
    session_data = {
        "mother_id": mother_id,
        "asha_id": asha_id,
        "epds_score": analyze_result["epds_score"],
        "epds_answers": [0]*10,
        "free_speech_transcript": "test",
        "divergence_flag": analyze_result["divergence_flag"],
        "ams_score": analyze_result["ams_score"],
        "risk_level": analyze_result["risk_level"],
        "session_date": str(datetime.date.today())
    }
    resp = requests.post(f"{BASE_URL}/screening/session", json=session_data)
    assert resp.status_code == 200, f"Session failed: {resp.text}"
    session_id = resp.json()["id"]

    print(f"Testing /screening/session/{session_id}...")
    resp = requests.get(f"{BASE_URL}/screening/session/{session_id}")
    assert resp.status_code == 200, f"Get session failed: {resp.text}"

    print(f"Testing /screening/history/{asha_id}...")
    resp = requests.get(f"{BASE_URL}/screening/history/{asha_id}")
    assert resp.status_code == 200, f"History failed: {resp.text}"
    assert len(resp.json()) > 0

    print("Testing /dashboard/stats...")
    resp = requests.get(f"{BASE_URL}/dashboard/stats?district=Bengaluru%20Rural&state=Karnataka")
    assert resp.status_code == 200, f"Stats failed: {resp.text}"

    print("Testing /dashboard/heatmap...")
    resp = requests.get(f"{BASE_URL}/dashboard/heatmap?state=Karnataka")
    assert resp.status_code == 200, f"Heatmap failed: {resp.text}"

    print("Testing /sms/send-referral...")
    sms_data = {
        "session_id": session_id,
        "phc_phone": "1234567890",
        "phc_name": "Test PHC",
        "risk_level": "LOW",
        "village_code": "VIL001"
    }
    resp = requests.post(f"{BASE_URL}/sms/send-referral", json=sms_data)
    assert resp.status_code == 200, f"SMS failed: {resp.text}"

    print("All endpoints tested successfully!")

if __name__ == "__main__":
    test_endpoints()
