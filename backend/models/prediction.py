from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Prediction(Base):
    __tablename__ = "predictions"
    id               = Column(Integer, primary_key=True, index=True)
    student_id       = Column(Integer, ForeignKey("students.id"), nullable=False)
    risk_level       = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=True)
    reason           = Column(Text, nullable=True)
    ai_suggestion    = Column(Text, nullable=True)
    term             = Column(String, nullable=True)
    year             = Column(Integer, nullable=True)
    generated_at     = Column(DateTime(timezone=True), server_default=func.now())
    student          = relationship("Student", back_populates="predictions")