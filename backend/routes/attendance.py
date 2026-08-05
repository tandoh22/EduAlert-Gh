from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.attendance import Attendance
from models.student import Student
from schemas.attendance import AttendanceCreate, AttendanceResponse
from core.dependencies import require_teacher, get_current_student
from models.user import User

router = APIRouter()

@router.post("/", response_model=AttendanceResponse, status_code=201)
def record_attendance(data: AttendanceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    student = db.query(Student).filter(Student.id == data.student_id, Student.teacher_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    record = Attendance(**data.dict())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("/me", response_model=List[AttendanceResponse])
def get_my_attendance(
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    return db.query(Attendance).filter(Attendance.student_id == student.id).all()

@router.get("/student/{student_id}", response_model=List[AttendanceResponse])
def get_student_attendance(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    student = db.query(Student).filter(Student.id == student_id, Student.teacher_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return db.query(Attendance).filter(Attendance.student_id == student_id).all()