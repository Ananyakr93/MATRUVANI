# MATRUVANI — माँ की आवाज़, माँ का ख्याल

**AI4India Hackathon | Team CARECODERS | RVCE Bangalore**

> *Turning every ASHA home visit into a 4-minute mental health screening.*

---

## The Problem

Over **90% of perinatal depression** in rural India goes undetected. With **26 million births per year**, the scale of unaddressed maternal mental health is staggering.

The Edinburgh Postnatal Depression Scale (EPDS) is free, validated, and 50 years old. **Not one PHC in India routinely uses it.**

ASHA workers — India's 1 million frontline health workers — visit every pregnant and postpartum woman. They have the reach. They lack the tools.

## The Solution: MATRUVANI

An **offline-first PWA** that turns every ASHA home visit into a 4-minute mental health screening.

| Feature | Description |
|---|---|
| 🎤 **Voice-guided EPDS** | 10-question validated screening in 7 Indian languages |
| 🧠 **AI Divergence Detection** | SADE-Lite NLP catches underreporting via free speech analysis |
| 📱 **Automated SMS Escalation** | Instant referral to nearest PHC when risk is detected |
| 📊 **District Intelligence** | Population-level dashboard with dark village detection |
| 🔒 **DPDP Compliant** | Zero PII stored — phone hashes, village codes only |
| ✈️ **Offline-First** | Complete screenings with no connectivity, sync when online |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  ASHA Worker (Mobile PWA)                       │
│  React + Vite + Zustand + Service Worker        │
│  ├── EPDS Screening Flow (voice-guided)         │
│  ├── Free Speech → SADE-Lite Divergence         │
│  ├── Offline Queue (IndexedDB)                  │
│  └── Print Referral (A5 PDF)                    │
├─────────────────────────────────────────────────┤
│  Backend (FastAPI + SQLite)                     │
│  ├── /screening/analyze → EPDS + AMS scoring    │
│  ├── /screening/session → Session persistence   │
│  ├── /dashboard/stats → Aggregated analytics    │
│  └── /sms/send-referral → Twilio SMS gateway    │
├─────────────────────────────────────────────────┤
│  Doctor Dashboard                               │
│  ├── Today's referrals (priority queue)         │
│  ├── Session table with filters                 │
│  └── 30-day screening trends                    │
├─────────────────────────────────────────────────┤
│  District Dashboard                             │
│  ├── Population-level stats                     │
│  ├── Dark village detection (≥40% high risk)    │
│  ├── ASHA coverage monitoring                   │
│  └── CSV export for NHM reporting               │
└─────────────────────────────────────────────────┘
```

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000
```

### Demo Mode
Visit **http://localhost:5173/demo** for an automated walkthrough of the complete MATRUVANI flow — no user input required.

## Key Screens

| Screen | Route | Description |
|---|---|---|
| Welcome | `/` | Language selection + role picker |
| ASHA Login | `/asha/login` | Phone hash authentication |
| ASHA Home | `/asha/home` | New screening CTA + monthly stats |
| Screening | `/asha/screen` | 10 EPDS questions + free speech |
| Result Card | `/asha/result` | Risk assessment + ASHA script |
| Session History | `/asha/history` | Monthly view with risk breakdown |
| Doctor Dashboard | `/doctor/dashboard` | Referral queue + session table |
| District Dashboard | `/district/dashboard` | Population analytics + dark villages |
| **Demo** | `/demo` | Auto-playing presentation walkthrough |

## Clinical Logic

- **EPDS Scoring**: Standard 0-30 scale with reverse-scored items
- **Risk Levels**: LOW (0-9), MODERATE (10-12), HIGH (13+ or Q10 > 0)
- **Q10 Override**: Any self-harm ideation → automatic HIGH classification
- **SADE-Lite**: Hindi distress lexicon with AMS scoring for divergence detection
- **Divergence Flag**: When free speech sentiment contradicts EPDS score → clinical review flag

## Privacy & Compliance (DPDP Act 2023)

- **No names stored** — village codes only
- **Phone numbers hashed** (SHA-256) before storage
- **All data anonymized** at collection point
- **Referral slips** contain minimal clinical data
- **Print timestamp** for audit trail

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| State | Zustand (persisted) |
| UI | shadcn/ui, Lucide React, Recharts |
| PWA | VitePWA, Workbox |
| Backend | FastAPI, SQLite, Python 3.11+ |
| NLP | SADE-Lite (custom Hindi lexicon) |
| SMS | Twilio (optional) |

## Team

| Member | Domain | Role |
|---|---|---|
| **Ananya K R** | Data Science | SADE-Lite NLP + Clinical Logic |
| **Prapti Belekeri** | Information Science | Dashboard + Analytics |
| **Rishab Rajesh Nayak** | AIML | Backend + API Architecture |
| **Rohan S** | Computer Science | Frontend + PWA + UX |

**RV College of Engineering, Bangalore**

---

**HopeWorks Foundation × AI4India**

*"Because every mother's voice deserves to be heard."*
