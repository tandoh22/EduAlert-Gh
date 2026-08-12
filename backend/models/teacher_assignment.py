from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class TeacherAssignment(Base):
    __tablename__ = "teacher_assignments"
    id         = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id   = Column(Integer, ForeignKey("classes.id"), nullable=False)
    subject    = Column(String, nullable=True)
    term       = Column(String, nullable=False)
    year       = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    teacher = relationship("User")
    class_  = relationship("Class", back_populates="teacher_assignments")
