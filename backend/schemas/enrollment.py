from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EnrollmentCreate(BaseModel):
    student_id: int
    class_id: int
    subject: Optional[str] = None
    term: str
    year: int

class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    class_id: int
    subject: Optional[str]
    term: str
    year: int
    created_at: datetime
    class Config:
        from_attributes = True