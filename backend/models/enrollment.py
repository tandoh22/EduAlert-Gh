from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Enrollment(Base):
    __tablename__ = "enrollments"
    id         = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_id   = Column(Integer, ForeignKey("classes.id"), nullable=False)
    subject    = Column(String, nullable=True)
    term       = Column(String, nullable=False)
    year       = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student")
    class_  = relationship("Class", back_populates="enrollments")