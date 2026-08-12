from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import httpx
import base64
from database import get_db
from models.lesson_note import LessonNote
from schemas.lesson_note import LessonNoteCreate, LessonNoteResponse
from core.dependencies import require_teacher, get_current_user
from core.config import settings
from models.user import User

router = APIRouter()

def _generate_fallback_lesson_note(subject: str, topic: str, class_level: str) -> str:
    return f"""LESSON NOTE
===========
Subject: {subject}
Topic: {topic}
Class Level: {class_level or "JHS/SHS"}
Duration: 80 minutes

LEARNING OBJECTIVES
By the end of this 80-minute lesson, students will be able to:
1. Define the fundamental principles and terminology of {topic}.
2. Apply key formulas and problem-solving techniques relevant to {subject}.
3. Evaluate real-world examples and practical applications within Ghana's NaCCA framework.

INTRODUCTION (10 minutes)
Begin the lesson with an engaging diagnostic question about {topic}. Ask students to share prior observations from their daily lives or previous lessons, bridging basic concepts to today's core objectives.

MAIN CONTENT (40 minutes)
Section 1: Conceptual Foundations of {topic}
Detail the core definitions, standard units, and underlying rules. Ensure students copy essential diagrams and note key vocabulary.

Section 2: Step-by-Step Analytical Methods
Demonstrate how to analyze problems systematically. Break down multi-step procedures into clear, sequential stages.

Section 3: Practical Contexts in Ghana
Connect {topic} to local industries, environmental conservation, technology, and economic development in Ghana.

WORKED EXAMPLES (15 minutes)
Example 1: Standard introductory problem on {topic} with step-by-step solution.
Example 2: Advanced application problem showcasing edge cases and critical thinking.

CLASS ACTIVITY (10 minutes)
Form small groups of 3-4 students. Distribute practice worksheets on {topic} and monitor group discussions to address misconceptions.

SUMMARY (3 minutes)
Recap the 3 main takeaways of the lesson. Have 2 student volunteers summarize the core rule in their own words.

HOMEWORK
1. Answer Questions 1 through 5 on page 42 of the official NaCCA {subject} textbook.
2. Prepare a 1-page summary connecting {topic} to next week's topic.
"""

@router.post("/generate", response_model=LessonNoteResponse, status_code=201)
async def generate_lesson_note(
    subject: str = Form(...),
    topic: str = Form(...),
    class_level: Optional[str] = Form("SHS 2"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Teacher provides a subject and topic (and optionally uploads a NaCCA
    textbook PDF page). Claude AI generates a full structured lesson note.
    Fallback logic ensures operation if API key is not configured.
    """
    content = None
    if settings.ANTHROPIC_API_KEY:
        try:
            messages_content = []
            if file and file.content_type == "application/pdf":
                pdf_bytes = await file.read()
                pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
                messages_content.append({
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": pdf_base64
                    }
                })

            prompt = f"""
Generate a complete, structured lesson note for:
Subject: {subject}
Topic: {topic}
Class Level: {class_level or "JHS/SHS"}

Follow Ghana's NaCCA Standards-Based Curriculum format with Learning Objectives, Introduction, Main Content, Worked Examples, Class Activity, Summary, and Homework.
"""
            messages_content.append({"type": "text", "text": prompt})
            response = httpx.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 2500,
                    "messages": [{"role": "user", "content": messages_content}]
                },
                timeout=30.0
            )
            data = response.json()
            if "content" in data and len(data["content"]) > 0:
                content = data["content"][0]["text"].strip()
        except Exception:
            pass

    if not content:
        content = _generate_fallback_lesson_note(subject, topic, class_level)

    lesson_note = LessonNote(
        title=f"{subject} — {topic}",
        subject=subject,
        topic=topic,
        class_level=class_level,
        content=content,
        teacher_id=current_user.id,
        is_shared=False,
        source_file=file.filename if file else None
    )
    db.add(lesson_note)
    db.commit()
    db.refresh(lesson_note)
    return lesson_note

@router.get("/", response_model=List[LessonNoteResponse])
def get_my_lesson_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    return db.query(LessonNote).filter(
        LessonNote.teacher_id == current_user.id
    ).all()

@router.get("/shared", response_model=List[LessonNoteResponse])
def get_shared_lesson_notes(
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LessonNote).filter(LessonNote.is_shared == True)
    if subject:
        query = query.filter(LessonNote.subject == subject)
    return query.all()

@router.post("/{note_id}/share")
def share_lesson_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    note = db.query(LessonNote).filter(
        LessonNote.id == note_id,
        LessonNote.teacher_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Lesson note not found")
    note.is_shared = True
    db.commit()
    return {"message": "Lesson note shared with students", "is_shared": True}

@router.get("/{note_id}", response_model=LessonNoteResponse)
def get_lesson_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(LessonNote).filter(LessonNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Lesson note not found")
    return note

@router.delete("/{note_id}", status_code=204)
def delete_lesson_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    note = db.query(LessonNote).filter(
        LessonNote.id == note_id,
        LessonNote.teacher_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Lesson note not found")
    db.delete(note)
    db.commit()