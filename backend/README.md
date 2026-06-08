# EduAlert GH — Backend API

AI-Powered Student Performance Prediction & Early Warning System  
Built with FastAPI + Python + scikit-learn

---

## Quick Start

### 1. Clone and set up environment
```bash
cd edualert-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 3. Seed the database with sample data
```bash
python seed.py
```

### 4. Run the development server
```bash
uvicorn main:app --reload
```

### 5. Open API docs in browser
```
http://localhost:8000/docs
```

---

## Project Structure

```
edualert-backend/
├── main.py              # FastAPI app + route registration
├── database.py          # DB engine + session + get_db dependency
├── requirements.txt     # Python dependencies
├── seed.py              # Sample data for testing
├── .env.example         # Environment variable template
│
├── core/
│   ├── config.py        # App settings (reads from .env)
│   ├── security.py      # Password hashing + JWT token logic
│   └── dependencies.py  # Auth guards (get_current_user, require_teacher, require_admin)
│
├── models/              # SQLAlchemy database table definitions
│   ├── user.py          # Teachers and headmasters
│   ├── student.py       # Student records
│   ├── score.py         # Assessment scores
│   ├── attendance.py    # Daily attendance
│   └── prediction.py    # AI prediction results
│
├── schemas/             # Pydantic request/response validation
│   ├── user.py
│   ├── student.py
│   ├── score.py
│   ├── attendance.py
│   └── prediction.py
│
├── routes/              # API endpoint handlers
│   ├── auth.py          # /api/auth/register, /api/auth/login
│   ├── students.py      # CRUD for student records
│   ├── scores.py        # Record and retrieve scores
│   ├── attendance.py    # Record and retrieve attendance
│   ├── predictions.py   # Run AI predictions
│   └── admin.py         # Headmaster dashboard endpoints
│
└── ml/
    ├── predictor.py     # Feature extraction + risk scoring logic
    └── ai_suggestion.py # Claude API integration for teacher suggestions
```

---

## API Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/auth/register | Create account | Public |
| POST | /api/auth/login | Get JWT token | Public |
| GET | /api/students/ | List teacher's students | Teacher |
| POST | /api/students/ | Add a student | Teacher |
| POST | /api/scores/ | Record a score | Teacher |
| POST | /api/attendance/ | Record attendance | Teacher |
| POST | /api/predictions/run/{id} | Run AI prediction for one student | Teacher |
| POST | /api/predictions/run-all | Run predictions for all students | Teacher |
| GET | /api/admin/dashboard | School-wide summary | Admin |
| GET | /api/admin/at-risk | All high-risk students | Admin |

---

## Default Test Accounts (after running seed.py)

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@edualert.gh | password123 |
| Headmaster | admin@edualert.gh | password123 |
