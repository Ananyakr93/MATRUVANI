"""
MATRUVANI — Referral Card PDF Generator

Generates a clean, professional A4 referral card using ReportLab.
Designed to be printed in the field and handed to the mother or PHC doctor.

Usage (standalone):
    from src.referral import build_referral_pdf
    pdf_bytes = build_referral_pdf({...})

Usage (Flask):
    Registers POST /api/generate_referral on the supplied Flask app.
"""

from __future__ import annotations

import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

# ---------------------------------------------------------------------------
# Colour palette — mirrors the MATRUVANI design system
# ---------------------------------------------------------------------------

_BRAND_TERRACOTTA = colors.HexColor("#E07A5F")   # primary accent
_BRAND_CREAM      = colors.HexColor("#FDF6EC")    # background warmth
_BRAND_DARK       = colors.HexColor("#2D3142")    # text
_BRAND_SAGE       = colors.HexColor("#8AAE92")    # green accent

_RISK_COLORS = {
    "red":    colors.HexColor("#D32F2F"),
    "yellow": colors.HexColor("#F9A825"),
    "green":  colors.HexColor("#388E3C"),
}

_DIVERGENCE_BG    = colors.HexColor("#FFF3CD")
_DIVERGENCE_BORDER = colors.HexColor("#FFCA28")

# ---------------------------------------------------------------------------
# Risk-based referral actions
# ---------------------------------------------------------------------------

_REFERRAL_ACTIONS: dict[str, list[str]] = {
    "red": [
        "IMMEDIATE referral to Primary Health Centre (PHC) / District Hospital. "
        "Escort the patient or arrange transport within 24 hours.",
        "Initiate eSanjeevani teleconsultation if PHC access is delayed — "
        "https://esanjeevani.mohfw.gov.in",
        "Inform ANM / Medical Officer immediately and document the referral "
        "in the RCH register.",
    ],
    "yellow": [
        "Schedule a follow-up screening visit within 7 days.",
        "Inform the PHC Medical Officer about the moderate-risk case for "
        "awareness and preparedness.",
        "Provide psycho-education materials on perinatal mental health and "
        "encourage family support.",
    ],
    "green": [
        "Continue routine follow-up as per the ASHA home-visit schedule.",
        "Reinforce positive maternal health practices and nutrition counselling.",
        "Re-screen at the next scheduled antenatal/postnatal visit "
        "(within 4 weeks).",
    ],
}

_RISK_LABELS = {
    "red":    "HIGH RISK",
    "yellow": "MODERATE RISK",
    "green":  "LOW RISK",
}


# ---------------------------------------------------------------------------
# PDF Builder
# ---------------------------------------------------------------------------

def _classify_risk(epds_score: int) -> str:
    """Map EPDS total to a traffic-light risk level."""
    if epds_score <= 8:
        return "green"
    elif epds_score <= 12:
        return "yellow"
    return "red"


def build_referral_pdf(data: dict[str, Any]) -> bytes:
    """
    Build a MATRUVANI referral card PDF and return its bytes.

    Expected *data* keys:
        patient_id       (str)  — anonymized ID
        epds_score       (int)  — 0-30
        divergence_flag  (bool)
        asha_name        (str)
        village          (str)
        sub_centre       (str, optional)
        gestational_info (str, optional)  — e.g. "32 weeks" or "14 days PP"

    Returns:
        Raw PDF bytes (application/pdf).
    """

    buf = io.BytesIO()
    page_w, page_h = A4

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2.0 * cm,
        rightMargin=2.0 * cm,
        topMargin=1.5 * cm,
        bottomMargin=2.0 * cm,
        title="MATRUVANI Referral Card",
        author="MATRUVANI System",
    )

    # --- styles ----------------------------------------------------------
    styles = getSampleStyleSheet()

    s_logo = ParagraphStyle(
        "Logo",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=_BRAND_TERRACOTTA,
        alignment=TA_LEFT,
        spaceAfter=0,
        leading=26,
    )
    s_subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        textColor=_BRAND_DARK,
        alignment=TA_LEFT,
        spaceAfter=2 * mm,
    )
    s_date = ParagraphStyle(
        "DateRight",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=colors.HexColor("#666666"),
        alignment=TA_RIGHT,
    )
    s_section_title = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=_BRAND_DARK,
        spaceBefore=10,
        spaceAfter=4,
        borderPadding=0,
        leading=15,
    )
    s_body = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=_BRAND_DARK,
        leading=14,
    )
    s_body_bold = ParagraphStyle(
        "BodyBold",
        parent=s_body,
        fontName="Helvetica-Bold",
    )
    s_score_large = ParagraphStyle(
        "ScoreLarge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=36,
        alignment=TA_CENTER,
        leading=42,
    )
    s_risk_label = ParagraphStyle(
        "RiskLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        alignment=TA_CENTER,
        leading=17,
    )
    s_divergence = ParagraphStyle(
        "Divergence",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=colors.HexColor("#856404"),
        alignment=TA_CENTER,
        leading=14,
    )
    s_bullet = ParagraphStyle(
        "Bullet",
        parent=s_body,
        leftIndent=12,
        bulletIndent=0,
        spaceBefore=3,
        spaceAfter=3,
    )
    s_footer = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        textColor=colors.HexColor("#999999"),
        alignment=TA_CENTER,
        leading=10,
    )

    # --- extract data ----------------------------------------------------
    patient_id      = data.get("patient_id", "N/A")
    epds_score      = int(data.get("epds_score", 0))
    divergence_flag = bool(data.get("divergence_flag", False))
    asha_name       = data.get("asha_name", "N/A")
    village         = data.get("village", "N/A")
    sub_centre      = data.get("sub_centre", "—")
    gest_info       = data.get("gestational_info", "—")
    risk_level      = _classify_risk(epds_score)
    risk_color      = _RISK_COLORS[risk_level]
    now_str         = datetime.now().strftime("%d %B %Y, %H:%M")

    elements: list = []

    # ═══════════════════════════════════════════════════════════════════════
    # HEADER
    # ═══════════════════════════════════════════════════════════════════════

    # Logo + date on same row
    header_data = [
        [
            Paragraph("MATRUVANI", s_logo),
            Paragraph(now_str, s_date),
        ]
    ]
    header_table = Table(header_data, colWidths=[page_w * 0.55, page_w * 0.30])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)

    elements.append(
        Paragraph("Perinatal Mental Health Referral Card", s_subtitle)
    )

    # Terracotta rule
    elements.append(
        HRFlowable(
            width="100%",
            thickness=2,
            color=_BRAND_TERRACOTTA,
            spaceAfter=8,
            spaceBefore=2,
        )
    )

    # ═══════════════════════════════════════════════════════════════════════
    # PATIENT INFORMATION
    # ═══════════════════════════════════════════════════════════════════════

    elements.append(Paragraph("PATIENT INFORMATION", s_section_title))

    patient_data = [
        [
            Paragraph("<b>Patient ID:</b>", s_body),
            Paragraph(str(patient_id), s_body),
            Paragraph("<b>Village:</b>", s_body),
            Paragraph(str(village), s_body),
        ],
        [
            Paragraph("<b>Gestational / PP:</b>", s_body),
            Paragraph(str(gest_info), s_body),
            Paragraph("<b>Date:</b>", s_body),
            Paragraph(now_str.split(",")[0], s_body),
        ],
    ]
    avail_w = page_w - 4.0 * cm  # after margins
    patient_table = Table(
        patient_data,
        colWidths=[avail_w * 0.22, avail_w * 0.28, avail_w * 0.18, avail_w * 0.32],
    )
    patient_table.setStyle(TableStyle([
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",  (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("GRID",        (0, 0), (-1, -1), 0.4, colors.HexColor("#DDDDDD")),
        ("BACKGROUND",  (0, 0), (-1, -1), colors.HexColor("#FAFAFA")),
    ]))
    elements.append(patient_table)
    elements.append(Spacer(1, 6 * mm))

    # ═══════════════════════════════════════════════════════════════════════
    # SCREENING RESULT — EPDS SCORE CARD
    # ═══════════════════════════════════════════════════════════════════════

    elements.append(Paragraph("SCREENING RESULT", s_section_title))

    # Dynamic score colour
    s_score_colored = ParagraphStyle(
        "ScoreColored",
        parent=s_score_large,
        textColor=risk_color,
    )
    s_risk_colored = ParagraphStyle(
        "RiskColored",
        parent=s_risk_label,
        textColor=risk_color,
    )

    score_display = [
        [
            Paragraph(f"EPDS Score", s_body_bold),
            Paragraph(f"Risk Level", s_body_bold),
        ],
        [
            Paragraph(str(epds_score), s_score_colored),
            Paragraph(_RISK_LABELS[risk_level], s_risk_colored),
        ],
        [
            Paragraph(f"out of 30", s_body),
            Paragraph(f"Threshold: ≤8 Green | 9-12 Yellow | ≥13 Red", ParagraphStyle(
                "ThresholdNote", parent=s_body, fontSize=8,
                textColor=colors.HexColor("#888888"),
            )),
        ],
    ]
    score_table = Table(score_display, colWidths=[avail_w * 0.35, avail_w * 0.65])
    score_table.setStyle(TableStyle([
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",        (0, 0), (0, -1), "CENTER"),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("BOX",          (0, 0), (-1, -1), 1, risk_color),
        ("LINEBELOW",    (0, 0), (-1, 0), 0.5, colors.HexColor("#CCCCCC")),
        ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#F5F5F5")),
    ]))
    elements.append(score_table)
    elements.append(Spacer(1, 4 * mm))

    # ═══════════════════════════════════════════════════════════════════════
    # DIVERGENCE BANNER (conditional)
    # ═══════════════════════════════════════════════════════════════════════

    if divergence_flag:
        div_data = [[
            Paragraph(
                "⚠  AI DIVERGENCE FLAG — Speech analysis indicates distress markers "
                "inconsistent with the reported EPDS score. Enhanced clinical "
                "assessment is recommended.",
                s_divergence,
            )
        ]]
        div_table = Table(div_data, colWidths=[avail_w])
        div_table.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), _DIVERGENCE_BG),
            ("BOX",          (0, 0), (-1, -1), 1.2, _DIVERGENCE_BORDER),
            ("TOPPADDING",   (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
            ("LEFTPADDING",  (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(div_table)
        elements.append(Spacer(1, 4 * mm))

    # ═══════════════════════════════════════════════════════════════════════
    # RECOMMENDED ACTIONS
    # ═══════════════════════════════════════════════════════════════════════

    elements.append(Paragraph("RECOMMENDED ACTIONS", s_section_title))

    actions = _REFERRAL_ACTIONS[risk_level]
    for i, action in enumerate(actions, 1):
        bullet_text = f"<b>{i}.</b>  {action}"
        elements.append(Paragraph(bullet_text, s_bullet))

    elements.append(Spacer(1, 6 * mm))

    # ═══════════════════════════════════════════════════════════════════════
    # ASHA WORKER DETAILS
    # ═══════════════════════════════════════════════════════════════════════

    elements.append(
        HRFlowable(
            width="100%", thickness=0.5,
            color=colors.HexColor("#CCCCCC"),
            spaceAfter=4, spaceBefore=2,
        )
    )

    elements.append(Paragraph("SCREENED BY", s_section_title))

    asha_data = [
        [
            Paragraph("<b>ASHA Worker:</b>", s_body),
            Paragraph(str(asha_name), s_body),
            Paragraph("<b>Sub-Centre:</b>", s_body),
            Paragraph(str(sub_centre), s_body),
        ]
    ]
    asha_table = Table(
        asha_data,
        colWidths=[avail_w * 0.20, avail_w * 0.30, avail_w * 0.18, avail_w * 0.32],
    )
    asha_table.setStyle(TableStyle([
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("LEFTPADDING",  (0, 0), (-1, -1), 4),
        ("GRID",         (0, 0), (-1, -1), 0.4, colors.HexColor("#DDDDDD")),
        ("BACKGROUND",   (0, 0), (-1, -1), colors.HexColor("#FAFAFA")),
    ]))
    elements.append(asha_table)
    elements.append(Spacer(1, 6 * mm))

    # Signature line
    sig_data = [
        [
            Paragraph("ASHA Signature: ________________________", s_body),
            Paragraph("PHC Doctor Signature: ________________________", s_body),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[avail_w * 0.50, avail_w * 0.50])
    sig_table.setStyle(TableStyle([
        ("VALIGN",     (0, 0), (-1, -1), "BOTTOM"),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
    ]))
    elements.append(sig_table)

    # ═══════════════════════════════════════════════════════════════════════
    # FOOTER
    # ═══════════════════════════════════════════════════════════════════════

    elements.append(Spacer(1, 12 * mm))
    elements.append(
        HRFlowable(
            width="100%", thickness=0.5,
            color=colors.HexColor("#CCCCCC"),
            spaceAfter=4, spaceBefore=0,
        )
    )
    elements.append(Paragraph(
        "MATRUVANI v1.0  |  DPDP Act 2023 Compliant  |  "
        "Data anonymized  |  Generated: " + now_str,
        s_footer,
    ))
    elements.append(Paragraph(
        "This document is for medical use only. Handle in accordance with "
        "patient data protection guidelines.",
        s_footer,
    ))

    # --- build -----------------------------------------------------------
    doc.build(elements)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Flask route registration
# ---------------------------------------------------------------------------

def register_referral_routes(app):
    """
    Register the POST /api/generate_referral route on the given Flask app.

    Expects JSON body:
        {
            "patient_id":       "MV-2026-0042",
            "epds_score":       14,
            "divergence_flag":  true,
            "asha_name":        "Sunita Devi",
            "village":          "Rampur",
            "sub_centre":       "Rampur SC",          // optional
            "gestational_info": "34 weeks gestation"  // optional
        }

    Returns:
        application/pdf file download.
    """
    from flask import request, jsonify, make_response

    @app.route("/api/generate_referral", methods=["POST"])
    def api_generate_referral():
        data = request.get_json(force=True)

        # Validate required fields
        required = ["patient_id", "epds_score", "asha_name", "village"]
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        try:
            data["epds_score"] = int(data["epds_score"])
        except (ValueError, TypeError):
            return jsonify({"error": "epds_score must be an integer (0-30)"}), 400

        if not (0 <= data["epds_score"] <= 30):
            return jsonify({"error": "epds_score must be between 0 and 30"}), 400

        # Generate PDF
        pdf_bytes = build_referral_pdf(data)

        # Build response
        response = make_response(pdf_bytes)
        response.headers["Content-Type"] = "application/pdf"
        response.headers["Content-Disposition"] = (
            f"attachment; filename=MATRUVANI_Referral_{data['patient_id']}.pdf"
        )
        return response
