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


from models.teacher_assignment import TeacherAssignment
from models.class_model import Class

@router.get("/dashboard")
def teacher_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    # Fetch teacher's assignments
    teacher_assignments = (
        db.query(TeacherAssignment)
        .filter(TeacherAssignment.teacher_id == current_user.id)
        .all()
    )
    
    assigned_class_ids = list(set(ta.class_id for ta in teacher_assignments if ta.class_id))
    assigned_subjects = list(set(ta.subject for ta in teacher_assignments if ta.subject))
    
    if current_user.subject and current_user.subject not in assigned_subjects:
        assigned_subjects.append(current_user.subject)
        
    assigned_classes = (
        db.query(Class)
        .filter(Class.id.in_(assigned_class_ids))
        .all()
        if assigned_class_ids else []
    )
    assigned_class_names = [c.name for c in assigned_classes]

    # Find all students enrolled in teacher's assigned classes or directly assigned
    enrolled_student_ids = []
    if assigned_class_ids:
        enrolled_student_ids = [
            e.student_id for e in
            db.query(Enrollment.student_id)
            .filter(Enrollment.class_id.in_(assigned_class_ids))
            .all()
        ]
        
    student_query = db.query(Student)
    if assigned_class_ids or assigned_class_names:
        filters = [Student.teacher_id == current_user.id]
        if enrolled_student_ids:
            filters.append(Student.id.in_(enrolled_student_ids))
        if assigned_class_names:
            filters.append(Student.class_name.in_(assigned_class_names))
        from sqlalchemy import or_
        students = student_query.filter(or_(*filters)).distinct().all()
    else:
        students = student_query.filter(Student.teacher_id == current_user.id).all()
        
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

    assignments_count = db.query(Assignment).filter(Assignment.teacher_id == current_user.id).count()
    quizzes_count = db.query(Quiz).filter(Quiz.teacher_id == current_user.id).count()

    assigned_subs_lower = [s.lower() for s in assigned_subjects]
    risk_counts = {"High": 0, "Medium": 0, "Low": 0}
    student_list = []
    for student in students:
        all_scores = db.query(Score).filter(Score.student_id == student.id).all()
        subject_scores = [s.score for s in all_scores if s.subject and s.subject.lower() in assigned_subs_lower] if assigned_subs_lower else [s.score for s in all_scores]
        
        if subject_scores:
            avg = round(sum(subject_scores) / len(subject_scores))
            if avg < 50:
                risk = "High"
            elif avg < 65:
                risk = "Medium"
            else:
                risk = "Low"
        else:
            avg = round(sum(s.score for s in all_scores) / len(all_scores)) if all_scores else 75
            risk = "Low" if avg >= 65 else ("Medium" if avg >= 50 else "High")

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
            else 100
        )
        if attn < 70 and risk == "Low":
            risk = "Medium"

        risk_counts[risk] = risk_counts.get(risk, 0) + 1
        student_list.append({
            "id": student.id,
            "full_name": student.full_name,
            "student_id": student.student_id or f"ACH2025{student.id:03d}",
            "class_name": student.class_name,
            "gender": student.gender,
            "avg_score": avg,
            "attendance_rate": attn,
            "risk_level": risk,
            "subject": ", ".join(assigned_subjects) if assigned_subjects else (current_user.subject or "Assigned Subject"),
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
        st = db.query(Student).filter(Student.id == p.student_id).first()
        if st:
            ai_suggestions.append({
                "student_name": st.full_name,
                "suggestion": p.ai_suggestion or p.reason,
            })

    classes_payload = [
        {"id": c.id, "name": c.name, "code": c.code, "course": c.course}
        for c in assigned_classes
    ]

    return {
        "teacher_name": current_user.full_name,
        "subject": current_user.subject,
        "assigned_subjects": assigned_subjects,
        "assigned_classes": classes_payload,
        "active_classes": len(assigned_classes),
        "total_students": len(students),
        "assignments_count": assignments_count,
        "quizzes_count": quizzes_count,
        "pending_grading": pending_grading,
        "risk_counts": risk_counts,
        "students": student_list,
        "ai_suggestions": ai_suggestions,
    }
