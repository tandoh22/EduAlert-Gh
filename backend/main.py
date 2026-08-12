from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from routes import (
    auth, students, scores, attendance,
    predictions, admin, classes, assignments,
    quizzes, lesson_notes, study_cards,
    resources, announcements, report_cards,
    teacher
)
from database import engine, Base
from models import all_models
from routes import classes


app = FastAPI(
    title="EduAlert GH API",
    description="AI-Powered School Management System for Ghanaian Senior High Schools",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api/auth",          tags=["Authentication"])
app.include_router(students.router,      prefix="/api/students",      tags=["Students"])
app.include_router(scores.router,        prefix="/api/scores",        tags=["Scores"])
app.include_router(attendance.router,    prefix="/api/attendance",    tags=["Attendance"])
app.include_router(predictions.router,  prefix="/api/predictions",   tags=["AI Predictions"])
app.include_router(admin.router,         prefix="/api/admin",         tags=["Admin"])
app.include_router(classes.router,       prefix="/api/classes",       tags=["Classes"])
app.include_router(assignments.router,   prefix="/api/assignments",   tags=["Assignments"])
app.include_router(quizzes.router,       prefix="/api/quizzes",       tags=["Quizzes"])
app.include_router(lesson_notes.router,  prefix="/api/lesson-notes",  tags=["Lesson Notes"])
app.include_router(study_cards.router,   prefix="/api/study-cards",   tags=["Study Cards"])
app.include_router(resources.router,     prefix="/api/resources",     tags=["Resources"])
app.include_router(announcements.router, prefix="/api/announcements", tags=["Announcements"])
app.include_router(report_cards.router,  prefix="/api/report-cards",  tags=["Report Cards"])
app.include_router(teacher.router,       prefix="/api/teacher",       tags=["Teacher Dashboard"])
app.include_router(classes.router,       prefix="/classes",           tags=["Classes"])

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {
        "message": "Welcome to EduAlert GH API v2.0",
        "docs": "/docs",
        "status": "running"
    }