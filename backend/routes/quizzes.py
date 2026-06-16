from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import httpx
import json
from database import get_db
from models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from schemas.quiz import (
    QuizCreate, QuizResponse, QuizQuestionCreate,
    QuizQuestionResponse, QuizSubmit, QuizAttemptResponse
)
from core.dependencies import require_teacher, get_current_user
from core.config import settings
from models.user import User

router = APIRouter()

@router.post("/", response_model=QuizResponse, status_code=201)
def create_quiz(
    data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher creates a new quiz."""
    quiz = Quiz(**data.dict(), teacher_id=current_user.id)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz

@router.post("/generate-questions/{quiz_id}")
def generate_quiz_questions(
    quiz_id: int,
    num_questions: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    AI generates quiz questions from the quiz topic using NaCCA content.
    Claude generates a mix of MCQ, true/false, and short answer questions.
    """
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="Anthropic API key not configured"
        )

    prompt = f"""
You are an educational content creator for Ghanaian JHS/SHS schools
following the NaCCA Standards-Based Curriculum.

Generate {num_questions} quiz questions for:
Subject: {quiz.subject}
Topic: {quiz.topic or quiz.title}

Create a mix of:
- 5 multiple choice questions (MCQ)
- 3 true/false questions
- 2 short answer questions

Respond ONLY with a valid JSON array. No preamble, no explanation.
Format exactly like this:
[
  {{
    "question_text": "What is...?",
    "question_type": "mcq",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A",
    "marks": 1
  }},
  {{
    "question_text": "True or False: ...",
    "question_type": "true_false",
    "option_a": "True",
    "option_b": "False",
    "option_c": null,
    "option_d": null,
    "correct_answer": "True",
    "marks": 1
  }},
  {{
    "question_text": "Explain...",
    "question_type": "short_answer",
    "option_a": null,
    "option_b": null,
    "option_c": null,
    "option_d": null,
    "correct_answer": "Key points: ...",
    "marks": 3
  }}
]
"""
    try:
        response = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-6",
                "max_tokens": 2000,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=30.0
        )
        data = response.json()
        text = data["content"][0]["text"].strip()
        text = text.replace("```json", "").replace("```", "").strip()
        questions_data = json.loads(text)

        saved = []
        for i, q in enumerate(questions_data, 1):
            question = QuizQuestion(
                quiz_id=quiz_id,
                question_text=q["question_text"],
                question_type=q["question_type"],
                option_a=q.get("option_a"),
                option_b=q.get("option_b"),
                option_c=q.get("option_c"),
                option_d=q.get("option_d"),
                correct_answer=q["correct_answer"],
                marks=q.get("marks", 1),
                order_num=i
            )
            db.add(question)
            saved.append(q["question_text"])

        db.commit()
        return {
            "message": f"{len(saved)} questions generated and saved",
            "quiz_id": quiz_id,
            "questions_count": len(saved)
        }
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="AI returned invalid format. Please try again."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{quiz_id}/questions", response_model=QuizQuestionResponse, status_code=201)
def add_question_manually(
    quiz_id: int,
    data: QuizQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher manually adds a question to a quiz."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    question = QuizQuestion(**data.dict(), quiz_id=quiz_id)
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

@router.get("/{quiz_id}/questions", response_model=List[QuizQuestionResponse])
def get_quiz_questions(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all questions for a quiz."""
    return db.query(QuizQuestion).filter(
        QuizQuestion.quiz_id == quiz_id
    ).order_by(QuizQuestion.order_num).all()

@router.post("/{quiz_id}/publish")
def publish_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher publishes quiz so students can see and take it."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz.is_published = True
    db.commit()
    return {"message": "Quiz published successfully"}

@router.post("/{quiz_id}/start", response_model=QuizAttemptResponse)
def start_quiz(
    quiz_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Student starts a quiz — creates an attempt record."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.is_published == True
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or not published")

    existing = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.student_id == student_id,
        QuizAttempt.is_completed == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Quiz already completed")

    attempt = QuizAttempt(quiz_id=quiz_id, student_id=student_id)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt

@router.post("/submit", response_model=QuizAttemptResponse)
def submit_quiz(
    data: QuizSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Student submits completed quiz.
    MCQ and true/false are marked instantly.
    Short answers are marked by Claude AI with written feedback.
    """
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == data.attempt_id,
        QuizAttempt.is_completed == False
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found or already submitted")

    total_marks = 0
    scored_marks = 0.0

    for ans in data.answers:
        question = db.query(QuizQuestion).filter(
            QuizQuestion.id == ans.question_id
        ).first()
        if not question:
            continue

        total_marks += question.marks
        is_correct = False
        marks_awarded = 0.0
        ai_feedback = None

        if question.question_type in ["mcq", "true_false"]:
            # Auto-mark instantly
            is_correct = (
                str(ans.student_answer).strip().upper() ==
                str(question.correct_answer).strip().upper()
            )
            marks_awarded = question.marks if is_correct else 0.0

        elif question.question_type == "short_answer":
            # Claude AI marks short answer
            if ans.student_answer and settings.ANTHROPIC_API_KEY:
                try:
                    prompt = f"""
You are marking a short answer question for a Ghanaian JHS/SHS student.

Question: {question.question_text}
Expected Answer / Key Points: {question.correct_answer}
Student's Answer: {ans.student_answer}
Maximum Marks: {question.marks}

Award marks fairly based on how well the student addressed the key points.
Respond in this exact format:
MARKS: [number out of {question.marks}]
FEEDBACK: [2 sentences explaining what was correct and what was missing]
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
                            "max_tokens": 300,
                            "messages": [{"role": "user", "content": prompt}]
                        },
                        timeout=20.0
                    )
                    result = response.json()
                    text = result["content"][0]["text"]
                    for line in text.strip().split("\n"):
                        if line.startswith("MARKS:"):
                            try:
                                marks_awarded = float(
                                    line.replace("MARKS:", "").strip()
                                )
                            except ValueError:
                                pass
                        if line.startswith("FEEDBACK:"):
                            ai_feedback = line.replace("FEEDBACK:", "").strip()
                    is_correct = marks_awarded >= (question.marks * 0.5)
                except Exception:
                    marks_awarded = 0.0

        scored_marks += marks_awarded

        quiz_answer = QuizAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            student_answer=ans.student_answer,
            is_correct=is_correct,
            marks_awarded=marks_awarded,
            ai_feedback=ai_feedback
        )
        db.add(quiz_answer)

    percentage = (scored_marks / total_marks * 100) if total_marks > 0 else 0
    attempt.score = scored_marks
    attempt.total_marks = total_marks
    attempt.percentage = round(percentage, 2)
    attempt.is_completed = True
    attempt.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(attempt)
    return attempt

@router.get("/class/{class_id}", response_model=List[QuizResponse])
def get_class_quizzes(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all published quizzes for a class — used by students."""
    return db.query(Quiz).filter(
        Quiz.class_id == class_id,
        Quiz.is_published == True
    ).all()

@router.get("/{quiz_id}/results")
def get_quiz_results(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher views all student results for a quiz."""
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.is_completed == True
    ).all()
    return [
        {
            "student_id": a.student_id,
            "score": a.score,
            "total_marks": a.total_marks,
            "percentage": a.percentage,
            "submitted_at": a.submitted_at
        }
        for a in attempts
    ]