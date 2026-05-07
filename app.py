"""
MATRUVANI — Perinatal Mental Health Screening Backend
Flask API for ASHA workers in rural India.
"""

from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS
from database import init_db, get_db
from lexicon import HINDI_DEPRESSION_PHRASES, count_lexicon_hits
from generate_referral import register_referral_routes
from datetime import datetime, timedelta
import json
import os

app = Flask(__name__, static_folder=".")
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:5000", "null"])
register_referral_routes(app)


@app.route("/")
def index():
    return send_from_directory(".", "dashboard.html")


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(".", filename)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

RISK_THRESHOLDS = {
    "green": (0, 8),
    "yellow": (9, 12),
    "red": (13, 30),
}


def classify_risk(score: int) -> str:
    """Map EPDS total to a traffic-light risk level."""
    if score <= 8:
        return "green"
    elif score <= 12:
        return "yellow"
    return "red"


def generate_referral_text(risk_level: str, divergence: bool, language: str) -> str:
    """Return human-readable referral guidance."""
    if risk_level == "red":
        return (
            "⚠️ HIGH RISK — Immediate referral to PHC/District Hospital required. "
            "Please escort the patient or contact the ANM immediately."
        )
    if divergence:
        return (
            "🔶 DIVERGENCE DETECTED — EPDS score is low but speech indicates distress. "
            "Please conduct a follow-up visit within 48 hours and consider PHC referral."
        )
    if risk_level == "yellow":
        return (
            "🟡 MODERATE RISK — Schedule a follow-up screening in 2 weeks. "
            "Provide psycho-education materials and monitor closely."
        )
    return "🟢 LOW RISK — Continue routine follow-up as per schedule."


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/api/screening", methods=["POST"])
def screening():
    """
    Accept EPDS answers + free-speech text, compute score,
    run SADE Lite lexicon match, and return risk assessment.
    """
    data = request.get_json(force=True)

    # --- validate --------------------------------------------------------
    required = ["patient_id", "epds_answers", "language", "asha_id"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    epds_answers = data["epds_answers"]
    if not isinstance(epds_answers, list) or len(epds_answers) != 10:
        return jsonify({"error": "epds_answers must be a list of 10 integers (0-3)"}), 400
    if not all(isinstance(v, int) and 0 <= v <= 3 for v in epds_answers):
        return jsonify({"error": "Each EPDS answer must be an integer 0-3"}), 400

    # --- compute ---------------------------------------------------------
    epds_score = sum(epds_answers)
    risk_level = classify_risk(epds_score)

    free_text = data.get("free_speech_text", "")
    lexicon_hits = count_lexicon_hits(free_text)
    divergence_flag = epds_score <= 9 and lexicon_hits >= 2

    referral_text = generate_referral_text(risk_level, divergence_flag, data["language"])

    # --- persist ---------------------------------------------------------
    db = get_db()
    db.execute(
        """INSERT INTO screenings
           (patient_id, epds_score, divergence_flag, asha_id, language)
           VALUES (?, ?, ?, ?, ?)""",
        (
            data["patient_id"],
            epds_score,
            int(divergence_flag),
            data["asha_id"],
            data["language"],
        ),
    )
    db.commit()

    return jsonify(
        {
            "epds_score": epds_score,
            "risk_level": risk_level,
            "divergence_flag": divergence_flag,
            "lexicon_hits": lexicon_hits,
            "referral_text": referral_text,
        }
    )


@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    """Aggregated screening statistics."""
    db = get_db()

    # Total screened
    total = db.execute("SELECT COUNT(*) FROM screenings").fetchone()[0]

    # By risk level
    green = db.execute(
        "SELECT COUNT(*) FROM screenings WHERE epds_score <= 8"
    ).fetchone()[0]
    yellow = db.execute(
        "SELECT COUNT(*) FROM screenings WHERE epds_score BETWEEN 9 AND 12"
    ).fetchone()[0]
    red = db.execute(
        "SELECT COUNT(*) FROM screenings WHERE epds_score >= 13"
    ).fetchone()[0]

    # Divergence count
    div_count = db.execute(
        "SELECT COUNT(*) FROM screenings WHERE divergence_flag = 1"
    ).fetchone()[0]

    # Top 5 villages by red-flag count
    top_villages = db.execute(
        """SELECT p.village,
                  SUM(CASE WHEN s.epds_score >= 13 THEN 1 ELSE 0 END) AS red_count,
                  COUNT(*) AS total
           FROM screenings s
           JOIN patients p ON s.patient_id = p.id
           GROUP BY p.village
           ORDER BY red_count DESC
           LIMIT 5"""
    ).fetchall()
    top_villages_list = [
        {"village": r[0], "red_count": r[1], "total": r[2],
         "pct": round(r[1] / r[2] * 100, 1) if r[2] else 0}
        for r in top_villages
    ]

    # Weekly trend (last 8 weeks)
    eight_weeks_ago = (datetime.utcnow() - timedelta(weeks=8)).strftime(
        "%Y-%m-%d %H:%M:%S"
    )
    weekly_rows = db.execute(
        """SELECT strftime('%Y-W%W', timestamp) AS week,
                  COUNT(*) AS total,
                  SUM(CASE WHEN epds_score >= 13 THEN 1 ELSE 0 END) AS red,
                  SUM(CASE WHEN epds_score BETWEEN 9 AND 12 THEN 1 ELSE 0 END) AS yellow,
                  SUM(CASE WHEN epds_score <= 8 THEN 1 ELSE 0 END) AS green
           FROM screenings
           WHERE timestamp >= ?
           GROUP BY week
           ORDER BY week""",
        (eight_weeks_ago,),
    ).fetchall()

    weekly_trend = [
        {
            "week": r[0],
            "total": r[1],
            "red": r[2],
            "yellow": r[3],
            "green": r[4],
        }
        for r in weekly_rows
    ]

    return jsonify(
        {
            "total_screened": total,
            "by_risk_level": {"green": green, "yellow": yellow, "red": red},
            "divergence_flag_count": div_count,
            "top_villages_by_red_flag": top_villages_list,
            "weekly_trend": weekly_trend,
        }
    )


@app.route("/api/sms_alert", methods=["POST"])
def sms_alert():
    """Mock SMS alert — logs payload into sms_queue table."""
    data = request.get_json(force=True)

    required = ["asha_name", "patient_village", "epds_score", "phc_number"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    payload = json.dumps(data)
    db = get_db()
    db.execute(
        "INSERT INTO sms_queue (payload, status) VALUES (?, ?)",
        (payload, "queued"),
    )
    db.commit()

    return jsonify({"status": "queued", "message": "SMS alert logged successfully."})


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

@app.teardown_appcontext
def _close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    with app.app_context():
        init_db(app)
    app.run(debug=True, port=5000)
