from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Score(Base):
    __tablename__ = "scores"
    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject     = Column(String, nullable=False)
    score       = Column(Float, nullable=False)
    term        = Column(String, nullable=False)
    year        = Column(Integer, nullable=False)
    exam_type   = Column(String, default="End of Term")
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    student     = relationship("Student", back_populates="scores")