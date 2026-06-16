from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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

@router.post("/generate", response_model=LessonNoteResponse, status_code=201)
async def generate_lesson_note(
    subject: str,
    topic: str,
    class_level: Optional[str] = None,
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Teacher provides a subject and topic (and optionally uploads a NaCCA
    textbook PDF page). Claude AI generates a full structured lesson note.
    """
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="Anthropic API key not configured"
        )

    messages_content = []

    # If teacher uploaded a NaCCA PDF page, include it
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
You are an expert educational content creator following Ghana's NaCCA
Standards-Based Curriculum for JHS and SHS schools.

Generate a complete, well-structured lesson note for:
Subject: {subject}
Topic: {topic}
Class Level: {class_level or "JHS/SHS"}

{"Use the uploaded NaCCA textbook content as your primary source." if file else ""}

Structure the lesson note exactly as follows:

LESSON NOTE
===========
Subject: {subject}
Topic: {topic}
Class: {class_level or "JHS/SHS"}
Duration: 80 minutes

LEARNING OBJECTIVES
By the end of this lesson, students will be able to:
1. [objective 1]
2. [objective 2]
3. [objective 3]

INTRODUCTION (10 minutes)
[Engaging starter activity or question to hook students]

MAIN CONTENT (40 minutes)
Section 1: [subtitle]
[detailed content]

Section 2: [subtitle]
[detailed content]

Section 3: [subtitle]
[detailed content]

WORKED EXAMPLES (15 minutes)
Example 1: [worked example with solution]
Example 2: [worked example with solution]

CLASS ACTIVITY (10 minutes)
[group or individual activity for students]

SUMMARY (3 minutes)
[key points recap]

HOMEWORK
[2-3 homework questions]
"""
    messages_content.append({"type": "text", "text": prompt})

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
                "max_tokens": 3000,
                "messages": [{"role": "user", "content": messages_content}]
            },
            timeout=60.0
        )
        data = response.json()
        content = data["content"][0]["text"].strip()

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

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[LessonNoteResponse])
def get_my_lesson_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher views all their generated lesson notes."""
    return db.query(LessonNote).filter(
        LessonNote.teacher_id == current_user.id
    ).all()

@router.get("/shared", response_model=List[LessonNoteResponse])
def get_shared_lesson_notes(
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Students view lesson notes shared by their teachers."""
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
    """Teacher shares a lesson note with students."""
    note = db.query(LessonNote).filter(
        LessonNote.id == note_id,
        LessonNote.teacher_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Lesson note not found")
    note.is_shared = True
    db.commit()
    return {"message": "Lesson note shared with students"}

@router.get("/{note_id}", response_model=LessonNoteResponse)
def get_lesson_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single lesson note."""
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
    """Teacher deletes a lesson note."""
    note = db.query(LessonNote).filter(
        LessonNote.id == note_id,
        LessonNote.teacher_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Lesson note not found")
    db.delete(note)
    db.commit()