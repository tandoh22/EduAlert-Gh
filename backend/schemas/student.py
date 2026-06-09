from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StudentCreate(BaseModel):
    full_name: str
    student_id: str
    class_name: str
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    school: Optional[str] = None

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    class_name: Optional[str] = None
    gender: Optional[str] = None

class StudentResponse(BaseModel):
    id: int
    full_name: str
    student_id: str
    class_name: str
    gender: Optional[str]
    teacher_id: int
    school: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True