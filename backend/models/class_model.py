from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from core.curriculum import COURSE_SUBJECTS

import re

def generate_class_code(name: str, course: str = None) -> str:
    if not name or name == "Unassigned":
        return "N/A"
    form_match = re.search(r'\b([1-3])\b', name)
    form_num = form_match.group(1) if form_match else ""
    if not form_num:
        form_match_word = re.search(r'Form\s*([1-3])', name, re.IGNORECASE)
        form_num = form_match_word.group(1) if form_match_word else ""

    text = f"{name} {course or ''}"
    if "Visual" in text or "VA" in text:
        dept = "VA"
    elif "Science" in text:
        dept = "S"
    elif "Arts" in text:
        dept = "A"
    elif "Business" in text:
        dept = "B"
    elif "Home" in text or "Economics" in text:
        dept = "HE"
    else:
        dept = ""

    stream_match = re.search(r'\b([1-9])\b$', name.strip())
    stream_num = stream_match.group(1) if stream_match else ""

    if form_num and dept:
        return f"{form_num}{dept}{stream_num}"
    return name

class Class(Base):
    __tablename__ = "classes"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)        # e.g. "Form 2 Science 1"
    level      = Column(String, nullable=False)        # always "SHS"
    course     = Column(String, nullable=True)          # e.g. "Science 1"
    year       = Column(Integer, nullable=False)
    school     = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    enrollments  = relationship("Enrollment", back_populates="class_")
    teacher_assignments = relationship("TeacherAssignment", back_populates="class_")
    assignments  = relationship("Assignment", back_populates="class_")
    quizzes      = relationship("Quiz", back_populates="class_")
    announcements= relationship("Announcement", back_populates="class_")
    lab_sessions = relationship("LabSession", back_populates="class_")

    @property
    def subjects(self):
        return COURSE_SUBJECTS.get(self.course, [])

    @property
    def code(self):
        return generate_class_code(self.name, self.course)