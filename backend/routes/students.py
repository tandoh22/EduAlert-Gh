from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
from models.student import Student
from models.score import Score
from models.attendance import Attendance
from models.prediction import Prediction
from models.enrollment import Enrollment
from models.teacher_assignment import TeacherAssignment
from models.class_model import Class
from schemas.student import StudentCreate, StudentUpdate, StudentResponse
from core.dependencies import require_teacher, get_current_user, get_current_student, require_admin
from core.curriculum import BROAD_COURSE_TO_CLASS_COURSES
from models.user import User

router = APIRouter()


class SelfEnrollRequest(BaseModel):
    class_id: int


def _can_access_student(db: Session, current_user: User, student_id: int) -> bool:
    """Admins can access any student. A student can access only their own
    record. A teacher can access a student only if TeacherAssignment
    actually ties them to a class that student is enrolled in."""
    if current_user.role == "admin":
        return True
    if current_user.role == "student":
        linked = db.query(Student).filter(Student.user_id == current_user.id).first()
        return bool(linked and linked.id == student_id)
    class_ids = [
        row.class_id for row in
        db.query(TeacherAssignment.class_id)
        .filter(TeacherAssignment.teacher_id == current_user.id)
        .distinct()
    ]
    if not class_ids:
        return False
    return db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.class_id.in_(class_ids),
    ).first() is not None


@router.get("/", response_model=List[StudentResponse])
def list_students(
    class_name: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """List students in classes the current teacher is assigned to.

    Admins see every student; teachers only see students enrolled in a
    class that a TeacherAssignment row ties them to.
    """
    if current_user.role == "admin":
        query = db.query(Student)
    else:
        assigned_classes = (
            db.query(Class)
            .join(TeacherAssignment, TeacherAssignment.class_id == Class.id)
            .filter(TeacherAssignment.teacher_id == current_user.id)
            .all()
        )
        class_ids = [c.id for c in assigned_classes]
        class_names = [c.name for c in assigned_classes]

        if not class_ids and not class_names:
            query = db.query(Student).filter(Student.teacher_id == current_user.id)
        else:
            enrolled_student_ids = [
                row.student_id for row in
                db.query(Enrollment.student_id)
                .filter(Enrollment.class_id.in_(class_ids))
                .distinct()
            ] if class_ids else []

            from sqlalchemy import or_
            filters = [Student.teacher_id == current_user.id]
            if enrolled_student_ids:
                filters.append(Student.id.in_(enrolled_student_ids))
            if class_names:
                filters.append(Student.class_name.in_(class_names))

            query = db.query(Student).filter(or_(*filters)).distinct()

    if class_name:
        query = query.filter(Student.class_name == class_name)
    if search:
        query = query.filter(Student.full_name.ilike(f"%{search}%"))
    return query.order_by(Student.full_name).all()


@router.post("/", response_model=StudentResponse, status_code=201)
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """Add a new student to the teacher's roster."""
    existing = db.query(Student).filter(Student.student_id == data.student_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student ID already exists")
    student = Student(**data.model_dump(), teacher_id=current_user.id)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the logged-in student's own profile + class enrollment."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="No student profile linked to this account")

    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student.id)
        .first()
    )

    return {
        "id": student.id,
        "full_name": student.full_name,
        "student_id": student.student_id,
        "class_name": student.class_name,
        "class_id": enrollment.class_id if enrollment else None,
        "admitted_course": student.admitted_course,
        "school": student.school,
        "teacher_id": student.teacher_id,
    }


@router.post("/enroll")
def self_enroll(
    data: SelfEnrollRequest,
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    """Student self-service: pick a class based on elective preference.

    Restricted to classes whose course falls under the student's admitted
    course (e.g. a "General Science" admit can only pick Science 1/2/3).
    Re-calling this replaces any previous class choice — a student can
    change their mind before the term properly starts.
    """
    target_class = db.query(Class).filter(Class.id == data.class_id).first()
    if not target_class:
        raise HTTPException(status_code=404, detail="Class not found")
    if not target_class.subjects:
        raise HTTPException(status_code=400, detail="This class has no course/subjects configured yet.")

    if student.admitted_course:
        allowed_class_courses = BROAD_COURSE_TO_CLASS_COURSES.get(student.admitted_course, [])
        if target_class.course not in allowed_class_courses:
            raise HTTPException(
                status_code=400,
                detail=f"'{target_class.name}' isn't part of your admitted course ({student.admitted_course}).",
            )

    # Replace any existing enrollment with the newly chosen class
    db.query(Enrollment).filter(Enrollment.student_id == student.id).delete()

    TERM, YEAR = "Semester 2", 2025
    for subject in target_class.subjects:
        db.add(Enrollment(
            student_id=student.id,
            class_id=target_class.id,
            subject=subject,
            term=TERM,
            year=YEAR,
        ))

    student.class_name = target_class.name
    db.commit()
    return {"message": "Enrolled successfully", "class_id": target_class.id, "class_name": target_class.name}


@router.get("/overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Headmaster-only: live school-wide stats for the admin dashboard.

    "Pass rate" here means average score (0-100), not percent-who-passed —
    matches the values a school would actually plot on a bar chart per
    subject. Filtered to TERM/YEAR placeholders, same convention used
    elsewhere in the app until there's a real "current term" setting.
    """
    TERM, YEAR = "Semester 2", 2025
    recent_since = datetime.utcnow() - timedelta(days=30)

    total_students = db.query(Student).count()
    new_students_recent = db.query(Student).filter(Student.created_at >= recent_since).count()

    total_teachers = db.query(User).filter(User.role == "teacher", User.status == "approved").count()
    new_teachers_recent = db.query(User).filter(
        User.role == "teacher", User.status == "approved", User.created_at >= recent_since
    ).count()

    avg_pass_rate = (
        db.query(func.avg(Score.score))
        .filter(Score.term == TERM, Score.year == YEAR)
        .scalar()
    )
    avg_pass_rate = round(avg_pass_rate, 1) if avg_pass_rate is not None else 0

    subject_rows = (
        db.query(Score.subject, func.avg(Score.score))
        .filter(Score.term == TERM, Score.year == YEAR)
        .group_by(Score.subject)
        .all()
    )
    subject_pass_rates = [
        {"subject": subject, "avg_score": round(avg, 1)} for subject, avg in subject_rows
    ]

    # Bucket each student by their most recent prediction only
    latest_risk_by_student = {}
    for p in db.query(Prediction).order_by(Prediction.generated_at.asc()).all():
        latest_risk_by_student[p.student_id] = p.risk_level

    risk_counts = {"Low": 0, "Medium": 0, "High": 0}
    for level in latest_risk_by_student.values():
        if level in risk_counts:
            risk_counts[level] += 1

    at_risk_count = risk_counts["Medium"] + risk_counts["High"]
    at_risk_percent = round((at_risk_count / total_students) * 100, 1) if total_students else 0

    # Live teacher -> class/subject roster, straight from TeacherAssignment
    teacher_rows = (
        db.query(TeacherAssignment, User, Class)
        .join(User, TeacherAssignment.teacher_id == User.id)
        .join(Class, TeacherAssignment.class_id == Class.id)
        .order_by(User.full_name, Class.name)
        .all()
    )
    teacher_roster_map = {}
    for ta, teacher, cls in teacher_rows:
        entry = teacher_roster_map.setdefault(teacher.id, {
            "teacher_id": teacher.id,
            "teacher_name": teacher.full_name,
            "assignments": [],
        })
        entry["assignments"].append({"class_name": cls.name, "subject": ta.subject})
    teacher_roster = list(teacher_roster_map.values())

    return {
        "total_students": total_students,
        "new_students_recent": new_students_recent,
        "total_teachers": total_teachers,
        "new_teachers_recent": new_teachers_recent,
        "avg_pass_rate": avg_pass_rate,
        "at_risk_count": at_risk_count,
        "at_risk_percent": at_risk_percent,
        "risk_breakdown": {
            "low": risk_counts["Low"],
            "medium": risk_counts["Medium"],
            "high": risk_counts["High"],
        },
        "subject_pass_rates": subject_pass_rates,
        "teacher_roster": teacher_roster,
    }


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.teacher_id == current_user.id,
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.teacher_id == current_user.id,
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}", status_code=204)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.teacher_id == current_user.id,
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()


@router.get("/{student_id}/performance")
def get_student_performance(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregated performance data for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not _can_access_student(db, current_user, student_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    scores = db.query(Score).filter(Score.student_id == student_id).all()
    attendances = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    prediction = (
        db.query(Prediction)
        .filter(Prediction.student_id == student_id)
        .order_by(Prediction.generated_at.desc())
        .first()
    )

    subject_scores: dict = {}
    for s in scores:
        subject_scores.setdefault(s.subject, []).append(s.score)
    subject_avgs = {
        subj: round(sum(vals) / len(vals), 1) for subj, vals in subject_scores.items()
    }

    total_days = len(attendances)
    present = sum(1 for a in attendances if a.status == "present")
    attendance_rate = round(present / total_days * 100, 1) if total_days else 0
    overall_avg = round(sum(s.score for s in scores) / len(scores), 1) if scores else 0

    sorted_scores = sorted(scores, key=lambda x: (x.year, x.term))
    mid = len(sorted_scores) // 2
    first_half = sorted_scores[:mid] if mid else sorted_scores
    second_half = sorted_scores[mid:] if mid else sorted_scores
    first_avg = sum(s.score for s in first_half) / len(first_half) if first_half else 0
    second_avg = sum(s.score for s in second_half) / len(second_half) if second_half else 0
    score_trend = round(second_avg - first_avg, 1)

    risk_factors = []
    if total_days and attendance_rate < 75:
        risk_factors.append("Low attendance")
    if scores and overall_avg < 50:
        risk_factors.append("Low average score")
    if prediction and prediction.reason:
        risk_factors.append(prediction.reason)

    return {
        "student": StudentResponse.model_validate(student),
        "overall_average": overall_avg,
        "attendance_rate": attendance_rate,
        "subject_averages": subject_avgs,
        "score_trend": score_trend,
        "scores": [{"subject": s.subject, "score": s.score, "term": s.term, "year": s.year} for s in scores],
        "attendance_summary": {"present": present, "total": total_days},
        "risk_factors": risk_factors,
        "latest_prediction": {
            "risk_level": (prediction.risk_level or "").lower(),
            "confidence_score": prediction.confidence_score,
            "reason": prediction.reason,
            "ai_suggestion": prediction.ai_suggestion,
            "generated_at": prediction.generated_at,
        } if prediction else None,
    }