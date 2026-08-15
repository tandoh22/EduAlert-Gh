from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from core.curriculum import COURSE_SUBJECTS

class Class(Base):
    __tablename__ = "classes"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)        # e.g. "SHS 1A", "Form 2 Science A"
    level      = Column(String, nullable=False)        # always "SHS" — this app only covers Senior High Schools
    course     = Column(String, nullable=True)          # e.g. "SCIENCE 1" — drives the subject list
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