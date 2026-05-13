from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from backend.database import get_session
from backend.models import ScreeningSession, MotherRecord
from backend.schemas import DashboardStats, HeatmapItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(district: str, state: str, db: Session = Depends(get_session)):
    # Join ScreeningSession with MotherRecord to filter by district/state
    statement = (
        select(ScreeningSession, MotherRecord)
        .join(MotherRecord, ScreeningSession.mother_id == MotherRecord.id)
        .where(MotherRecord.district == district)
        .where(MotherRecord.state == state)
    )
    results = db.exec(statement).all()
    
    total_screened = len(results)
    high_risk_count = 0
    moderate_risk_count = 0
    low_risk_count = 0
    divergence_flags_count = 0
    
    village_stats = defaultdict(lambda: {'total': 0, 'high': 0})
    language_breakdown = defaultdict(int)
    asha_set = set()
    
    # 30 days trend
    today = datetime.utcnow().date()
    thirty_days_ago = today - timedelta(days=30)
    trend_dict = defaultdict(lambda: {'count': 0, 'high_risk_count': 0})
    
    for session, mother in results:
        if session.risk_level == 'HIGH':
            high_risk_count += 1
        elif session.risk_level == 'MODERATE':
            moderate_risk_count += 1
        else:
            low_risk_count += 1
            
        if session.divergence_flag in ['YELLOW', 'RED']:
            divergence_flags_count += 1
            
        village_stats[mother.village_code]['total'] += 1
        if session.risk_level == 'HIGH':
            village_stats[mother.village_code]['high'] += 1
            
        language_breakdown[mother.preferred_language] += 1
        
        # We assume session_date is available on the session model
        if session.session_date >= thirty_days_ago:
            date_str = session.session_date.isoformat()
            trend_dict[date_str]['count'] += 1
            if session.risk_level == 'HIGH':
                trend_dict[date_str]['high_risk_count'] += 1
                
        # This month logic for asha coverage (approximate)
        if session.session_date.month == today.month and session.session_date.year == today.year:
            asha_set.add(session.asha_id)

    dark_villages = []
    for v_code, stats in village_stats.items():
        if stats['total'] > 0 and (stats['high'] / stats['total']) > 0.4:
            dark_villages.append(v_code)
            
    trend_last_30_days = []
    for i in range(30):
        d = (thirty_days_ago + timedelta(days=i)).isoformat()
        trend_last_30_days.append({
            "date": d,
            "count": trend_dict[d]['count'],
            "high_risk_count": trend_dict[d]['high_risk_count']
        })

    detection_rate = (high_risk_count + moderate_risk_count) / total_screened if total_screened > 0 else 0.0
    divergence_rate = divergence_flags_count / total_screened if total_screened > 0 else 0.0

    return DashboardStats(
        total_screened=total_screened,
        high_risk_count=high_risk_count,
        moderate_risk_count=moderate_risk_count,
        detection_rate=detection_rate,
        divergence_rate=divergence_rate,
        dark_villages=dark_villages,
        trend_last_30_days=trend_last_30_days,
        language_breakdown=dict(language_breakdown),
        asha_coverage=len(asha_set)
    )

@router.get("/heatmap", response_model=List[HeatmapItem])
def get_heatmap(state: str, db: Session = Depends(get_session)):
    statement = (
        select(ScreeningSession, MotherRecord)
        .join(MotherRecord, ScreeningSession.mother_id == MotherRecord.id)
        .where(MotherRecord.state == state)
    )
    results = db.exec(statement).all()
    
    village_stats = defaultdict(lambda: {'total': 0, 'high': 0, 'district': ''})
    
    for session, mother in results:
        village_stats[mother.village_code]['total'] += 1
        village_stats[mother.village_code]['district'] = mother.district
        if session.risk_level == 'HIGH':
            village_stats[mother.village_code]['high'] += 1
            
    heatmap = []
    for v_code, stats in village_stats.items():
        risk_rate = stats['high'] / stats['total'] if stats['total'] > 0 else 0.0
        heatmap.append(HeatmapItem(
            village_code=v_code,
            district=stats['district'],
            risk_rate=risk_rate,
            total_sessions=stats['total']
        ))
        
    # Sort descending by risk_rate
    heatmap.sort(key=lambda x: x.risk_rate, reverse=True)
    return heatmap
