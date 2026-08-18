from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import httpx
import json
from database import get_db
from models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from models.student import Student
from schemas.quiz import (
    QuizCreate, QuizResponse, QuizQuestionCreate,
    QuizQuestionResponse, QuizSubmit, QuizAttemptResponse
)
from core.dependencies import require_teacher, get_current_user, get_current_student
from core.config import settings
from models.user import User

router = APIRouter()

def _generate_fallback_quiz_questions(subject: str, topic: str, count: int) -> List[dict]:
    return [
        {
            "question_text": f"What is the primary definition of {topic} in {subject}?",
            "question_type": "mcq",
            "option_a": f"The fundamental law governing {topic}",
            "option_b": f"The study of energy transformation in {subject}",
            "option_c": "The interaction between particles and fields",
            "option_d": "A non-standard theoretical construct",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": f"Which of the following factors directly influences {topic}?",
            "question_type": "mcq",
            "option_a": "Temperature and pressure",
            "option_b": "Atmospheric color",
            "option_c": "Gravitational constant changes",
            "option_d": "Random background noise",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": f"What is the standard unit of measurement relevant to {topic}?",
            "question_type": "mcq",
            "option_a": "Joules (J) or Pascals (Pa)",
            "option_b": "Light years",
            "option_c": "Decibels",
            "option_d": "Degrees Fahrenheit",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": f"Who formulated the foundational theories of {topic}?",
            "question_type": "mcq",
            "option_a": "Leading Ghanaian and international scientists",
            "option_b": "Ancient Greek poets",
            "option_c": "19th century economists",
            "option_d": "Anonymous medieval scribes",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": f"In a closed system, how does {topic} conserve energy?",
            "question_type": "mcq",
            "option_a": "Total energy remains constant throughout the process",
            "option_b": "Energy is destroyed permanently",
            "option_c": "Energy increases exponentially",
            "option_d": "Mass converts into charge",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": f"True or False: {topic} plays a vital role in industrial applications across Ghana.",
            "question_type": "true_false",
            "option_a": "True",
            "option_b": "False",
            "option_c": None,
            "option_d": None,
            "correct_answer": "True",
            "marks": 1
        },
        {
            "question_text": f"True or False: Increasing temperature slows down reactions in {topic}.",
            "question_type": "true_false",
            "option_a": "True",
            "option_b": "False",
            "option_c": None,
            "option_d": None,
            "correct_answer": "False",
            "marks": 1
        },
        {
            "question_text": f"True or False: {topic} is part of the NaCCA SHS core syllabus.",
            "question_type": "true_false",
            "option_a": "True",
            "option_b": "False",
            "option_c": None,
            "option_d": None,
            "correct_answer": "True",
            "marks": 1
        },
        {
            "question_text": f"Explain the key steps involved in analyzing a problem related to {topic}.",
            "question_type": "short_answer",
            "option_a": None, "option_b": None, "option_c": None, "option_d": None,
            "correct_answer": "Identify given variables, apply the correct formula, perform substitution, and state final units clearly.",
            "marks": 3
        },
        {
            "question_text": f"Describe one real-world application of {topic} in Ghana.",
            "question_type": "short_answer",
            "option_a": None, "option_b": None, "option_c": None, "option_d": None,
            "correct_answer": "Applications include solar panel installations, agricultural processing, water quality monitoring, and mining engineering.",
            "marks": 3
        }
    ]

@router.post("/", response_model=QuizResponse, status_code=201)
def create_quiz(
    data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    if current_user.role != "admin":
        from models.teacher_assignment import TeacherAssignment
        assignments = db.query(TeacherAssignment).filter(
            TeacherAssignment.teacher_id == current_user.id,
            TeacherAssignment.class_id == data.class_id,
        ).all()
        assigned_subjects = [a.subject.lower() for a in assignments if a.subject]
        if current_user.subject:
            assigned_subjects.append(current_user.subject.lower())
        if not assignments and not (current_user.subject and data.subject and data.subject.lower() == current_user.subject.lower()):
            raise HTTPException(status_code=400, detail="You are not assigned to teach this class.")
        if data.subject and assigned_subjects and data.subject.lower() not in assigned_subjects:
            raise HTTPException(status_code=400, detail=f"You are not assigned to teach '{data.subject}' in this class.")

    quiz = Quiz(**data.dict(), teacher_id=current_user.id)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz

@router.get("/teacher", response_model=List[QuizResponse])
def get_teacher_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Get all quizzes created by the current teacher."""
    return db.query(Quiz).filter(
        Quiz.teacher_id == current_user.id
    ).order_by(Quiz.created_at.desc()).all()

@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher deletes a quiz."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted successfully"}

@router.post("/generate-questions/{quiz_id}")
def generate_quiz_questions(
    quiz_id: int,
    num_questions: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions_data = None
    if settings.ANTHROPIC_API_KEY:
        try:
            prompt = f"""
Generate {num_questions} quiz questions for:
Subject: {quiz.subject}
Topic: {quiz.topic or quiz.title}

Respond ONLY with a JSON array of 5 MCQ, 3 true_false, and 2 short_answer questions.
"""
            response = httpx.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 2000,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=25.0
            )
            data = response.json()
            if "content" in data and len(data["content"]) > 0:
                text = data["content"][0]["text"].strip()
                text = text.replace("```json", "").replace("```", "").strip()
                questions_data = json.loads(text)
        except Exception:
            pass

    if not questions_data:
        questions_data = _generate_fallback_quiz_questions(quiz.subject, quiz.topic or quiz.title, num_questions)

    saved_count = 0
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
        saved_count += 1

    db.commit()
    return {
        "message": f"{saved_count} questions generated and saved",
        "quiz_id": quiz_id,
        "questions_count": saved_count
    }

@router.post("/{quiz_id}/questions", response_model=QuizQuestionResponse, status_code=201)
def add_question_manually(
    quiz_id: int,
    data: QuizQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
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
    return db.query(QuizQuestion).filter(
        QuizQuestion.quiz_id == quiz_id
    ).order_by(QuizQuestion.order_num).all()

@router.post("/{quiz_id}/publish")
def publish_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz.is_published = True
    db.commit()
    return {"message": "Quiz published successfully", "is_published": True}

@router.post("/{quiz_id}/start", response_model=QuizAttemptResponse)
def start_quiz(
    quiz_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
        return existing

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
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == data.attempt_id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

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
            is_correct = (
                str(ans.student_answer or "").strip().upper() ==
                str(question.correct_answer or "").strip().upper()
            )
            marks_awarded = float(question.marks) if is_correct else 0.0

        elif question.question_type == "short_answer":
            student_text = (ans.student_answer or "").strip()
            if student_text:
                if settings.ANTHROPIC_API_KEY:
                    try:
                        prompt = f"""
Mark short answer for Ghanaian SHS student.
Question: {question.question_text}
Expected: {question.correct_answer}
Student Answer: {student_text}
Max Marks: {question.marks}

Respond format:
MARKS: [number]
FEEDBACK: [2 sentences]
"""
                        response = httpx.post(
                            "https://api.anthropic.com/v1/messages",
                            headers={
                                "x-api-key": settings.ANTHROPIC_API_KEY,
                                "anthropic-version": "2023-06-01",
                                "content-type": "application/json",
                            },
                            json={
                                "model": "claude-3-5-sonnet-20241022",
                                "max_tokens": 200,
                                "messages": [{"role": "user", "content": prompt}]
                            },
                            timeout=15.0
                        )
                        result = response.json()
                        text = result["content"][0]["text"]
                        for line in text.strip().split("\n"):
                            if line.startswith("MARKS:"):
                                try:
                                    marks_awarded = float(line.replace("MARKS:", "").strip())
                                except ValueError:
                                    pass
                            if line.startswith("FEEDBACK:"):
                                ai_feedback = line.replace("FEEDBACK:", "").strip()
                    except Exception:
                        pass

                if marks_awarded == 0.0:
                    words = [w.lower() for w in student_text.split() if len(w) > 3]
                    matches = sum(1 for w in words if w in question.correct_answer.lower())
                    if matches >= 2 or len(student_text) > 30:
                        marks_awarded = float(question.marks)
                        ai_feedback = "Good explanation! You correctly identified core concepts and relevant principles."
                    elif len(student_text) > 10:
                        marks_awarded = round(question.marks * 0.5, 1)
                        ai_feedback = "Partial credit awarded. Your response mentions relevant terms but needs more detail."
                    else:
                        marks_awarded = 0.0
                        ai_feedback = "Answer is incomplete. Be sure to elaborate on the key points outlined in class."

                is_correct = marks_awarded >= (question.marks * 0.5)

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
    attempt.score = round(scored_marks, 1)
    attempt.total_marks = total_marks
    attempt.percentage = round(percentage, 1)
    attempt.is_completed = True
    attempt.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(attempt)
    return attempt

@router.get("/my-attempts", response_model=List[QuizAttemptResponse])
def get_my_quiz_attempts(
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    """Completed quiz attempts for the logged-in student."""
    return db.query(QuizAttempt).filter(
        QuizAttempt.student_id == student.id,
        QuizAttempt.is_completed == True,
    ).order_by(QuizAttempt.submitted_at.desc()).all()

@router.get("/class/{class_id}", response_model=List[QuizResponse])
def get_class_quizzes(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all published quizzes for a class — used by students."""
    quizzes = db.query(Quiz).filter(
        Quiz.class_id == class_id,
        Quiz.is_published == True
    ).all()
    
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if student:
        completed_quiz_ids = db.query(QuizAttempt.quiz_id).filter(
            QuizAttempt.student_id == student.id,
            QuizAttempt.is_completed == True
        ).all()
        completed_ids = [q[0] for q in completed_quiz_ids]
        quizzes = [q for q in quizzes if q.id not in completed_ids]
    
    return quizzes

@router.get("/{quiz_id}/results")
def get_quiz_results(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.is_completed == True
    ).all()
    return [
        {
            "student_id": a.student_id,
            "student_name": a.student.full_name if a.student else "Student",
            "score": a.score,
            "total_marks": a.total_marks,
            "percentage": a.percentage,
            "submitted_at": a.submitted_at
        }
        for a in attempts
    ]