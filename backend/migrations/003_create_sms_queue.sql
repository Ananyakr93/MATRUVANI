-- MATRUVANI Migration 003 — SMS Queue
-- PostgreSQL-compatible schema

CREATE TABLE IF NOT EXISTS sms_queue (
    id                SERIAL PRIMARY KEY,
    payload           TEXT NOT NULL,
    status            TEXT DEFAULT 'queued',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
