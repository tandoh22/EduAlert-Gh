from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class StudyCardSet(Base):
    __tablename__ = "study_card_sets"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, nullable=False)
    subject     = Column(String, nullable=False)
    topic       = Column(String, nullable=False)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False)
    cards       = Column(JSON, nullable=False)     # list of {question, answer} dicts
    source_file = Column(String, nullable=True)    # original NaCCA PDF name
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student")