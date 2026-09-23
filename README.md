# Campus Lost & Found Management System

A production-quality full-stack web application designed for college campuses to convert informal lost-and-found communication into a trackable, secure, and measured **System of Record**.

---

## 🌟 Key Features

1. **Complete Lifecycle Management**:
   - `Lost/Found Report -> Search -> Physical Handover -> Receipt Confirmation -> Match Signal Analysis -> Ownership Verification -> Physical Return -> Case Closed`.
2. **Strict Administrative Distinction**:
   - Differentiates between *"A student says they found an item"* (`HANDOVER_PENDING`) and *"The administrator has physically received the item"* (`RECEIVED_BY_ADMIN`).
3. **Role-Based Access Control (RBAC)**:
   - **Student**: Report lost/found items, upload photos, track case progress, receive alerts, answer ownership questions.
   - **Admin**: Review cases, record physical item storage locations & conditions, analyze AI match signals, approve matches, send verification questions, execute returns, view audit logs, access analytics.
4. **Explainable AI Matching Engine**:
   - Decoupled scoring service evaluating TF-IDF text similarity, category exact match, brand match, color match, location proximity, and date/time decay curves.
5. **Ownership Verification & Return Workflow**:
   - Verification prompt creation by Admin -> Student answer submission -> Admin pass/fail review -> Return logging with recipient ID & verification method.
6. **Audit Logging & Recovery Analytics**:
   - Immutable audit trail recording every state change and administrative action. Real-time metrics for recovery rate %, average handover hours, average recovery days, category distribution, and location heatmaps.
7. **College Communication Message Generator**:
   - Formats approved lost/found case summaries for copy-pasting into official administrator-controlled college groups (WhatsApp/Telegram/Email).

---

## 🛠️ Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, Passlib (bcrypt), Scikit-Learn (TF-IDF), SQLite / PostgreSQL compatibility.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, React Router v6.
- **Testing**: Pytest (backend unit/integration) & HTTPX automated 25-step E2E acceptance scenario runner.

---

## 🔐 Seed Test Accounts

Development and testing accounts pre-seeded into the database:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin.test@campus.edu` | `Admin@12345` | Campus Admin Coordinator |
| **Student A** | `student1.test@campus.edu` | `Student@12345` | Test Student One (Computer Science) |
| **Student B** | `student2.test@campus.edu` | `Student@12345` | Test Student Two (Electrical Engineering) |

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.12+
- Node.js v18+ & npm

### 1. Backend Setup & Server Start

```bash
# Navigate to project root
cd "lost and found project"

# Install backend dependencies
pip install -r backend/requirements.txt

# Initialize database and seed test accounts
python backend/seed.py

# Start FastAPI backend server (Runs on http://127.0.0.1:8000)
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- **Interactive API Documentation**: [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)

### 2. Frontend Web Application Setup & Start

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server (Runs on http://127.0.0.1:3000)
npm run dev -- --host 127.0.0.1 --port 3000
```

Open [`http://127.0.0.1:3000`](http://127.0.0.1:3000) in your browser. Use the **Quick-Fill Buttons** on the Login screen to log in as Student A, Student B, or Admin with 1 click.

---

## 🧪 Testing Suite Execution

### Automated Backend Tests
```bash
python -m pytest backend/tests
```

### End-to-End 25-Step Acceptance Scenario Test
Executes the full real-world journey from Student A lost calculator report -> Student B found report -> Admin physical handover receipt -> AI matching -> Ownership verification -> Final item return -> Audit log verification.

```bash
python backend/tests/e2e_acceptance_scenario.py
```

---

## 📡 API Overview

- `POST /api/v1/auth/register` - Student registration
- `POST /api/v1/auth/login` - OAuth2 password token login
- `GET /api/v1/auth/me` - Profile of authenticated user
- `POST /api/v1/lost-items` - Create lost report (generates Case ID `LF-YYYY-XXXX`)
- `GET /api/v1/lost-items` - List & search lost items
- `POST /api/v1/found-items` - Create found report (generates Case ID `FF-YYYY-XXXX`, status `HANDOVER_PENDING`)
- `POST /api/v1/admin/handovers` - Admin confirm physical item receipt (`RECEIVED_BY_ADMIN`)
- `POST /api/v1/matches/run` - Trigger AI matching engine
- `GET /api/v1/matches` - List matches with explainable signal breakdown
- `POST /api/v1/verifications` - Admin create ownership question
- `POST /api/v1/verifications/{id}/answer` - Student submit answer
- `POST /api/v1/verifications/{id}/review` - Admin pass/fail review
- `POST /api/v1/returns` - Admin execute physical item return & close cases
- `GET /api/v1/notifications` - User alerts & read status
- `GET /api/v1/admin/analytics` - Recovery metrics & distributions
- `GET /api/v1/admin/audit-logs` - System audit log history
