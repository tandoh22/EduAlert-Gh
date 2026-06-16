from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class LessonNote(Base):
    __tablename__ = "lesson_notes"
    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String, nullable=False)
    subject      = Column(String, nullable=False)
    topic        = Column(String, nullable=False)
    class_level  = Column(String, nullable=True)     # e.g. "SHS 2"
    content      = Column(Text, nullable=False)       # AI generated lesson note
    teacher_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_shared    = Column(Boolean, default=False)     # shared with students?
    source_file  = Column(String, nullable=True)      # original NaCCA PDF name
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    teacher = relationship("User")