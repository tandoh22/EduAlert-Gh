from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ResourceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    class_level: Optional[str] = None
    file_url: str
    file_type: Optional[str] = None

class ResourceResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    subject: Optional[str]
    class_level: Optional[str]
    file_url: str
    file_type: Optional[str]
    ai_summary: Optional[str]
    uploaded_by: int
    created_at: datetime
    class Config:
        from_attributes = True