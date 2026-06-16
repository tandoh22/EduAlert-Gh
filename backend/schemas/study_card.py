from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class StudyCardRequest(BaseModel):
    subject: str
    topic: str

class CardItem(BaseModel):
    question: str
    answer: str

class StudyCardSetResponse(BaseModel):
    id: int
    title: str
    subject: str
    topic: str
    student_id: int
    cards: List[CardItem]
    source_file: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True