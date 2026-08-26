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
    student_id: Optional[str] = None
    class_name: str
    class_code: Optional[str] = None
    gender: Optional[str] = None
    teacher_id: Optional[int] = None
    user_id: Optional[int] = None
    school: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class StudentProfileResponse(BaseModel):
    student: StudentResponse
    class_id: Optional[int]
    class_code: Optional[str] = None