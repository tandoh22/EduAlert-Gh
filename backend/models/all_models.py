# Import ALL models here so SQLAlchemy resolves
# all relationships before creating tables
from models.user import User
from models.student import Student
from models.score import Score
from models.attendance import Attendance
from models.prediction import Prediction
from models.class_model import Class
from models.enrollment import Enrollment
from models.assignment import Assignment, Submission
from models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from models.lesson_note import LessonNote
from models.study_card import StudyCardSet
from models.resource import Resource
from models.announcement import Announcement
from models.report_card import ReportCard
from models.lab_session import LabSession