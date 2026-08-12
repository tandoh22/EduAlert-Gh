from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ClassCreate(BaseModel):
    name: str
    level: str          # "JHS" or "SHS"
    course: str          # e.g. "Science 1" — determines the subject list
    year: int
    school: Optional[str] = None

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None
    course: Optional[str] = None

class ClassResponse(BaseModel):
    id: int
    name: str
    level: str
    course: Optional[str] = None
    year: int
    school: Optional[str] = None
    subjects: List[str] = []
    class Config:
        from_attributes = True