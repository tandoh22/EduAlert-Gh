from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Assignment(Base):
    __tablename__ = "assignments"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    subject     = Column(String, nullable=False)
    due_date    = Column(Date, nullable=False)
    class_id    = Column(Integer, ForeignKey("classes.id"), nullable=False)
    teacher_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_url    = Column(String, nullable=True)     # optional attached file
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    class_       = relationship("Class", back_populates="assignments")
    teacher      = relationship("User")
    submissions  = relationship("Submission", back_populates="assignment", cascade="all, delete")

class Submission(Base):
    __tablename__ = "submissions"
    id            = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id    = Column(Integer, ForeignKey("students.id"), nullable=False)
    answer_text   = Column(Text, nullable=True)
    file_url      = Column(String, nullable=True)
    ai_feedback   = Column(Text, nullable=True)
    ai_score      = Column(Integer, nullable=True)   # AI suggested score out of 100
    teacher_score = Column(Integer, nullable=True)   # Teacher confirmed score
    submitted_at  = Column(DateTime(timezone=True), server_default=func.now())

    assignment = relationship("Assignment", back_populates="submissions")
    student    = relationship("Student")