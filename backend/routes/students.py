from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models.student import Student
from models.score import Score
from models.attendance import Attendance
from models.prediction import Prediction
from models.enrollment import Enrollment
from models.teacher_assignment import TeacherAssignment
from models.class_model import Class
from schemas.student import StudentCreate, StudentUpdate, StudentResponse
from core.dependencies import require_teacher, get_current_user, get_current_student
from core.curriculum import BROAD_COURSE_TO_CLASS_COURSES
from models.user import User

router = APIRouter()


class SelfEnrollRequest(BaseModel):
    class_id: int


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
        class_ids = [
            row.class_id for row in
            db.query(TeacherAssignment.class_id)
            .filter(TeacherAssignment.teacher_id == current_user.id)
            .distinct()
        ]
        if not class_ids:
            return []
        student_ids = [
            row.student_id for row in
            db.query(Enrollment.student_id)
            .filter(Enrollment.class_id.in_(class_ids))
            .distinct()
        ]
        query = db.query(Student).filter(Student.id.in_(student_ids))

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

    TERM, YEAR = "Term 2", 2025
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
