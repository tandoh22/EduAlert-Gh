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
    student_name: Optional[str] = None
    student_code: Optional[str] = None
    class_name: Optional[str] = None
    answer_text: Optional[str] = None
    file_url: Optional[str] = None
    ai_feedback: Optional[str] = None
    ai_score: Optional[int] = None
    teacher_score: Optional[int] = None
    submitted_at: Optional[datetime] = None
    assignment: Optional[AssignmentResponse] = None
    class Config:
        from_attributes = True