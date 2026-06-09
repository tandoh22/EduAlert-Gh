from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class AttendanceCreate(BaseModel):
    student_id: int
    date: date
    status: str
    term: str
    year: int

class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    date: date
    status: str
    term: str
    year: int
    recorded_at: datetime
    class Config:
        from_attributes = True