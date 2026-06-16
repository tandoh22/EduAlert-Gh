from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Class(Base):
    __tablename__ = "classes"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)        # e.g. "JHS 2B", "SHS 1A"
    level      = Column(String, nullable=False)        # "JHS" or "SHS"
    year       = Column(Integer, nullable=False)
    school     = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    enrollments  = relationship("Enrollment", back_populates="class_")
    assignments  = relationship("Assignment", back_populates="class_")
    quizzes      = relationship("Quiz", back_populates="class_")
    announcements= relationship("Announcement", back_populates="class_")
    lab_sessions = relationship("LabSession", back_populates="class_")