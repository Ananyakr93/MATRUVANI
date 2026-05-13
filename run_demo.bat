@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM MATRUVANI — Local Demo Launcher (Windows)
REM Team CareCoders ^| RVCE, Bengaluru
REM ═══════════════════════════════════════════════════════════════════════════
REM Usage:  run_demo.bat
REM Starts: FastAPI backend on port 8001 + Vite React frontend on port 5173
REM ═══════════════════════════════════════════════════════════════════════════

setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo ═══════════════════════════════════════════════════════════════
echo     MATRUVANI — Perinatal Mental Health Screening Platform
echo     Team CareCoders ^| RVCE, Bengaluru
echo ═══════════════════════════════════════════════════════════════
echo.

REM ── Step 1: Python Virtual Environment ───────────────────────────────────
echo [1/5] Checking Python virtual environment...

if not exist "backend\venv\" (
    echo   Creating virtual environment in backend\venv ...
    python -m venv backend\venv
    echo   [OK] Created virtual environment
) else (
    echo   [OK] Virtual environment already exists
)

REM ── Step 2: Install backend dependencies ─────────────────────────────────
echo [2/5] Installing backend dependencies...
backend\venv\Scripts\pip.exe install -q -e backend\
echo   [OK] Backend dependencies installed

REM ── Step 3: Seed database ────────────────────────────────────────────────
echo [3/5] Seeding database with synthetic data...
backend\venv\Scripts\python.exe backend\seed.py
echo   [OK] Database seeded

REM ── Step 4: Start FastAPI backend on port 8001 ───────────────────────────
echo [4/5] Starting FastAPI backend on port 8001...
start "MATRUVANI - FastAPI Backend" cmd /k "backend\venv\Scripts\uvicorn.exe backend.main:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 3 /nobreak >nul
echo   [OK] FastAPI server starting at http://localhost:8001

REM ── Step 5: Start Vite React frontend ────────────────────────────────────
echo [5/5] Starting Vite React frontend dev server...
start "MATRUVANI - Vite Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 5 /nobreak >nul
echo   [OK] Frontend dev server starting at http://localhost:5173

REM ── Open browser ─────────────────────────────────────────────────────────
start http://localhost:5173

echo.
echo ═══════════════════════════════════════════════════════════════
echo   MATRUVANI demo is running!
echo ═══════════════════════════════════════════════════════════════
echo.
echo   ASHA PWA / Dashboards:  http://localhost:5173
echo   FastAPI backend:        http://localhost:8001
echo   Interactive API docs:   http://localhost:8001/docs
echo   Health check:           http://localhost:8001/health
echo.
echo   Two terminal windows are open:
echo     "MATRUVANI - FastAPI Backend"  (port 8001)
echo     "MATRUVANI - Vite Frontend"    (port 5173)
echo.
echo   Close those windows or press Ctrl+C in each to stop the servers.
echo.
pause
