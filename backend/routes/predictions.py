from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.student import Student
from models.score import Score
from models.attendance import Attendance
from models.prediction import Prediction
from schemas.prediction import PredictionResponse
from core.dependencies import require_teacher
from models.user import User
from ml.predictor import predict_student_risk
from ml.ai_suggestion import generate_suggestion

router = APIRouter()

@router.post("/run/{student_id}", response_model=PredictionResponse)
def run_prediction(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    student = db.query(Student).filter(Student.id == student_id, Student.teacher_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    scores = db.query(Score).filter(Score.student_id == student_id).all()
    attendances = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    if not scores and not attendances:
        raise HTTPException(status_code=400, detail="Not enough data to predict. Add scores and attendance first.")
    result = predict_student_risk(student, scores, attendances)
    suggestion = generate_suggestion(student.full_name, result)
    prediction = Prediction(
        student_id=student_id, risk_level=result["risk_level"],
        confidence_score=result["confidence"], reason=result["reason"],
        ai_suggestion=suggestion, term="Term 1", year=2025,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction

@router.post("/run-all", status_code=200)
def run_predictions_for_all(db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    students = db.query(Student).filter(Student.teacher_id == current_user.id).all()
    results = []
    for student in students:
        scores = db.query(Score).filter(Score.student_id == student.id).all()
        attendances = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        if not scores and not attendances:
            continue
        result = predict_student_risk(student, scores, attendances)
        suggestion = generate_suggestion(student.full_name, result)
        prediction = Prediction(
            student_id=student.id, risk_level=result["risk_level"],
            confidence_score=result["confidence"], reason=result["reason"],
            ai_suggestion=suggestion,
        )
        db.add(prediction)
        results.append({"student": student.full_name, "risk": result["risk_level"]})
    db.commit()
    return {"message": f"Predictions run for {len(results)} students", "results": results}

@router.get("/student/{student_id}", response_model=List[PredictionResponse])
def get_student_predictions(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    return db.query(Prediction).filter(Prediction.student_id == student_id).order_by(Prediction.generated_at.desc()).all()