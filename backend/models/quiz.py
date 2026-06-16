from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Quiz(Base):
    __tablename__ = "quizzes"
    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String, nullable=False)
    subject      = Column(String, nullable=False)
    topic        = Column(String, nullable=True)
    class_id     = Column(Integer, ForeignKey("classes.id"), nullable=False)
    teacher_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    time_limit   = Column(Integer, default=30)       # minutes
    is_published = Column(Boolean, default=False)
    due_date     = Column(DateTime(timezone=True), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    class_    = relationship("Class", back_populates="quizzes")
    teacher   = relationship("User")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete")
    attempts  = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id             = Column(Integer, primary_key=True, index=True)
    quiz_id        = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text  = Column(Text, nullable=False)
    question_type  = Column(String, nullable=False)  # "mcq", "true_false", "short_answer"
    option_a       = Column(String, nullable=True)
    option_b       = Column(String, nullable=True)
    option_c       = Column(String, nullable=True)
    option_d       = Column(String, nullable=True)
    correct_answer = Column(String, nullable=False)  # "A", "B", "True", or full answer text
    marks          = Column(Integer, default=1)
    order_num      = Column(Integer, default=1)

    quiz    = relationship("Quiz", back_populates="questions")
    answers = relationship("QuizAnswer", back_populates="question", cascade="all, delete")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id           = Column(Integer, primary_key=True, index=True)
    quiz_id      = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id   = Column(Integer, ForeignKey("students.id"), nullable=False)
    score        = Column(Float, nullable=True)
    total_marks  = Column(Integer, nullable=True)
    percentage   = Column(Float, nullable=True)
    started_at   = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    is_completed = Column(Boolean, default=False)

    quiz    = relationship("Quiz", back_populates="attempts")
    student = relationship("Student")
    answers = relationship("QuizAnswer", back_populates="attempt", cascade="all, delete")

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    id           = Column(Integer, primary_key=True, index=True)
    attempt_id   = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_id  = Column(Integer, ForeignKey("quiz_questions.id"), nullable=False)
    student_answer = Column(Text, nullable=True)
    is_correct   = Column(Boolean, nullable=True)
    marks_awarded= Column(Float, nullable=True)
    ai_feedback  = Column(Text, nullable=True)    # for short answer questions

    attempt  = relationship("QuizAttempt", back_populates="answers")
    question = relationship("QuizQuestion", back_populates="answers")