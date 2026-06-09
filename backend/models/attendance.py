from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Attendance(Base):
    __tablename__ = "attendance"
    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False)
    date        = Column(Date, nullable=False)
    status      = Column(String, nullable=False)
    term        = Column(String, nullable=False)
    year        = Column(Integer, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    student     = relationship("Student", back_populates="attendances")