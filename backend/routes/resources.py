from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import httpx
from database import get_db
from models.resource import Resource
from schemas.resource import ResourceCreate, ResourceResponse
from core.dependencies import require_teacher, get_current_user
from core.config import settings
from models.user import User

router = APIRouter()

@router.post("/", response_model=ResourceResponse, status_code=201)
def upload_resource(
    data: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Teacher uploads a resource (textbook, past questions, video link).
    Claude AI automatically generates a summary of the resource.
    """
    ai_summary = None

    if settings.ANTHROPIC_API_KEY and data.description:
        try:
            prompt = f"""
Summarise this educational resource in 3 sentences for Ghanaian
JHS/SHS students. Keep it simple and clear.

Resource Title: {data.title}
Subject: {data.subject}
Description: {data.description}
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
                    "max_tokens": 200,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=15.0
            )
            result = response.json()
            ai_summary = result["content"][0]["text"].strip()
        except Exception:
            pass

    resource = Resource(
        **data.dict(),
        uploaded_by=current_user.id,
        ai_summary=ai_summary
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource

@router.get("/", response_model=List[ResourceResponse])
def get_resources(
    subject: Optional[str] = None,
    class_level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Browse the resource library — available to all users."""
    query = db.query(Resource)
    if subject:
        query = query.filter(Resource.subject == subject)
    if class_level:
        query = query.filter(Resource.class_level == class_level)
    return query.all()

@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single resource."""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.delete("/{resource_id}", status_code=204)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher deletes a resource they uploaded."""
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.uploaded_by == current_user.id
    ).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    db.delete(resource)
    db.commit()