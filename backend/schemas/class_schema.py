from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ClassCreate(BaseModel):
    name: str
    level: str          # "JHS" or "SHS"
    year: int
    school: Optional[str] = None

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None

class ClassResponse(BaseModel):
    id: int
    name: str
    level: str
    year: int
    school: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True