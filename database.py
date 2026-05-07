"""
Database initialisation and helper for MATRUVANI.
Uses SQLite via the built-in sqlite3 module.
"""

import sqlite3
import os
from flask import g, current_app

DATABASE = os.path.join(os.path.dirname(__file__), "matruvani.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS patients (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    asha_id         INTEGER NOT NULL,
    village         TEXT    NOT NULL,
    gestational_week INTEGER,
    abha_id         TEXT
);

CREATE TABLE IF NOT EXISTS asha_workers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    district_id     TEXT    NOT NULL,
    sub_centre      TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS screenings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL,
    epds_score      INTEGER NOT NULL,
    divergence_flag INTEGER DEFAULT 0,
    timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP,
    asha_id         INTEGER NOT NULL,
    district_id     TEXT,
    language        TEXT    DEFAULT 'hi',
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (asha_id)    REFERENCES asha_workers(id)
);

CREATE TABLE IF NOT EXISTS sms_queue (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    payload         TEXT    NOT NULL,
    status          TEXT    DEFAULT 'queued',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""


def get_db():
    """Return a per-request database connection (stored on flask.g)."""
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


def init_db(app=None):
    """Create tables if they don't exist yet."""
    db = get_db()
    db.executescript(SCHEMA)
    db.commit()
