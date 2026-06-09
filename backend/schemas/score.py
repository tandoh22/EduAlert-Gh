from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ScoreCreate(BaseModel):
    student_id: int
    subject: str
    score: float = Field(..., ge=0, le=100)
    term: str
    year: int
    exam_type: str = "End of Term"

class ScoreResponse(BaseModel):
    id: int
    student_id: int
    subject: str
    score: float
    term: str
    year: int
    exam_type: str
    recorded_at: datetime
    class Config:
        from_attributes = True