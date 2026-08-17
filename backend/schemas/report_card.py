from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReportCardGenerate(BaseModel):
    student_id: int
    term: str
    year: int
    exam_score: Optional[float] = None
    quiz_score: Optional[float] = None
    assignment_score: Optional[float] = None

class StudentResultItemInput(BaseModel):
    student_id: int
    exam_score: float

class BulkResultsGenerate(BaseModel):
    term: str
    year: int
    class_id: Optional[int] = None
    students: list[StudentResultItemInput]

class ReportCardResponse(BaseModel):
    id: int
    student_id: int
    term: str
    year: int
    overall_average: Optional[float] = None
    attendance_rate: Optional[float] = None
    exam_score: Optional[float] = None
    quiz_score: Optional[float] = None
    assignment_score: Optional[float] = None
    ca_score: Optional[float] = None
    final_score: Optional[float] = None
    grade: Optional[str] = None
    ai_comment: Optional[str] = None
    teacher_comment: Optional[str] = None
    pdf_url: Optional[str] = None
    approved: str
    created_at: datetime
    class Config:
        from_attributes = True