from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Resource(Base):
    __tablename__ = "resources"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    subject     = Column(String, nullable=True)
    class_level = Column(String, nullable=True)
    file_url    = Column(String, nullable=False)
    file_type   = Column(String, nullable=True)   # "pdf", "video", "link"
    ai_summary  = Column(Text, nullable=True)     # AI generated summary
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    uploader = relationship("User")