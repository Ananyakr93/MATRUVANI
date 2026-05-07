@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM MATRUVANI — Local Demo Launcher (Windows)
REM Team CareCoders | RVCE, Bengaluru
REM ═══════════════════════════════════════════════════════════════════════════
REM Usage:  run_demo.bat
REM ═══════════════════════════════════════════════════════════════════════════

setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo ═══════════════════════════════════════════════════════════════
echo     MATRUVANI — Perinatal Mental Health Screening Platform
echo     Team CareCoders ^| RVCE, Bengaluru
echo ═══════════════════════════════════════════════════════════════
echo.

REM ── Step 1: Virtual Environment ─────────────────────────────────────────
echo [1/5] Setting up Python virtual environment...

if not exist "venv\" (
    python -m venv venv
    echo   [OK] Created virtual environment
) else (
    echo   [OK] Virtual environment already exists
)

call venv\Scripts\activate.bat
echo   [OK] Activated virtual environment

REM ── Step 2: Install Dependencies ────────────────────────────────────────
echo [2/5] Installing dependencies...
pip install -q -r requirements.txt
echo   [OK] All dependencies installed

REM ── Step 3: Seed Database ───────────────────────────────────────────────
echo [3/5] Seeding database with synthetic data...
python seed.py
echo   [OK] Database seeded

REM ── Step 4: Start Flask Server ──────────────────────────────────────────
echo [4/5] Starting Flask server on port 5000...
start /B python app.py
timeout /t 3 /nobreak >nul
echo   [OK] Flask server started

REM ── Step 5: Open Browser ────────────────────────────────────────────────
echo [5/5] Opening application in browser...
start http://127.0.0.1:5000/dashboard.html
timeout /t 1 /nobreak >nul
start http://127.0.0.1:5000/

echo.
echo ═══════════════════════════════════════════════════════════════
echo   MATRUVANI demo is running!
echo ═══════════════════════════════════════════════════════════════
echo.
echo   Dashboard:   http://127.0.0.1:5000/dashboard.html
echo   ASHA PWA:    http://127.0.0.1:5000/
echo   API Base:    http://127.0.0.1:5000/api/
echo.
echo   Press Ctrl+C to stop the server
echo.
pause
