"""
MATRUVANI — Screenings data store

Database operations for the screenings and sms_queue tables (PostgreSQL).
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any


def insert_screening(
    db,
    *,
    patient_id: int,
    epds_score: int,
    divergence_flag: bool,
    asha_id: int,
    language: str,
) -> None:
    """Insert a new screening record."""
    cur = db.cursor()
    cur.execute(
        """INSERT INTO screenings
           (patient_id, epds_score, divergence_flag, asha_id, language)
           VALUES (%s, %s, %s, %s, %s)""",
        (patient_id, epds_score, divergence_flag, asha_id, language),
    )


def get_screening_counts_by_risk(db) -> dict[str, int]:
    """Return total and per-risk-level screening counts."""
    cur = db.cursor()

    cur.execute("SELECT COUNT(*) FROM screenings")
    total = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM screenings WHERE epds_score <= 8")
    green = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM screenings WHERE epds_score BETWEEN 9 AND 12")
    yellow = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM screenings WHERE epds_score >= 13")
    red = cur.fetchone()[0]

    return {"total": total, "green": green, "yellow": yellow, "red": red}


def get_divergence_count(db) -> int:
    """Return the number of screenings with a divergence flag."""
    cur = db.cursor()
    cur.execute("SELECT COUNT(*) FROM screenings WHERE divergence_flag = TRUE")
    return cur.fetchone()[0]


def get_weekly_trend(db) -> list[dict[str, Any]]:
    """Return weekly aggregated screening data for the last 8 weeks."""
    cur = db.cursor()
    eight_weeks_ago = (datetime.utcnow() - timedelta(weeks=8)).strftime(
        "%Y-%m-%d %H:%M:%S"
    )
    cur.execute(
        """SELECT TO_CHAR(timestamp, 'IYYY-"W"IW') AS week,
                  COUNT(*) AS total,
                  SUM(CASE WHEN epds_score >= 13 THEN 1 ELSE 0 END) AS red,
                  SUM(CASE WHEN epds_score BETWEEN 9 AND 12 THEN 1 ELSE 0 END) AS yellow,
                  SUM(CASE WHEN epds_score <= 8 THEN 1 ELSE 0 END) AS green
           FROM screenings
           WHERE timestamp >= %s
           GROUP BY week
           ORDER BY week""",
        (eight_weeks_ago,),
    )

    rows = cur.fetchall()
    return [
        {
            "week": r[0],
            "total": r[1],
            "red": r[2],
            "yellow": r[3],
            "green": r[4],
        }
        for r in rows
    ]
