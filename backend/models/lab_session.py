from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class LabSession(Base):
    __tablename__ = "lab_sessions"
    id         = Column(Integer, primary_key=True, index=True)
    class_id   = Column(Integer, ForeignKey("classes.id"), nullable=False)
    date       = Column(Date, nullable=False)
    start_time = Column(String, nullable=False)    # e.g. "08:00"
    end_time   = Column(String, nullable=False)    # e.g. "09:30"
    purpose    = Column(String, nullable=True)     # e.g. "Quiz - Mathematics"
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    class_   = relationship("Class", back_populates="lab_sessions")
    creator  = relationship("User")