"""
MATRUVANI — Flask API
Routes for screening, dashboard, SMS alerts, referral generation, and health check.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv

from src.screening import count_lexicon_hits, compute_ams
from src.referral import build_referral_pdf, register_referral_routes
from src.stores.screenings import (
    insert_screening,
    get_screening_counts_by_risk,
    get_divergence_count,
    get_weekly_trend,
)
from src.stores.patients import get_top_villages_by_red_flag

import psycopg2
import psycopg2.extras

load_dotenv()

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

def create_app() -> Flask:
    """Application factory — creates and configures the Flask app."""
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config["DATABASE_URL"] = os.getenv(
        "DATABASE_URL", "postgresql://matruvani:matruvani@localhost:5432/matruvani"
    )

    # --- CORS ---------------------------------------------------------------
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    origins = [o.strip() for o in allowed_origins.split(",") if o.strip()]
    CORS(app, origins=origins)

    # --- Register referral blueprint/routes ---------------------------------
    register_referral_routes(app)

    # --- Register all routes ------------------------------------------------
    _register_routes(app)

    return app


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    """Return a per-request PostgreSQL connection (stored on flask.g)."""
    if "db" not in g:
        from flask import current_app
        g.db = psycopg2.connect(current_app.config["DATABASE_URL"])
        g.db.autocommit = False
    return g.db


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

def _register_routes(app: Flask):
    """Register all application routes on the Flask app."""

    @app.route("/api/health", methods=["GET"])
    def health():
        """Health check endpoint."""
        return jsonify({"status": "ok", "service": "matruvani-backend", "version": "0.2.0"})

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
        insert_screening(
            db,
            patient_id=data["patient_id"],
            epds_score=epds_score,
            divergence_flag=divergence_flag,
            asha_id=data["asha_id"],
            language=data["language"],
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

        counts = get_screening_counts_by_risk(db)
        div_count = get_divergence_count(db)
        top_villages = get_top_villages_by_red_flag(db)
        weekly_trend = get_weekly_trend(db)

        return jsonify(
            {
                "total_screened": counts["total"],
                "by_risk_level": {
                    "green": counts["green"],
                    "yellow": counts["yellow"],
                    "red": counts["red"],
                },
                "divergence_flag_count": div_count,
                "top_villages_by_red_flag": top_villages,
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
        cur = db.cursor()
        cur.execute(
            "INSERT INTO sms_queue (payload, status) VALUES (%s, %s)",
            (payload, "queued"),
        )
        db.commit()

        return jsonify({"status": "queued", "message": "SMS alert logged successfully."})

    # --- App lifecycle ------------------------------------------------------

    @app.teardown_appcontext
    def _close_db(exception):
        db = g.pop("db", None)
        if db is not None:
            db.close()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
