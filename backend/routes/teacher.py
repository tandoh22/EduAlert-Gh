from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from database import get_db
from models.student import Student
from models.prediction import Prediction
from models.user import User
from models.score import Score
from models.attendance import Attendance
from models.assignment import Assignment, Submission
from models.quiz import Quiz, QuizAttempt
from models.enrollment import Enrollment
from models.announcement import Announcement
from models.lesson_note import LessonNote
from core.dependencies import require_teacher

router = APIRouter()


@router.get("/dashboard")
def teacher_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    students = (
        db.query(Student)
        .filter(Student.teacher_id == current_user.id)
        .all()
    )
    student_ids = [s.id for s in students]

    pending_grading = (
        db.query(Submission)
        .filter(
            Submission.teacher_score.is_(None),
            Submission.student_id.in_(student_ids),
        )
        .count()
        if student_ids
        else 0
    )

    risk_counts = {"High": 0, "Medium": 0, "Low": 0}
    student_list = []
    for student in students:
        scores = db.query(Score).filter(Score.student_id == student.id).all()
        avg = round(sum(s.score for s in scores) / len(scores)) if scores else 0
        attendances = (
            db.query(Attendance).filter(Attendance.student_id == student.id).all()
        )
        attn = (
            round(
                sum(1 for a in attendances if a.status == "present")
                / len(attendances)
                * 100
            )
            if attendances
            else 0
        )
        pred = (
            db.query(Prediction)
            .filter(Prediction.student_id == student.id)
            .order_by(Prediction.generated_at.desc())
            .first()
        )
        risk = pred.risk_level if pred else ("Low" if avg >= 70 else "Medium")
        risk_counts[risk] = risk_counts.get(risk, 0) + 1
        student_list.append({
            "id": student.id,
            "full_name": student.full_name,
            "avg_score": avg,
            "attendance_rate": attn,
            "risk_level": risk,
        })

    suggestions = (
        db.query(Prediction)
        .filter(
            Prediction.student_id.in_(student_ids),
            Prediction.risk_level.in_(["High", "Medium"]),
        )
        .order_by(Prediction.generated_at.desc())
        .limit(5)
        .all()
        if student_ids
        else []
    )
    ai_suggestions = []
    for p in suggestions:
        student = db.query(Student).filter(Student.id == p.student_id).first()
        if student:
            ai_suggestions.append({
                "student_name": student.full_name,
                "suggestion": p.ai_suggestion or p.reason,
            })

    enrollment = (
        db.query(Enrollment)
        .join(Student, Enrollment.student_id == Student.id)
        .filter(Student.teacher_id == current_user.id)
        .first()
    )
    class_name = students[0].class_name if students else "No class"

    return {
        "teacher_name": current_user.full_name,
        "subject": current_user.subject,
        "class_name": class_name,
        "class_id": enrollment.class_id if enrollment else None,
        "active_students": len(students),
        "pending_grading": pending_grading,
        "ai_drafts_pending": 0,
        "risk_counts": risk_counts,
        "students": student_list,
        "ai_suggestions": ai_suggestions,
    }
