from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject: str
    due_date: date
    class_id: int
    file_url: Optional[str] = None

class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    subject: str
    due_date: date
    class_id: int
    teacher_id: int
    file_url: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    assignment_id: int
    answer_text: Optional[str] = None
    file_url: Optional[str] = None

class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    answer_text: Optional[str]
    file_url: Optional[str]
    ai_feedback: Optional[str]
    ai_score: Optional[int]
    teacher_score: Optional[int]
    submitted_at: datetime
    class Config:
        from_attributes = True