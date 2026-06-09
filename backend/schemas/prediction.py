from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PredictionResponse(BaseModel):
    id: int
    student_id: int
    risk_level: str
    confidence_score: Optional[float]
    reason: Optional[str]
    ai_suggestion: Optional[str]
    term: Optional[str]
    year: Optional[int]
    generated_at: datetime
    class Config:
        from_attributes = True