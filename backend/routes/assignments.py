from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import httpx
from database import get_db
from models.assignment import Assignment, Submission
from models.student import Student
from schemas.assignment import (
    AssignmentCreate, AssignmentResponse,
    SubmissionCreate, SubmissionResponse
)
from core.dependencies import require_teacher, get_current_user
from core.config import settings
from models.user import User

router = APIRouter()

@router.post("/", response_model=AssignmentResponse, status_code=201)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher creates a new assignment for a class."""
    assignment = Assignment(**data.dict(), teacher_id=current_user.id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.get("/", response_model=List[AssignmentResponse])
def get_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher gets all assignments they created."""
    return db.query(Assignment).filter(
        Assignment.teacher_id == current_user.id
    ).all()

@router.get("/class/{class_id}", response_model=List[AssignmentResponse])
def get_class_assignments(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all assignments for a specific class — used by students."""
    return db.query(Assignment).filter(
        Assignment.class_id == class_id
    ).all()

@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single assignment by ID."""
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher deletes an assignment."""
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.teacher_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()

@router.post("/submit", response_model=SubmissionResponse, status_code=201)
def submit_assignment(
    data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Student submits an assignment.
    Claude AI automatically reads the submission and generates
    feedback and a suggested score.
    """
    # Check assignment exists
    assignment = db.query(Assignment).filter(
        Assignment.id == data.assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check student hasn't already submitted
    existing = db.query(Submission).filter(
        Submission.assignment_id == data.assignment_id,
        Submission.student_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already submitted")

    ai_feedback = None
    ai_score = None

    # Call Claude API to mark the submission
    if data.answer_text and settings.ANTHROPIC_API_KEY:
        try:
            prompt = f"""
You are an educational assessment assistant for a Ghanaian JHS/SHS school.

Assignment: {assignment.title}
Subject: {assignment.subject}
Description: {assignment.description}

Student's Answer:
{data.answer_text}

Please evaluate this student's answer and provide:
1. A score out of 100
2. Constructive feedback (3-4 sentences) explaining what was good,
   what was missing, and how they can improve.

Respond in this exact format:
SCORE: [number]
FEEDBACK: [your feedback here]
"""
            response = httpx.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 500,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=20.0
            )
            result = response.json()
            text = result["content"][0]["text"]
            lines = text.strip().split("\n")
            for line in lines:
                if line.startswith("SCORE:"):
                    try:
                        ai_score = int(line.replace("SCORE:", "").strip())
                    except ValueError:
                        pass
                if line.startswith("FEEDBACK:"):
                    ai_feedback = line.replace("FEEDBACK:", "").strip()
        except Exception:
            pass  # fallback gracefully if API fails

    submission = Submission(
        assignment_id=data.assignment_id,
        student_id=current_user.id,
        answer_text=data.answer_text,
        file_url=data.file_url,
        ai_feedback=ai_feedback,
        ai_score=ai_score,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

@router.get("/{assignment_id}/submissions", response_model=List[SubmissionResponse])
def get_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher views all submissions for an assignment."""
    return db.query(Submission).filter(
        Submission.assignment_id == assignment_id
    ).all()

@router.put("/submissions/{submission_id}/grade")
def grade_submission(
    submission_id: int,
    teacher_score: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher confirms or overrides the AI score for a submission."""
    submission = db.query(Submission).filter(
        Submission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    submission.teacher_score = teacher_score
    db.commit()
    return {"message": "Score updated", "teacher_score": teacher_score}