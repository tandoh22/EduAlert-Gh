from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import httpx
from database import get_db
from models.report_card import ReportCard
from models.student import Student
from models.score import Score
from models.attendance import Attendance
from schemas.report_card import ReportCardGenerate, ReportCardResponse
from core.dependencies import require_admin, require_teacher, get_current_user
from core.config import settings
from models.user import User

router = APIRouter()

@router.post("/generate", response_model=ReportCardResponse, status_code=201)
def generate_report_card(
    data: ReportCardGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Generate an AI-powered report card for a student.
    Claude reads all performance data and writes a personalised comment.
    """
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Gather performance data
    scores = db.query(Score).filter(
        Score.student_id == data.student_id,
        Score.term == data.term,
        Score.year == data.year
    ).all()

    attendances = db.query(Attendance).filter(
        Attendance.student_id == data.student_id,
        Attendance.term == data.term,
        Attendance.year == data.year
    ).all()

    # Calculate averages
    avg_score = (
        sum(s.score for s in scores) / len(scores) if scores else 0
    )
    total_days = len(attendances)
    present_days = sum(1 for a in attendances if a.status == "present")
    attendance_rate = (
        (present_days / total_days * 100) if total_days > 0 else 0
    )

    # Build subject breakdown
    subjects = {}
    for s in scores:
        if s.subject not in subjects:
            subjects[s.subject] = []
        subjects[s.subject].append(s.score)
    subject_avgs = {
        subj: round(sum(vals) / len(vals), 1)
        for subj, vals in subjects.items()
    }

    ai_comment = None
    if settings.ANTHROPIC_API_KEY:
        try:
            subject_text = ", ".join(
                [f"{s}: {v}%" for s, v in subject_avgs.items()]
            )
            prompt = f"""
You are writing a termly report card comment for a Ghanaian JHS/SHS student.
Write a professional, encouraging, and honest comment (3-4 sentences).

Student: {student.full_name}
Class: {student.class_name}
Term: {data.term} {data.year}
Overall Average: {avg_score:.1f}%
Attendance Rate: {attendance_rate:.1f}%
Subject Performance: {subject_text}

The comment should:
- Acknowledge the student's performance honestly
- Highlight their strongest subject
- Note any area needing improvement
- End with an encouraging statement for next term
Do NOT use placeholder text. Write as if you are the class teacher.
"""
            response = httpx.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 400,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=20.0
            )
            result = response.json()
            ai_comment = result["content"][0]["text"].strip()
        except Exception:
            ai_comment = (
                f"{student.full_name} achieved an overall average of "
                f"{avg_score:.1f}% this term with an attendance rate of "
                f"{attendance_rate:.1f}%. Keep working hard next term."
            )

    report_card = ReportCard(
        student_id=data.student_id,
        term=data.term,
        year=data.year,
        overall_average=round(avg_score, 2),
        attendance_rate=round(attendance_rate, 2),
        ai_comment=ai_comment,
        approved="pending"
    )
    db.add(report_card)
    db.commit()
    db.refresh(report_card)
    return report_card

@router.put("/{report_id}/approve")
def approve_report_card(
    report_id: int,
    teacher_comment: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Teacher reviews and approves the AI comment,
    optionally editing it before final approval.
    """
    report = db.query(ReportCard).filter(ReportCard.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report card not found")
    report.teacher_comment = teacher_comment
    report.approved = "approved"
    db.commit()
    return {"message": "Report card approved"}

@router.get("/student/{student_id}", response_model=List[ReportCardResponse])
def get_student_report_cards(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all report cards for a student."""
    return db.query(ReportCard).filter(
        ReportCard.student_id == student_id
    ).all()

@router.get("/", response_model=List[ReportCardResponse])
def get_all_report_cards(
    term: str,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Headmaster views all report cards for a given term."""
    return db.query(ReportCard).filter(
        ReportCard.term == term,
        ReportCard.year == year
    ).all()