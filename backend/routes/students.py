from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.student import Student
from models.enrollment import Enrollment
from models.assignment import Submission
from schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentProfileResponse
from core.dependencies import require_teacher, get_current_user, get_current_student
from models.user import User

router = APIRouter()

@router.get("/me", response_model=StudentProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Logged-in student gets their profile and enrolled class."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student.id)
        .order_by(Enrollment.year.desc(), Enrollment.id.desc())
        .first()
    )
    return StudentProfileResponse(
        student=student,
        class_id=enrollment.class_id if enrollment else None,
    )

@router.get("/me/submissions")
def get_my_submissions(
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    """Graded and submitted assignment results for the logged-in student."""
    submissions = (
        db.query(Submission)
        .filter(Submission.student_id == student.id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    return submissions

@router.get("/", response_model=List[StudentResponse])
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """Teacher lists their students."""
    return db.query(Student).filter(Student.teacher_id == current_user.id).all()

@router.post("/", response_model=StudentResponse, status_code=201)
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """Teacher adds a student record."""
    existing = db.query(Student).filter(Student.student_id == data.student_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student ID already exists")
    student = Student(**data.dict(), teacher_id=current_user.id)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

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
    for field, value in data.dict(exclude_unset=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student
