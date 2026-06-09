from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.student import Student
from models.prediction import Prediction
from models.user import User
from core.dependencies import require_admin

router = APIRouter()

@router.get("/dashboard")
def admin_dashboard(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    total_students = db.query(Student).count()
    latest_preds = db.query(Prediction.student_id, Prediction.risk_level)\
                     .distinct(Prediction.student_id)\
                     .order_by(Prediction.student_id, Prediction.generated_at.desc())\
                     .all()
    risk_counts = {"High": 0, "Medium": 0, "Low": 0}
    for _, risk in latest_preds:
        if risk in risk_counts:
            risk_counts[risk] += 1
    teachers = db.query(User).filter(User.role == "teacher").all()
    teacher_summary = []
    for teacher in teachers:
        count = db.query(Student).filter(Student.teacher_id == teacher.id).count()
        teacher_summary.append({"teacher": teacher.full_name, "subject": teacher.subject, "student_count": count})
    return {"school": current_user.school, "total_students": total_students, "risk_breakdown": risk_counts, "teachers": teacher_summary}

@router.get("/at-risk")
def get_at_risk_students(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    high_risk = db.query(Prediction).filter(Prediction.risk_level == "High").order_by(Prediction.generated_at.desc()).limit(50).all()
    results = []
    for p in high_risk:
        student = db.query(Student).filter(Student.id == p.student_id).first()
        if student:
            results.append({"student_name": student.full_name, "class": student.class_name, "risk_level": p.risk_level, "reason": p.reason, "ai_suggestion": p.ai_suggestion, "flagged_at": p.generated_at})
    return results