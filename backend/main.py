from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, students, scores, attendance, predictions, admin
from database import engine, Base
import models.all_models
# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EduAlert GH API",
    description="AI-Powered Student Performance Prediction & Early Warning System for Ghanaian JHS/SHS Schools",
    version="1.0.0"
)

# Allow React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route modules
app.include_router(auth.router,         prefix="/api/auth",        tags=["Authentication"])
app.include_router(students.router,     prefix="/api/students",    tags=["Students"])
app.include_router(scores.router,       prefix="/api/scores",      tags=["Scores"])
app.include_router(attendance.router,   prefix="/api/attendance",  tags=["Attendance"])
app.include_router(predictions.router,  prefix="/api/predictions", tags=["AI Predictions"])
app.include_router(admin.router,        prefix="/api/admin",       tags=["Admin/Headmaster"])


@app.get("/")
def root():
    return {
        "message": "Welcome to EduAlert GH API",
        "docs": "/docs",
        "status": "running"
    }
