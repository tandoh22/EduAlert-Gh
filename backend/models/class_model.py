from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from core.curriculum import COURSE_SUBJECTS

import re

def generate_class_code(name: str, course: str = None) -> str:
    if not name or not name.strip() or name.strip() == "Unassigned":
        return "N/A"

    clean_name = name.strip()

    # 1. Direct code pattern: e.g. "2S1", "1A5", "1S2", "3B2", "2VA1", "1HE2", "2AG1", "3SA", "2 S 1", "Form 2S1", "SHS 1A5"
    m_direct = re.search(r'^(?:(?:Form|SHS|Class|Grade)\s*)?([1-3])\s*([A-Za-z]{1,3})\s*([0-9A-Za-z]*)$', clean_name, re.IGNORECASE)
    if m_direct:
        f_num = m_direct.group(1)
        dept_raw = m_direct.group(2).upper()
        stream_part = m_direct.group(3).upper() if m_direct.group(3) else ""

        # Map full/abbreviated words if matched by direct pattern
        if dept_raw in ("S", "SC", "SCI", "SCIENCE"):
            dept = "S"
        elif dept_raw in ("A", "AR", "ART", "ARTS", "GA", "GENARTS"):
            dept = "A"
        elif dept_raw in ("B", "BUS", "BUSINESS"):
            dept = "B"
        elif dept_raw in ("VA", "VISUAL", "V"):
            dept = "VA"
        elif dept_raw in ("HE", "HOME", "HOMECON", "H"):
            dept = "HE"
        elif dept_raw in ("AG", "AGRIC", "AGRICULTURE"):
            dept = "AG"
        elif dept_raw in ("T", "TECH", "TECHNICAL"):
            dept = "T"
        else:
            dept = dept_raw
        return f"{f_num}{dept}{stream_part}"

    # 2. Extract form number (1, 2, or 3)
    form_num = ""
    form_match = re.search(r'\b([1-3])\b', clean_name)
    if form_match:
        form_num = form_match.group(1)
    else:
        form_match_word = re.search(r'(?:Form|SHS|Grade|Class)\s*([1-3])', clean_name, re.IGNORECASE)
        if form_match_word:
            form_num = form_match_word.group(1)
        elif course:
            c_match = re.search(r'\b([1-3])\b', course)
            if c_match:
                form_num = c_match.group(1)

    if not form_num:
        form_num = "1"

    # 3. Extract department from name and course
    text = f"{clean_name} {course or ''}"
    if re.search(r'\b(?:Visual\s*Arts?|VA)\b', text, re.IGNORECASE):
        dept = "VA"
    elif re.search(r'\b(?:General\s*Science|Science|Sci)\b', text, re.IGNORECASE):
        dept = "S"
    elif re.search(r'\b(?:General\s*Arts?|Arts?)\b', text, re.IGNORECASE):
        dept = "A"
    elif re.search(r'\b(?:Business|Bus)\b', text, re.IGNORECASE):
        dept = "B"
    elif re.search(r'\b(?:Home\s*Economics?|Home\s*Econ|HE)\b', text, re.IGNORECASE):
        dept = "HE"
    elif re.search(r'\b(?:General\s*Agric(?:ulture)?|Agric(?:ulture)?|AG)\b', text, re.IGNORECASE):
        dept = "AG"
    elif re.search(r'\b(?:Technical|Tech)\b', text, re.IGNORECASE):
        dept = "T"
    else:
        # Fallback: uppercase initials of significant words
        words = [w for w in re.split(r'[\s\-_]+', clean_name) if w.lower() not in ("form", "shs", "class", "grade", "1", "2", "3")]
        dept = "".join(w[0].upper() for w in words if w) if words else "C"

    # 4. Extract stream / section number or letter (e.g. 1, 2, 3, 4, 5, A, B, C)
    stream_match = re.search(r'(?:[\s\-_])([1-9]|[A-Za-z])$', clean_name.strip())
    stream_num = stream_match.group(1).upper() if stream_match else ""
    if not stream_num and course:
        c_stream = re.search(r'([1-9]|[A-Za-z])$', course.strip())
        if c_stream:
            stream_num = c_stream.group(1).upper()

    return f"{form_num}{dept}{stream_num}"

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