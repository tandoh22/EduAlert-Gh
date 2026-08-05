"""
Seed script — populates the database with sample data for testing.
Run this once after setting up: python seed.py
"""
from database import SessionLocal, engine, Base
from models.all_models import (
    User, Student, Score, Attendance, Prediction,
    Class, Enrollment, Assignment, Submission,
    Quiz, QuizQuestion, LessonNote, Announcement, Resource
)
from core.security import hash_password
from datetime import date, timedelta, datetime
import random

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("Seeding EduAlert GH database...\n")

# 1. USERS — Teacher and Headmaster accounts
teacher = User(
    full_name="Mr. Kofi Mensah",
    email="teacher@edualert.gh",
    password_hash=hash_password("password123"),
    role="teacher",
    subject="Mathematics",
    school="Accra Academy"
)
db.add(teacher)

headmaster = User(
    full_name="Mrs. Abena Osei",
    email="admin@edualert.gh",
    password_hash=hash_password("password123"),
    role="admin",
    school="Accra Academy"
)
db.add(headmaster)
db.commit()
print("Users created (teacher + headmaster)")

student_user = User(
    full_name="Ama Boateng",
    email="student@edualert.gh",
    password_hash=hash_password("password123"),
    role="student",
    school="Accra Academy"
)
db.add(student_user)
db.commit()
print("Student login account created")

# 2. CLASS — Create a sample class
class_3b = Class(
    name="JHS 3B",
    level="JHS",
    year=2025,
    school="Accra Academy"
)
db.add(class_3b)
db.commit()
print("Class created (JHS 3B)")

# 3. STUDENTS — Create sample students
student_names = [
    ("Kwame Asante", "M"), ("Ama Boateng", "F"), ("Yaw Darko", "M"),
    ("Akosua Frimpong", "F"), ("Kojo Appiah", "M"), ("Efua Mensah", "F"),
    ("Kwesi Owusu", "M"), ("Adwoa Ntim", "F"), ("Fiifi Agyei", "M"),
    ("Abena Kyei", "F"),
]

students = []
for i, (name, gender) in enumerate(student_names):
    s = Student(
        full_name=name,
        student_id=f"ACC2025{i+1:03d}",
        class_name="JHS 3B",
        gender=gender,
        teacher_id=teacher.id,
        school="Accra Academy"
    )
    db.add(s)
    students.append(s)
db.commit()

students[1].user_id = student_user.id
db.commit()
print(f"{len(students)} students created")

# 4. ENROLLMENT — Enroll all students into the class
for student in students:
    enrollment = Enrollment(
        student_id=student.id,
        class_id=class_3b.id,
        subject="Mathematics",
        term="Term 1",
        year=2025
    )
    db.add(enrollment)
db.commit()
print(f"{len(students)} students enrolled in JHS 3B")

# 5. SCORES — Some students will look at-risk on purpose
subjects = ["Mathematics", "English", "Science", "Social Studies", "ICT"]
for i, student in enumerate(students):
    base_score = 35 if i < 3 else (55 if i < 6 else 75)
    for subject in subjects:
        for term in ["Term 1", "Term 2"]:
            score_val = max(10, min(100, base_score + random.randint(-15, 15)))
            db.add(Score(
                student_id=student.id,
                subject=subject,
                score=score_val,
                term=term,
                year=2025,
                exam_type="End of Term"
            ))
db.commit()
print("Scores recorded for all students (5 subjects x 2 terms)")

# 6. ATTENDANCE — First 3 students have low attendance
start_date = date(2025, 1, 6)
for i, student in enumerate(students):
    presence_prob = 0.5 if i < 3 else 0.85
    for day_offset in range(60):
        school_day = start_date + timedelta(days=day_offset)
        if school_day.weekday() >= 5:
            continue
        status = "present" if random.random() < presence_prob else "absent"
        db.add(Attendance(
            student_id=student.id,
            date=school_day,
            status=status,
            term="Term 1",
            year=2025,
        ))
db.commit()
print("Attendance records created (60 school days)")

# 7. ASSIGNMENT — Create a sample assignment with one submission
assignment = Assignment(
    title="Solving Linear Equations",
    description="Solve the 10 linear equations on page 45 of your Mathematics textbook. Show all working clearly.",
    subject="Mathematics",
    due_date=date(2025, 3, 15),
    class_id=class_3b.id,
    teacher_id=teacher.id
)
db.add(assignment)
db.commit()

submission = Submission(
    assignment_id=assignment.id,
    student_id=students[5].id,
    answer_text="1) x = 5  2) x = -3  3) x = 12  4) x = 7  5) x = -1 6) x = 9  7) x = 0  8) x = 4  9) x = -8  10) x = 6",
)
db.add(submission)
db.commit()
print("Sample assignment created with 1 submission")

# 8. QUIZ — Create a sample quiz with questions
quiz = Quiz(
    title="Algebra Basics Quiz",
    subject="Mathematics",
    topic="Linear Equations",
    class_id=class_3b.id,
    teacher_id=teacher.id,
    time_limit=20,
    is_published=True,
    due_date=datetime(2025, 3, 20, 14, 0)
)
db.add(quiz)
db.commit()

sample_questions = [
    {
        "question_text": "What is the value of x in 2x + 4 = 10?",
        "question_type": "mcq",
        "option_a": "2", "option_b": "3", "option_c": "4", "option_d": "5",
        "correct_answer": "B",
        "marks": 1, "order_num": 1
    },
    {
        "question_text": "True or False: A linear equation always has degree 1.",
        "question_type": "true_false",
        "option_a": "True", "option_b": "False",
        "correct_answer": "True",
        "marks": 1, "order_num": 2
    },
    {
        "question_text": "Explain what it means to 'solve' a linear equation.",
        "question_type": "short_answer",
        "correct_answer": "Finding the value of the unknown variable that makes the equation true.",
        "marks": 3, "order_num": 3
    },
]

for q in sample_questions:
    db.add(QuizQuestion(quiz_id=quiz.id, **q))
db.commit()
print(f"Sample quiz created with {len(sample_questions)} questions")

# 9. LESSON NOTE — Sample AI-style lesson note
lesson_note = LessonNote(
    title="Mathematics — Linear Equations",
    subject="Mathematics",
    topic="Linear Equations",
    class_level="JHS 3",
    content="LESSON NOTE\nSubject: Mathematics | Topic: Linear Equations | Class: JHS 3\n\nLEARNING OBJECTIVES\n1. Define a linear equation\n2. Solve simple linear equations in one variable\n3. Apply linear equations to real-life word problems",
    teacher_id=teacher.id,
    is_shared=True,
    source_file=None
)
db.add(lesson_note)
db.commit()
print("Sample lesson note created and shared with students")

# 10. ANNOUNCEMENT — Sample school-wide and class announcements
schoolwide_announcement = Announcement(
    title="Mid-Term Exams Schedule Released",
    body="Mid-term examinations will run from March 24th to March 28th. Please check the notice board for your timetable.",
    author_id=headmaster.id,
    is_schoolwide=True
)
db.add(schoolwide_announcement)

class_announcement = Announcement(
    title="Bring Your Calculator on Friday",
    body="All JHS 3B students should bring their calculators for Friday's Mathematics lesson on linear equations.",
    author_id=teacher.id,
    class_id=class_3b.id,
    is_schoolwide=False
)
db.add(class_announcement)
db.commit()
print("2 announcements created (1 school-wide, 1 class-specific)")

resources = [
    Resource(
        title="WASSCE Mathematics Past Questions",
        description="Past WASSCE questions from 2015 to 2024 with worked solutions.",
        subject="Mathematics",
        class_level="JHS",
        file_url="/resources/wassce-maths.pdf",
        file_type="PDF",
        uploaded_by=teacher.id,
        ai_summary="Covers algebra, geometry, and statistics with past WASSCE questions.",
    ),
    Resource(
        title="Science Practical Guide",
        description="Laboratory safety and practical procedures for JHS science.",
        subject="Science",
        class_level="JHS",
        file_url="/resources/science-practical.pdf",
        file_type="PDF",
        uploaded_by=teacher.id,
        ai_summary="Step-by-step guide to common JHS science practical experiments.",
    ),
]
for resource in resources:
    db.add(resource)
db.commit()
print(f"{len(resources)} resources created")

db.close()
print("DATABASE SEEDING COMPLETE")
print("\nTest accounts:")
print("  Teacher:   teacher@edualert.gh / password123")
print("  Admin:     admin@edualert.gh / password123")
print("  Student:   student@edualert.gh / password123")