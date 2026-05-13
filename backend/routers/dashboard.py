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


# ── ASHA Coverage per Sub-centre ──────────────────────────────────────────────

from datetime import date
from calendar import monthrange
from backend.models import ASHAWorker
from backend.schemas import SubCentreCoverage


@router.get("/coverage", response_model=List[SubCentreCoverage])
def get_coverage(district: str, state: str, db: Session = Depends(get_session)):
    """
    Per sub-centre ASHA coverage for the District dashboard table.
    Returns ASHA count, sessions this month, high-risk count, and coverage rate.
    Coverage rate = sessions_this_month / (asha_count * 4), capped at 1.0.
    """
    today = date.today()
    _, last_day = monthrange(today.year, today.month)
    month_start = date(today.year, today.month, 1)
    month_end = date(today.year, today.month, last_day)

    # Fetch all active ASHAs in this district/state
    asha_stmt = (
        select(ASHAWorker)
        .where(ASHAWorker.district == district)
        .where(ASHAWorker.state == state)
        .where(ASHAWorker.is_active == True)
    )
    ashas = db.exec(asha_stmt).all()

    # Group ASHA IDs by sub_centre
    sub_centre_map: Dict[str, List] = defaultdict(list)
    for asha in ashas:
        sub_centre_map[asha.sub_centre].append(asha.id)

    results = []
    for sub_centre, asha_ids in sub_centre_map.items():
        # Fetch sessions this month for these ASHAs
        sess_stmt = (
            select(ScreeningSession)
            .where(ScreeningSession.asha_id.in_(asha_ids))
            .where(ScreeningSession.session_date >= month_start)
            .where(ScreeningSession.session_date <= month_end)
        )
        sessions = db.exec(sess_stmt).all()

        asha_count = len(asha_ids)
        sessions_this_month = len(sessions)
        high_risk_count = sum(1 for s in sessions if s.risk_level == "HIGH")
        coverage_rate = (
            min(sessions_this_month / (asha_count * 4), 1.0) if asha_count > 0 else 0.0
        )

        results.append(SubCentreCoverage(
            sub_centre=sub_centre,
            asha_count=asha_count,
            sessions_this_month=sessions_this_month,
            high_risk_count=high_risk_count,
            coverage_rate=coverage_rate,
        ))

    results.sort(key=lambda x: x.coverage_rate, reverse=True)
    return results
