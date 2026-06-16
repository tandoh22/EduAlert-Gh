from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReportCardGenerate(BaseModel):
    student_id: int
    term: str
    year: int

class ReportCardResponse(BaseModel):
    id: int
    student_id: int
    term: str
    year: int
    overall_average: Optional[float]
    attendance_rate: Optional[float]
    ai_comment: Optional[str]
    teacher_comment: Optional[str]
    pdf_url: Optional[str]
    approved: str
    created_at: datetime
    class Config:
        from_attributes = True