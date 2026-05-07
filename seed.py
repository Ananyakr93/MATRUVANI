"""
Seed the MATRUVANI database with realistic synthetic data.

- 10 ASHA workers across 5 villages in Karnataka
- 50 patients distributed across those villages
- ~80 screening records with varied EPDS scores spanning 8 weeks
- A few divergence-flag cases for dashboard testing
"""

import sqlite3
import os
import random
from datetime import datetime, timedelta

DATABASE = os.path.join(os.path.dirname(__file__), "matruvani.db")

# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

VILLAGES = ["Hoskote", "Kanakapura", "Channapatna", "Ramanagara", "Doddaballapur"]
DISTRICT_ID = "RAMANAGARA-571511"

ASHA_WORKERS = [
    ("Lakshmi Devi", "SC-Hoskote-1"),
    ("Kavitha R.", "SC-Hoskote-2"),
    ("Manjula S.", "SC-Kanakapura-1"),
    ("Savithri N.", "SC-Kanakapura-2"),
    ("Roopa G.", "SC-Channapatna-1"),
    ("Padma K.", "SC-Channapatna-2"),
    ("Sujatha M.", "SC-Ramanagara-1"),
    ("Anitha B.", "SC-Ramanagara-2"),
    ("Geetha L.", "SC-Doddaballapur-1"),
    ("Pushpa D.", "SC-Doddaballapur-2"),
]

FIRST_NAMES = [
    "Meena", "Sunitha", "Ganga", "Saroja", "Radha",
    "Prema", "Jaya", "Nandini", "Rekha", "Shobha",
    "Vani", "Suma", "Asha", "Bhagya", "Champa",
    "Devaki", "Gowri", "Hemavathi", "Indira", "Jayanthi",
    "Kamala", "Lalitha", "Mala", "Nagamma", "Omana",
    "Parvathi", "Ratna", "Saraswathi", "Tulasi", "Uma",
    "Vasanthi", "Yamuna", "Zareena", "Amrutha", "Bhavani",
    "Chandrika", "Deepa", "Eswari", "Fathima", "Girija",
    "Hema", "Ira", "Janaki", "Kala", "Latha",
    "Mahalakshmi", "Nethravathi", "Obavva", "Preethi", "Rukmini",
]

LANGUAGES = ["hi", "kn", "hi", "hi", "kn"]  # mix of Hindi & Kannada

# Realistic EPDS score distribution (skewed toward lower scores)
# Roughly: 60% green, 25% yellow, 15% red
EPDS_WEIGHTS = (
    [0] * 5 + [1] * 5 + [2] * 6 + [3] * 6 + [4] * 7 + [5] * 7
    + [6] * 6 + [7] * 6 + [8] * 6
    + [9] * 4 + [10] * 4 + [11] * 4 + [12] * 4
    + [13] * 3 + [14] * 3 + [15] * 2 + [16] * 2 + [17] * 1
    + [18] * 1 + [19] * 1 + [20] * 1 + [21] * 1
)


def _random_timestamp_in_last_8_weeks() -> str:
    """Return a random datetime string within the past 8 weeks."""
    now = datetime.utcnow()
    delta = timedelta(
        days=random.randint(0, 55),
        hours=random.randint(8, 17),
        minutes=random.randint(0, 59),
    )
    ts = now - delta
    return ts.strftime("%Y-%m-%d %H:%M:%S")


def _random_abha_id() -> str:
    """Generate a fake 14-digit ABHA ID."""
    return "".join(str(random.randint(0, 9)) for _ in range(14))


def seed():
    """Drop existing data and re-seed from scratch."""
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()

    # Read & run schema first
    schema_path = os.path.join(os.path.dirname(__file__), "database.py")
    # Re-use the SCHEMA constant
    from database import SCHEMA
    cur.executescript(SCHEMA)

    # Clear old data
    for table in ("screenings", "patients", "asha_workers", "sms_queue"):
        cur.execute(f"DELETE FROM {table}")

    # ------------------------------------------------------------------
    # 1.  ASHA workers
    # ------------------------------------------------------------------
    asha_ids = []
    for name, sub_centre in ASHA_WORKERS:
        cur.execute(
            "INSERT INTO asha_workers (name, district_id, sub_centre) VALUES (?, ?, ?)",
            (name, DISTRICT_ID, sub_centre),
        )
        asha_ids.append(cur.lastrowid)

    # ------------------------------------------------------------------
    # 2.  Patients — 10 per village = 50 total
    # ------------------------------------------------------------------
    patient_ids = []
    random.shuffle(FIRST_NAMES)
    for i, name in enumerate(FIRST_NAMES[:50]):
        village = VILLAGES[i % len(VILLAGES)]
        asha_id = asha_ids[i % len(asha_ids)]
        gest_week = random.randint(8, 40)
        abha_id = _random_abha_id()
        cur.execute(
            """INSERT INTO patients (name, asha_id, village, gestational_week, abha_id)
               VALUES (?, ?, ?, ?, ?)""",
            (name, asha_id, village, gest_week, abha_id),
        )
        patient_ids.append(cur.lastrowid)

    # ------------------------------------------------------------------
    # 3.  Screenings — ~1-3 per patient spread over 8 weeks
    # ------------------------------------------------------------------
    divergence_injected = 0
    for pid in patient_ids:
        n_screenings = random.choices([1, 2, 3], weights=[50, 35, 15])[0]
        for _ in range(n_screenings):
            score = random.choice(EPDS_WEIGHTS)
            village_idx = (pid - 1) % len(VILLAGES)
            lang = LANGUAGES[village_idx]
            asha_id = asha_ids[(pid - 1) % len(asha_ids)]

            # Inject a few divergence flags for testing
            if score <= 9 and divergence_injected < 6 and random.random() < 0.3:
                div_flag = 1
                divergence_injected += 1
            else:
                div_flag = 0

            ts = _random_timestamp_in_last_8_weeks()
            cur.execute(
                """INSERT INTO screenings
                   (patient_id, epds_score, divergence_flag, timestamp,
                    asha_id, district_id, language)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (pid, score, div_flag, ts, asha_id, DISTRICT_ID, lang),
            )

    conn.commit()

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    total_patients = cur.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
    total_screenings = cur.execute("SELECT COUNT(*) FROM screenings").fetchone()[0]
    total_ashas = cur.execute("SELECT COUNT(*) FROM asha_workers").fetchone()[0]
    div_total = cur.execute(
        "SELECT COUNT(*) FROM screenings WHERE divergence_flag = 1"
    ).fetchone()[0]

    print(f"[OK] Seeded database: {DATABASE}")
    print(f"     ASHA workers : {total_ashas}")
    print(f"     Patients     : {total_patients}")
    print(f"     Screenings   : {total_screenings}")
    print(f"     Divergence   : {div_total}")

    conn.close()


if __name__ == "__main__":
    seed()
