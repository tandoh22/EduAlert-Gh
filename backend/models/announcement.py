from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Announcement(Base):
    __tablename__ = "announcements"
    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String, nullable=False)
    body         = Column(Text, nullable=False)
    author_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id     = Column(Integer, ForeignKey("classes.id"), nullable=True)  # None = school-wide
    is_schoolwide= Column(Boolean, default=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User")
    class_ = relationship("Class", back_populates="announcements")