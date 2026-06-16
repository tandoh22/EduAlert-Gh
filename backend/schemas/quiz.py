from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class QuizQuestionCreate(BaseModel):
    question_text: str
    question_type: str        # "mcq", "true_false", "short_answer"
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str
    marks: int = 1
    order_num: int = 1

class QuizQuestionResponse(BaseModel):
    id: int
    question_text: str
    question_type: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    correct_answer: str
    marks: int
    order_num: int
    class Config:
        from_attributes = True

class QuizCreate(BaseModel):
    title: str
    subject: str
    topic: Optional[str] = None
    class_id: int
    time_limit: int = 30
    due_date: Optional[datetime] = None

class QuizResponse(BaseModel):
    id: int
    title: str
    subject: str
    topic: Optional[str]
    class_id: int
    teacher_id: int
    time_limit: int
    is_published: bool
    due_date: Optional[datetime]
    created_at: datetime
    class Config:
        from_attributes = True

class QuizAnswerSubmit(BaseModel):
    question_id: int
    student_answer: Optional[str] = None

class QuizSubmit(BaseModel):
    attempt_id: int
    answers: List[QuizAnswerSubmit]

class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    score: Optional[float]
    total_marks: Optional[int]
    percentage: Optional[float]
    is_completed: bool
    started_at: datetime
    submitted_at: Optional[datetime]
    class Config:
        from_attributes = True