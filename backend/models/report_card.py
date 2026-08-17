from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class ReportCard(Base):
    __tablename__ = "report_cards"
    id              = Column(Integer, primary_key=True, index=True)
    student_id      = Column(Integer, ForeignKey("students.id"), nullable=False)
    term            = Column(String, nullable=False)
    year            = Column(Integer, nullable=False)
    overall_average = Column(Float, nullable=True)
    attendance_rate = Column(Float, nullable=True)
    exam_score      = Column(Float, nullable=True)     # Raw exam score out of 100%
    quiz_score      = Column(Float, nullable=True)     # Average quiz score out of 100%
    assignment_score= Column(Float, nullable=True)     # Average assignment score out of 100%
    ca_score        = Column(Float, nullable=True)     # Total Continuous Assessment (Quiz + Assignment) out of 100%
    final_score     = Column(Float, nullable=True)     # Combined Final Score (50% Exam + 50% CA)
    grade           = Column(String, nullable=True)    # WASSCE Grade: A1, B2, B3, C4, C5, C6, D7, E8, F9
    ai_comment      = Column(Text, nullable=True)     # AI generated teacher comment
    teacher_comment = Column(Text, nullable=True)     # teacher edited/confirmed comment
    pdf_url         = Column(String, nullable=True)   # generated PDF location
    approved        = Column(String, default="pending")  # "pending", "approved"
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student")