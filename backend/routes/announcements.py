from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.announcement import Announcement
from schemas.announcement import AnnouncementCreate, AnnouncementResponse
from core.dependencies import require_teacher, require_admin, get_current_user
from models.user import User

router = APIRouter()

@router.post("/", response_model=AnnouncementResponse, status_code=201)
def create_announcement(
    data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Teacher posts a class-specific announcement.
    Headmaster posts a school-wide announcement.
    """
    announcement = Announcement(**data.dict(), author_id=current_user.id)
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement

@router.get("/", response_model=List[AnnouncementResponse])
def get_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all school-wide announcements."""
    return db.query(Announcement).filter(
        Announcement.is_schoolwide == True
    ).order_by(Announcement.created_at.desc()).all()

@router.get("/class/{class_id}", response_model=List[AnnouncementResponse])
def get_class_announcements(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all announcements for a specific class."""
    return db.query(Announcement).filter(
        Announcement.class_id == class_id
    ).order_by(Announcement.created_at.desc()).all()

@router.delete("/{announcement_id}", status_code=204)
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Delete an announcement."""
    announcement = db.query(Announcement).filter(
        Announcement.id == announcement_id,
        Announcement.author_id == current_user.id
    ).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(announcement)
    db.commit()