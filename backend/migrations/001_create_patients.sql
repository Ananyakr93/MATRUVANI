-- MATRUVANI Migration 001 — Patients & ASHA Workers
-- PostgreSQL-compatible schema

CREATE TABLE IF NOT EXISTS patients (
    id                SERIAL PRIMARY KEY,
    name              TEXT NOT NULL,
    asha_id           INTEGER NOT NULL,
    village           TEXT NOT NULL,
    gestational_week  INTEGER,
    abha_id           TEXT
);

CREATE TABLE IF NOT EXISTS asha_workers (
    id                SERIAL PRIMARY KEY,
    name              TEXT NOT NULL,
    district_id       TEXT NOT NULL,
    sub_centre        TEXT NOT NULL
);
