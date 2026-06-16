from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LessonNoteCreate(BaseModel):
    subject: str
    topic: str
    class_level: Optional[str] = None

class LessonNoteResponse(BaseModel):
    id: int
    title: str
    subject: str
    topic: str
    class_level: Optional[str]
    content: str
    teacher_id: int
    is_shared: bool
    source_file: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True