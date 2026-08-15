from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.student import Student
from models.score import Score
from models.attendance import Attendance
from models.prediction import Prediction
from models.enrollment import Enrollment
from models.teacher_assignment import TeacherAssignment
from schemas.prediction import PredictionResponse
from core.dependencies import require_teacher, require_admin
from models.user import User
from ml.predictor import predict_student_risk
from ml.ai_suggestion import generate_suggestion

router = APIRouter()

SEMESTER, YEAR = "Semester 2", 2025  # placeholder until there's a real "current semester" setting


def _safe_suggestion(student_name: str, result: dict) -> str:
    """generate_suggestion() likely calls out to an AI API — don't let a
    network hiccup, missing key, or rate limit kill a whole batch run."""
    try:
        return generate_suggestion(student_name, result)
    except Exception:
        return (
            f"{student_name} was flagged {result['risk_level'].lower()} risk based on "
            f"recent attendance and score data. Review their record for details."
        )


def _teacher_class_ids(db: Session, teacher_id: int) -> List[int]:
    return [
        row.class_id for row in
        db.query(TeacherAssignment.class_id)
        .filter(TeacherAssignment.teacher_id == teacher_id)
        .distinct()
    ]


def _can_access_student(db: Session, current_user: User, student_id: int) -> bool:
    """Admins can access any student. Teachers only students enrolled in
    a class a TeacherAssignment row actually ties them to."""
    if current_user.role == "admin":
        return True
    class_ids = _teacher_class_ids(db, current_user.id)
    if not class_ids:
        return False
    return db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.class_id.in_(class_ids),
    ).first() is not None


@router.get("/at-risk")
def list_at_risk_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Headmaster-only: every enrolled student's latest risk assessment."""
    students = db.query(Student).filter(Student.class_name != "Unassigned").all()

    results = []
    for student in students:
        prediction = (
            db.query(Prediction)
            .filter(Prediction.student_id == student.id)
            .order_by(Prediction.generated_at.desc())
            .first()
        )
        if not prediction:
            continue  # not assessed yet — run the assessment to include them
        if (prediction.risk_level or "").lower() == "low":
            continue  # not actually at risk — belongs on the student's own performance page, not here

        attendances = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        total_days = len(attendances)
        present = sum(1 for a in attendances if a.status == "present")
        attendance_rate = round(present / total_days * 100, 1) if total_days else None

        scores = db.query(Score).filter(Score.student_id == student.id).all()
        avg_score = round(sum(s.score for s in scores) / len(scores), 1) if scores else None

        factors = []
        if attendance_rate is not None and attendance_rate < 75:
            factors.append("Low attendance")
        if avg_score is not None and avg_score < 50:
            factors.append("Low average score")
        if prediction.reason:
            factors.append(prediction.reason)

        results.append({
            "id": student.id,
            "name": student.full_name,
            "student_id": student.student_id,
            "class_name": student.class_name,
            "risk_level": (prediction.risk_level or "").lower(),
            "attendance": attendance_rate,
            "average_score": avg_score,
            "factors": factors,
            "email": student.user_account.email if student.user_account else None,
            "phone": None,  # not captured anywhere in the schema yet
            "generated_at": prediction.generated_at,
        })

    return results


@router.post("/run-all-school", status_code=200)
def run_predictions_school_wide(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Headmaster-only: run risk assessment for every enrolled student,
    regardless of which teacher (if any) is set as their owner."""
    students = db.query(Student).filter(Student.class_name != "Unassigned").all()
    results = []
    for student in students:
        scores = db.query(Score).filter(Score.student_id == student.id).all()
        attendances = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        if not scores and not attendances:
            continue
        result = predict_student_risk(student, scores, attendances)
        suggestion = _safe_suggestion(student.full_name, result)
        prediction = Prediction(
            student_id=student.id, risk_level=result["risk_level"],
            confidence_score=result["confidence"], reason=result["reason"],
            ai_suggestion=suggestion, term=SEMESTER, year=YEAR,
        )
        db.add(prediction)
        results.append({"student": student.full_name, "risk": result["risk_level"]})
    db.commit()
    return {"message": f"Predictions run for {len(results)} students", "results": results}


@router.post("/run/{student_id}", response_model=PredictionResponse)
def run_prediction(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if not _can_access_student(db, current_user, student_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    scores = db.query(Score).filter(Score.student_id == student_id).all()
    attendances = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    if not scores and not attendances:
        raise HTTPException(status_code=400, detail="Not enough data to predict. Add scores and attendance first.")
    result = predict_student_risk(student, scores, attendances)
    suggestion = _safe_suggestion(student.full_name, result)
    prediction = Prediction(
        student_id=student_id, risk_level=result["risk_level"],
        confidence_score=result["confidence"], reason=result["reason"],
        ai_suggestion=suggestion, term=SEMESTER, year=YEAR,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


@router.post("/run-all", status_code=200)
def run_predictions_for_all(db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    """Run predictions for every student the current teacher actually
    teaches (via TeacherAssignment), or every student if called by admin."""
    if current_user.role == "admin":
        students = db.query(Student).all()
    else:
        class_ids = _teacher_class_ids(db, current_user.id)
        if not class_ids:
            return {"message": "Predictions run for 0 students", "results": []}
        student_ids = [
            row.student_id for row in
            db.query(Enrollment.student_id).filter(Enrollment.class_id.in_(class_ids)).distinct()
        ]
        students = db.query(Student).filter(Student.id.in_(student_ids)).all()

    results = []
    for student in students:
        scores = db.query(Score).filter(Score.student_id == student.id).all()
        attendances = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        if not scores and not attendances:
            continue
        result = predict_student_risk(student, scores, attendances)
        suggestion = _safe_suggestion(student.full_name, result)
        prediction = Prediction(
            student_id=student.id, risk_level=result["risk_level"],
            confidence_score=result["confidence"], reason=result["reason"],
            ai_suggestion=suggestion, term=SEMESTER, year=YEAR,
        )
        db.add(prediction)
        results.append({"student": student.full_name, "risk": result["risk_level"]})
    db.commit()
    return {"message": f"Predictions run for {len(results)} students", "results": results}


@router.get("/student/{student_id}", response_model=List[PredictionResponse])
def get_student_predictions(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    if not _can_access_student(db, current_user, student_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Prediction).filter(Prediction.student_id == student_id).order_by(Prediction.generated_at.desc()).all()