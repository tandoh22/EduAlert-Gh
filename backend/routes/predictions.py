from datetime import datetime
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
from ml.ai_suggestion import generate_suggestion, _fallback_suggestion

router = APIRouter()

SEMESTER, YEAR = "Semester 2", 2025  # placeholder until there's a real "current semester" setting


def _teacher_class_ids(db: Session, teacher_id: int) -> List[int]:
    return [
        row.class_id for row in
        db.query(TeacherAssignment.class_id)
        .filter(TeacherAssignment.teacher_id == teacher_id)
        .distinct()
    ]


def _teacher_assigned_subjects(db: Session, teacher: User) -> List[str]:
    subjects = [
        row.subject for row in
        db.query(TeacherAssignment.subject)
        .filter(TeacherAssignment.teacher_id == teacher.id)
        .distinct()
        if row.subject
    ]
    if teacher.subject and teacher.subject not in subjects:
        subjects.append(teacher.subject)
    return subjects


def _can_access_student(db: Session, current_user: User, student_id: int) -> bool:
    """Admins can access any student. Teachers only students enrolled in
    a class a TeacherAssignment row actually ties them to, or students directly assigned."""
    if current_user.role in ("admin", "headmaster"):
        return True
    class_ids = _teacher_class_ids(db, current_user.id)
    if not class_ids:
        student = db.query(Student).filter(Student.id == student_id).first()
        return bool(student and student.teacher_id == current_user.id)
    
    enrolled = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.class_id.in_(class_ids),
    ).first() is not None
    if enrolled:
        return True

    assigned_classes = db.query(Class).filter(Class.id.in_(class_ids)).all()
    assigned_names = [c.name for c in assigned_classes]
    student = db.query(Student).filter(Student.id == student_id).first()
    if student and (student.class_name in assigned_names or student.teacher_id == current_user.id):
        return True

    return False


@router.get("/at-risk")
def list_at_risk_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Headmaster-only: every enrolled student's overall risk assessment across all subjects."""
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
            continue
        if (prediction.risk_level or "").lower() == "low":
            continue

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
            factors.append("Low average score across subjects")
        if prediction.reason:
            factors.append(prediction.reason)

        results.append({
            "id": student.id,
            "name": student.full_name,
            "student_id": student.student_id or f"ACH2025{student.id:03d}",
            "class_name": student.class_name,
            "risk_level": (prediction.risk_level or "").lower(),
            "attendance": attendance_rate,
            "average_score": avg_score,
            "factors": factors,
            "email": student.user_account.email if student.user_account else None,
            "phone": None,
            "generated_at": prediction.generated_at,
        })

    return results


@router.get("/teacher/at-risk")
def list_teacher_at_risk_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """Teacher view: students enrolled in teacher's classes who are at risk specifically in teacher's assigned subject(s)."""
    assigned_subjects = _teacher_assigned_subjects(db, current_user)
    assigned_subs_lower = [s.lower() for s in assigned_subjects]
    class_ids = _teacher_class_ids(db, current_user.id)

    if not class_ids:
        return []

    enrolled_student_ids = [
        row.student_id for row in
        db.query(Enrollment.student_id).filter(Enrollment.class_id.in_(class_ids)).distinct()
    ]
    students = db.query(Student).filter(Student.id.in_(enrolled_student_ids)).all()

    results = []
    for student in students:
        all_scores = db.query(Score).filter(Score.student_id == student.id).all()
        subj_scores = [s.score for s in all_scores if s.subject and s.subject.lower() in assigned_subs_lower] if assigned_subs_lower else [s.score for s in all_scores]

        if subj_scores:
            avg_score = round(sum(subj_scores) / len(subj_scores), 1)
            risk_level = "high" if avg_score < 50 else ("medium" if avg_score < 65 else "low")
        else:
            avg_score = None
            risk_level = "low"

        if risk_level == "low":
            continue

        attendances = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        total_days = len(attendances)
        present = sum(1 for a in attendances if a.status == "present")
        attendance_rate = round(present / total_days * 100, 1) if total_days else None

        subj_name = ", ".join(assigned_subjects) if assigned_subjects else "assigned subject"
        factors = [f"Low score in {subj_name} ({avg_score}%)"]
        if attendance_rate is not None and attendance_rate < 75:
            factors.append("Low attendance")

        results.append({
            "id": student.id,
            "name": student.full_name,
            "student_id": student.student_id or f"ACH2025{student.id:03d}",
            "class_name": student.class_name,
            "subject": subj_name,
            "risk_level": risk_level,
            "attendance": attendance_rate,
            "average_score": avg_score,
            "factors": factors,
            "email": student.user_account.email if student.user_account else None,
            "generated_at": datetime.utcnow(),
        })

    return results


@router.post("/run-all-school", status_code=200)
def run_predictions_school_wide(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Headmaster-only: run risk assessment for every enrolled student across all subjects."""
    students = db.query(Student).filter(Student.class_name != "Unassigned").all()
    results = []
    for student in students:
        scores = db.query(Score).filter(Score.student_id == student.id).all()
        attendances = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        if not scores and not attendances:
            continue
        result = predict_student_risk(student, scores, attendances)
        suggestion = _fallback_suggestion(result)
        prediction = Prediction(
            student_id=student.id, risk_level=result["risk_level"],
            confidence_score=result["confidence"], reason=result["reason"],
            ai_suggestion=suggestion, term=SEMESTER, year=YEAR,
        )
        db.add(prediction)
        results.append({"student": student.full_name, "risk": result["risk_level"]})
    db.commit()
    return {"message": f"Predictions run for {len(results)} students", "results": results}


@router.post("/run/{student_identifier}", response_model=PredictionResponse)
def run_prediction(student_identifier: str, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    student = None
    if student_identifier.isdigit():
        student = db.query(Student).filter(Student.id == int(student_identifier)).first()
    if not student:
        student = db.query(Student).filter(
            (Student.student_id == student_identifier) |
            (Student.student_id.ilike(student_identifier))
        ).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student '{student_identifier}' not found")
    if not _can_access_student(db, current_user, student.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this student")

    all_scores = db.query(Score).filter(Score.student_id == student.id).all()
    if current_user.role not in ("admin", "headmaster"):
        assigned_subjects = _teacher_assigned_subjects(db, current_user)
        assigned_subs_lower = [s.lower() for s in assigned_subjects]
        scores = [s for s in all_scores if s.subject and s.subject.lower() in assigned_subs_lower] if assigned_subs_lower else all_scores
    else:
        scores = all_scores

    attendances = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not scores and not attendances:
        raise HTTPException(status_code=400, detail="Not enough data to predict. Add scores and attendance first.")
    result = predict_student_risk(student, scores, attendances)
    suggestion = generate_suggestion(student.full_name, result)
    prediction = Prediction(
        student_id=student.id, risk_level=result["risk_level"],
        confidence_score=result["confidence"], reason=result["reason"],
        ai_suggestion=suggestion, term=SEMESTER, year=YEAR,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


@router.post("/run-all", status_code=200)
def run_predictions_for_all(db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    """Run predictions for every student the current teacher actually teaches, evaluated for teacher's subject(s)."""
    if current_user.role in ("admin", "headmaster"):
        students = db.query(Student).all()
        assigned_subs_lower = []
    else:
        class_ids = _teacher_class_ids(db, current_user.id)
        if not class_ids:
            return {"message": "Predictions run for 0 students", "results": []}
        student_ids = [
            row.student_id for row in
            db.query(Enrollment.student_id).filter(Enrollment.class_id.in_(class_ids)).distinct()
        ]
        students = db.query(Student).filter(Student.id.in_(student_ids)).all()
        assigned_subjects = _teacher_assigned_subjects(db, current_user)
        assigned_subs_lower = [s.lower() for s in assigned_subjects]

    results = []
    for student in students:
        all_scores = db.query(Score).filter(Score.student_id == student.id).all()
        if current_user.role not in ("admin", "headmaster") and assigned_subs_lower:
            scores = [s for s in all_scores if s.subject and s.subject.lower() in assigned_subs_lower]
        else:
            scores = all_scores

        attendances = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        if not scores and not attendances:
            continue
        result = predict_student_risk(student, scores, attendances)
        suggestion = _fallback_suggestion(result)
        prediction = Prediction(
            student_id=student.id, risk_level=result["risk_level"],
            confidence_score=result["confidence"], reason=result["reason"],
            ai_suggestion=suggestion, term=SEMESTER, year=YEAR,
        )
        db.add(prediction)
        results.append({"student": student.full_name, "risk": result["risk_level"]})
    db.commit()
    return {"message": f"Predictions run for {len(results)} students", "results": results}


@router.get("/student/{student_identifier}", response_model=List[PredictionResponse])
def get_student_predictions(student_identifier: str, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    student = None
    if student_identifier.isdigit():
        student = db.query(Student).filter(Student.id == int(student_identifier)).first()
    if not student:
        student = db.query(Student).filter(
            (Student.student_id == student_identifier) |
            (Student.student_id.ilike(student_identifier))
        ).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student '{student_identifier}' not found")
    if not _can_access_student(db, current_user, student.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Prediction).filter(Prediction.student_id == student.id).order_by(Prediction.generated_at.desc()).all()