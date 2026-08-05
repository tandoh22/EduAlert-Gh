from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    full_name     = Column(String, nullable=False)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role          = Column(String, default="teacher")
    subject       = Column(String, nullable=True)
    school        = Column(String, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    students      = relationship("Student", back_populates="teacher", foreign_keys="Student.teacher_id")