-- MATRUVANI Migration 002 — Screenings
-- PostgreSQL-compatible schema

CREATE TABLE IF NOT EXISTS screenings (
    id                SERIAL PRIMARY KEY,
    patient_id        INTEGER NOT NULL,
    epds_score        INTEGER NOT NULL,
    divergence_flag   BOOLEAN DEFAULT FALSE,
    timestamp         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    asha_id           INTEGER NOT NULL,
    district_id       TEXT,
    language          TEXT DEFAULT 'hi',
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (asha_id)    REFERENCES asha_workers(id)
);
