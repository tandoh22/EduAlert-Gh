from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "teacher"
    subject: Optional[str] = None
    school: Optional[str] = None
    admitted_course: Optional[str] = None  # required for students only, validated in the endpoint

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None  # sent by frontend; not used by backend but must be accepted

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    status: str
    subject: Optional[str] = None
    school: Optional[str] = None
    student_id: Optional[str] = None
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    admitted_course: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ClassSubjectPick(BaseModel):
    class_id: int
    subject: Optional[str] = None  # required for teachers, ignored for students

class ApproveUserRequest(BaseModel):
    assignments: List[ClassSubjectPick] = []