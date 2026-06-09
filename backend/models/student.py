from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Student(Base):
    __tablename__ = "students"
    id            = Column(Integer, primary_key=True, index=True)
    full_name     = Column(String, nullable=False)
    student_id    = Column(String, unique=True, index=True)
    class_name    = Column(String, nullable=False)
    gender        = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    teacher_id    = Column(Integer, ForeignKey("users.id"))
    school        = Column(String, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    teacher       = relationship("User", back_populates="students")
    scores        = relationship("Score", back_populates="student", cascade="all, delete")
    attendances   = relationship("Attendance", back_populates="student", cascade="all, delete")
    predictions   = relationship("Prediction", back_populates="student", cascade="all, delete")