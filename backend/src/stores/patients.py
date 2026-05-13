"""
MATRUVANI — Patients data store

Database operations for patient and village-level queries (PostgreSQL).
"""

from __future__ import annotations

from typing import Any


def get_top_villages_by_red_flag(db, limit: int = 5) -> list[dict[str, Any]]:
    """Return top villages ranked by red-flag screening count."""
    cur = db.cursor()
    cur.execute(
        """SELECT p.village,
                  SUM(CASE WHEN s.epds_score >= 13 THEN 1 ELSE 0 END) AS red_count,
                  COUNT(*) AS total
           FROM screenings s
           JOIN patients p ON s.patient_id = p.id
           GROUP BY p.village
           ORDER BY red_count DESC
           LIMIT %s""",
        (limit,),
    )
    rows = cur.fetchall()
    return [
        {
            "village": r[0],
            "red_count": r[1],
            "total": r[2],
            "pct": round(r[1] / r[2] * 100, 1) if r[2] else 0,
        }
        for r in rows
    ]
