from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.score import Score
from models.student import Student
from schemas.score import ScoreCreate, ScoreResponse
from core.dependencies import require_teacher, get_current_student
from models.user import User

router = APIRouter()

@router.post("/", response_model=ScoreResponse, status_code=201)
def record_score(data: ScoreCreate, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    student = db.query(Student).filter(Student.id == data.student_id, Student.teacher_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found or not yours")
    score = Score(**data.dict())
    db.add(score)
    db.commit()
    db.refresh(score)
    return score

@router.get("/me", response_model=List[ScoreResponse])
def get_my_scores(
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    return db.query(Score).filter(Score.student_id == student.id).all()

@router.get("/student/{student_id}", response_model=List[ScoreResponse])
def get_student_scores(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    student = db.query(Student).filter(Student.id == student_id, Student.teacher_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return db.query(Score).filter(Score.student_id == student_id).all()