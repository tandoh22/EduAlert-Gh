from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Student(Base):
    __tablename__ = "students"
<<<<<<< HEAD
    id              = Column(Integer, primary_key=True, index=True)
    full_name       = Column(String, nullable=False)
    student_id      = Column(String, unique=True, index=True)
    class_name      = Column(String, nullable=False)
    admitted_course = Column(String, nullable=True)  # e.g. "General Science" — set at registration
    gender          = Column(String, nullable=True)
    date_of_birth   = Column(String, nullable=True)
    teacher_id      = Column(Integer, ForeignKey("users.id"))
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    school          = Column(String, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    teacher         = relationship("User", foreign_keys=[teacher_id], back_populates="students")
    user_account    = relationship("User", foreign_keys=[user_id])
    scores          = relationship("Score", back_populates="student", cascade="all, delete")
    attendances     = relationship("Attendance", back_populates="student", cascade="all, delete")
    predictions     = relationship("Prediction", back_populates="student", cascade="all, delete")
=======
    id            = Column(Integer, primary_key=True, index=True)
    full_name     = Column(String, nullable=False)
    student_id    = Column(String, unique=True, index=True)
    class_name    = Column(String, nullable=False)
    gender        = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    teacher_id    = Column(Integer, ForeignKey("users.id"))
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    school        = Column(String, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    teacher       = relationship("User", back_populates="students", foreign_keys=[teacher_id])
    scores        = relationship("Score", back_populates="student", cascade="all, delete")
    attendances   = relationship("Attendance", back_populates="student", cascade="all, delete")
    predictions   = relationship("Prediction", back_populates="student", cascade="all, delete")
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
