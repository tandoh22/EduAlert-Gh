from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import httpx
import base64
import json
from database import get_db
from models.study_card import StudyCardSet
from schemas.study_card import StudyCardSetResponse
from core.dependencies import get_current_user
from core.config import settings
from models.user import User

router = APIRouter()

def _generate_fallback_study_cards(subject: str, topic: str) -> List[dict]:
    return [
        {"question": f"What is the definition of {topic} in {subject}?", "answer": f"{topic} is a core concept in {subject} that explains fundamental mechanisms and rules governing the domain."},
        {"question": f"State the primary law or principle related to {topic}.", "answer": f"The primary principle states that key inputs and environmental conditions determine the rate and outcome of {topic} reactions."},
        {"question": f"Why is {topic} important in modern science and technology?", "answer": f"It provides the theoretical foundation for technological innovations, medical applications, and environmental management."},
        {"question": f"What are the standard SI units or key terms associated with {topic}?", "answer": "Standard units and terms include Joules, Moles, Pascals, or specific chemical/biological identifiers depending on context."},
        {"question": f"Give a practical example of {topic} in daily life in Ghana.", "answer": "Examples include food preservation, solar panel energy conversion, water purification, and local agricultural practices."},
        {"question": f"What is a common misconception about {topic}?", "answer": f"A common mistake is confusing process inputs with final yields or assuming reactions occur without activation energy."},
        {"question": f"How do temperature and concentration affect {topic}?", "answer": "Higher temperature and concentration generally increase kinetic energy and collision frequency, accelerating the rate."},
        {"question": f"What key formula or equation is used when solving {topic} problems?", "answer": f"Standard equations relate initial and final states: Input + Energy = Output + Byproducts."}
    ]

@router.post("/generate", response_model=StudyCardSetResponse, status_code=201)
async def generate_study_cards(
    subject: str = Form(...),
    topic: str = Form(...),
    student_id: int = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cards = None
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
Generate 8 study flashcards for:
Subject: {subject}
Topic: {topic}

Respond ONLY with a valid JSON array of 8 objects, each with "question" and "answer" keys.
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
                    "max_tokens": 1500,
                    "messages": [{"role": "user", "content": messages_content}]
                },
                timeout=25.0
            )
            data = response.json()
            if "content" in data and len(data["content"]) > 0:
                text = data["content"][0]["text"].strip()
                text = text.replace("```json", "").replace("```", "").strip()
                cards = json.loads(text)
        except Exception:
            pass

    if not cards:
        cards = _generate_fallback_study_cards(subject, topic)

    card_set = StudyCardSet(
        title=f"{subject} — {topic}",
        subject=subject,
        topic=topic,
        student_id=student_id,
        cards=cards,
        source_file=file.filename if file else None
    )
    db.add(card_set)
    db.commit()
    db.refresh(card_set)
    return card_set

@router.get("/student/{student_id}", response_model=List[StudyCardSetResponse])
def get_student_study_cards(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(StudyCardSet).filter(
        StudyCardSet.student_id == student_id
    ).all()

@router.get("/{set_id}", response_model=StudyCardSetResponse)
def get_study_card_set(
    set_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card_set = db.query(StudyCardSet).filter(
        StudyCardSet.id == set_id
    ).first()
    if not card_set:
        raise HTTPException(status_code=404, detail="Study card set not found")
    return card_set

@router.delete("/{set_id}", status_code=204)
def delete_study_card_set(
    set_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card_set = db.query(StudyCardSet).filter(
        StudyCardSet.id == set_id
    ).first()
    if not card_set:
        raise HTTPException(status_code=404, detail="Study card set not found")
    db.delete(card_set)
    db.commit()