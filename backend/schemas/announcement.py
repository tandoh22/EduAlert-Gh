from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AnnouncementCreate(BaseModel):
    title: str
    body: str
    class_id: Optional[int] = None
    is_schoolwide: bool = False

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    body: str
    author_id: int
    class_id: Optional[int]
    is_schoolwide: bool
    created_at: datetime
    class Config:
        from_attributes = True