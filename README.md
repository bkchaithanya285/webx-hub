# 🕸️ WEBX COMMAND — The Control Center of WEBX
> **"Into the Web of Innovation"** • 3–4 October 2026 • 8th Block Seminar Hall, KARE • ₹15,000 Prize Pool • 2 EE Credits

**WEBX COMMAND** is the centralized, real-time command-and-control platform engineered for the WEBX hackathon. It provides synchronized role-based dashboards, server-timestamped problem statement selection with 2-team atomic capacity locks, centralized mobile-first attendance scanning, blind 3-round jury evaluations with reviewer Min-Max normalization, and an Admin-only live leaderboard.

---

## 🚀 Key System Features

### 1. 🌐 Public Experience & Showcase
- **Hero Command Center**: Web-geometry animations, radial particle lattice, event metadata, and official **CSI KARE Student Chapter** crest.
- **Olympic-Style Standing Prize Podium**: 1st Rank Champion (₹6,000), 2nd Rank Runner-up (₹5,000), 3rd Rank 2nd Runner-up (₹4,000).
- **Interactive 30 Problem Statements Matrix**: Real-time slot badges (`0/2`, `1/2`, `2/2` / `FULL`) and rich slide-out drawer on desktop / full-sheet drawer on mobile.

### 2. 🛡️ Admin Command Center
- **Live Metrics Dashboard**: Total teams (60), participants (240), active attendance counts, real-time live activity audit stream.
- **Team 360° Dossier**: Comprehensive team dossier including member registration numbers, PS selection timestamps, attendance history by session, raw and normalized marks by round, reviewer notes, and single-device session controls.
- **Problem Statement Selection Controller**: Server-controlled `releaseAt` and `closeAt` window enforcement, capacity allocation matrix, and manual override assign/reassign with audit trail.
- **Centralized Real-Time Attendance**: Create sessions with lock code, open/close sessions (strict **1 active session** constraint), live present/absent counts.
- **Jury Panel & 3-Round Review Manager**: Configure allowed rounds for reviewers, inspect submitted raw scores, and trigger **Min-Max Score Normalization**.
- **Admin-Only Leaderboard**: Authoritative multi-round ranking calculated from normalized score weights: R1 (25%) + R2 (35%) + R3 (40%).
- **Data Exports**: Instant CSV and formatted reports for Teams, Members, PS Allocations, Attendance, Marks, Leaderboard, and Team 360 Dossiers.
- **Immutable Audit Trail**: Chronological event logs with actor, role, action, target, and metadata.

### 3. 👥 Team Lead Portal (`/team`)
- **Authentication**: Team ID (`WEB-001` to `WEB-060`) and Password as the **Team Lead's Registration Number** (e.g. `9922004001`).
- **Single Device Session Enforcement**: Protects against concurrent logins with active session verification.
- **Identity QR Code**: High-resolution dynamic QR code with explicit instruction: `"USE THIS QR DURING ATTENDANCE"`.
- **Atomic PS Selection**: Live countdown, instant slot availability check, and one-click selection.
- **Real-Time Attendance History**: Session-by-session status of all 4 squad members.
- **3-Round Review Progress**: Live status (`PENDING` / `COMPLETED`) for each evaluation stage.

### 4. 📱 Volunteer Marshal Station (`/volunteer`)
- **Active Session Focus**: Automatically loads only the current `ACTIVE` attendance session.
- **Dual Verification**: Interactive camera QR scanner + manual Team ID fallback.
- **Roster Check-In**: Instant squad roster loading with individual Present / Absent toggles.
- **Immutable Submission Lock**: Submissions lock instantly to prevent tampering.

### 5. ⚖️ Reviewer Scoring Station (`/reviewer`)
- **Google / Email Auth**: Verified against the admin-managed jury panel.
- **Rubric Matrix (0–100 Scale)**:
  - Innovation & Novelty (0–25)
  - Technical Architecture & Execution (0–25)
  - User Experience & Polish (0–25)
  - Presentation & Q&A (0–25)
- **Strict Privacy Isolation**: Reviewers cannot view other reviewers' marks, previous rounds, normalized scores, or the leaderboard.

---

## 🔑 Default Credentials & Persona Test Matrix

| Role | Identifier / Email | Password / Access PIN | Details |
|---|---|---|---|
| **Admin 1** | `bkrishnachaitanya285@gmail.com` | Google Auth / 1-Click | Super Admin (Krishna Chaitanya) |
| **Admin 2** | `taruntej161413@gmail.com` | Google Auth / 1-Click | Super Admin (Tarun Tej) |
| **Team Lead 1** | `WEB-001` | `9922004001` | Lead: Aarav Sharma |
| **Team Lead 12** | `WEB-012` | `9922004012` | Lead: Divya Kapoor |
| **Team Lead 60** | `WEB-060` | `9922004060` | Lead: Vishal Hegde |
| **Volunteer** | Name: `Aditya` | PIN: `1234` or Session Lock Code | Rapid QR Attendance |
| **Reviewer 1** | `dr.ramesh.cse@kare.ac.in` | Google Auth / 1-Click | Dr. K. Ramesh (Systems Lead) |
| **Reviewer 2** | `prof.anita.ai@kare.ac.in` | Google Auth / 1-Click | Prof. S. Anita (AI Lead) |
| **Reviewer 3** | `suresh.v@techcorp.io` | Google Auth / 1-Click | Suresh Venkat (Industry Architect) |

---

## 🧮 Mathematical Score Normalization

To eliminate grading discrepancies across lenient vs. strict judges, the platform runs reviewer-level Min-Max normalization after each round closes:

$$\text{normalizedScore} = \left( \frac{\text{rawScore} - \text{reviewerMin}}{\text{reviewerMax} - \text{reviewerMin}} \right) \times 100$$

- **Same-Score Fallback**: If $\text{reviewerMin} = \text{reviewerMax}$, the algorithm preserves raw scores without dividing by zero and flags the fallback in audit logs.
- **Weighted Leaderboard Total**:
  $$\text{Total Score} = (\text{R1}_{\text{norm}} \times 0.25) + (\text{R2}_{\text{norm}} \times 0.35) + (\text{R3}_{\text{norm}} \times 0.40)$$

---

## 🛠️ Local Development & Production Build

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build production bundle
npm run build
```

---

---

## 📁 Monorepo & Standalone Architecture

```
webx-hub/
├── frontend/                  # Self-contained Frontend (Vite + React + TS + Tailwind)
│   ├── src/                   # Components, Contexts, Hooks, Services, Types
│   ├── public/                # Static assets & logos
│   ├── index.html             # Single-page entry
│   ├── package.json           # Frontend dependencies & build scripts
│   ├── vite.config.ts         # Vite build configuration
│   └── tsconfig.json          # Frontend TS configuration
│
└── backend/                   # Self-contained Backend (Cloud Functions + Express REST API)
    ├── src/
    │   └── index.ts           # Auto-Normalization engine, Attendance API, Atomic Locks
    ├── package.json           # Backend dependencies (firebase-admin, functions, express)
    ├── tsconfig.json          # Node/CommonJS compilation config
    ├── firestore.rules        # Security rules with role-based access control
    └── .env                   # Environment config
```

---

## 🚀 Easy Deployment Guide

### Option 1: Frontend Deployment (Vercel / Netlify / Firebase Hosting)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

```bash
# Local build verification
npm run build:frontend
```

### Option 2: Backend Deployment (Firebase Cloud Functions / Cloud Run)
- **Directory**: `backend`

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions & REST API
cd backend
npm install
npm run build
firebase deploy --only functions
```

### Monorepo Quick Commands:
- `npm run dev:frontend` — Start frontend local dev server
- `npm run dev:backend` — Start backend emulator / functions
- `npm run build:all` — Build both frontend & backend packages
