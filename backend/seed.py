"""
Seed script — populates the database with sample data for testing.
Run this once after setting up: python seed.py
"""
import random
from datetime import date, timedelta, datetime
from database import SessionLocal, engine, Base
from models.all_models import (
    User, Student, Score, Attendance, Prediction,
<<<<<<< HEAD
    Class, Enrollment, TeacherAssignment, Assignment, Submission,
    Quiz, QuizQuestion, QuizAttempt, QuizAnswer,
    LessonNote, StudyCardSet, Resource, Announcement, ReportCard
=======
    Class, Enrollment, Assignment, Submission,
    Quiz, QuizQuestion, LessonNote, Announcement, Resource
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
)
from core.security import hash_password

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("Seeding EduAlert GH database...\n")

<<<<<<< HEAD
# Clear existing tables for clean seed run if needed
db.query(QuizAnswer).delete()
db.query(QuizAttempt).delete()
db.query(QuizQuestion).delete()
db.query(Quiz).delete()
db.query(Submission).delete()
db.query(Assignment).delete()
db.query(LessonNote).delete()
db.query(StudyCardSet).delete()
db.query(Resource).delete()
db.query(Announcement).delete()
db.query(ReportCard).delete()
db.query(Prediction).delete()
db.query(Score).delete()
db.query(Attendance).delete()
db.query(TeacherAssignment).delete()
db.query(Enrollment).delete()
db.query(Student).delete()
db.query(Class).delete()
db.query(User).delete()
db.commit()

# 1. USERS — Teacher, Headmaster, and Student accounts
=======
# 1. USERS — Teacher and Headmaster accounts
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
teacher = User(
    full_name="Mr. Kofi Mensah",
    email="teacher@edualert.gh",
    password_hash=hash_password("password123"),
    role="teacher",
    status="approved",
    subject="Mathematics",
    school="Achimota Senior High School"
)
db.add(teacher)

headmaster = User(
    full_name="Mrs. Abena Osei",
    email="admin@edualert.gh",
    password_hash=hash_password("password123"),
    role="admin",
    status="approved",
    school="Achimota Senior High School"
)
db.add(headmaster)
<<<<<<< HEAD

student_user = User(
    full_name="Kwame Mensah",
    email="student@edualert.gh",
    password_hash=hash_password("password123"),
    role="student",
    status="approved",
    school="Achimota Senior High School"
=======
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
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
)
db.add(student_user)
db.commit()
<<<<<<< HEAD
db.refresh(teacher)
db.refresh(headmaster)
db.refresh(student_user)

print("[OK] Users created (teacher, headmaster, student)")

# 2. CLASS
class_2a = Class(
    name="Form 2 Science A",
    level="SHS",
    course="Science 1",
    year=2025,
    school="Achimota Senior High School"
)
db.add(class_2a)
db.commit()
db.refresh(class_2a)
print("[OK] Class created (Form 2 Science A)")

db.add(TeacherAssignment(
    teacher_id=teacher.id,
    class_id=class_2a.id,
    subject=teacher.subject,
    term="Term 2",
    year=2025
))
db.commit()
print("[OK] Teacher assigned to Form 2 Science A")

# 3. STUDENTS
=======
print("Class created (JHS 3B)")

# 3. STUDENTS — Create sample students
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
student_names = [
    ("Kwame Mensah", "M", student_user.id),
    ("Akosua Frimpong", "F", None),
    ("Yaw Darko", "M", None),
    ("Efua Sarpong", "F", None),
    ("Kojo Antwi", "M", None),
    ("Adjoa Boateng", "F", None),
    ("Kwesi Owusu", "M", None),
    ("Ama Eduful", "F", None),
    ("Fiifi Agyei", "M", None),
    ("Abena Kyei", "F", None),
]

students = []
for i, (name, gender, u_id) in enumerate(student_names):
    s = Student(
        full_name=name,
        student_id=f"ACH2025{i+1:03d}",
        class_name="Form 2 Science A",
        gender=gender,
        teacher_id=teacher.id,
        user_id=u_id,
        school="Achimota Senior High School"
    )
    db.add(s)
    students.append(s)
db.commit()

<<<<<<< HEAD
for s in students:
    db.refresh(s)

print(f"[OK] {len(students)} students created (Kwame Mensah linked to student@edualert.gh)")

# 4. ENROLLMENTS
subjects = ["Biology", "Chemistry", "Physics", "Core Maths", "Elective Maths", "English", "Science"]
=======
students[1].user_id = student_user.id
db.commit()
print(f"{len(students)} students created")

# 4. ENROLLMENT — Enroll all students into the class
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
for student in students:
    for subject in subjects:
        db.add(Enrollment(
            student_id=student.id,
            class_id=class_2a.id,
            subject=subject,
            term="Term 2",
            year=2025
        ))
db.commit()
<<<<<<< HEAD
print(f"[OK] Students enrolled in {len(subjects)} subjects")

# 5. SCORES (including at-risk students like Akosua & Kojo)
=======
print(f"{len(students)} students enrolled in JHS 3B")

# 5. SCORES — Some students will look at-risk on purpose
subjects = ["Mathematics", "English", "Science", "Social Studies", "ICT"]
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
for i, student in enumerate(students):
    # Akosua (index 1) & Kojo (index 4) are at-risk with low scores
    if i in [1, 4]:
        base = 42
    elif i in [2]:
        base = 65
    else:
        base = 80

    for subject in subjects:
        for term in ["Term 1", "Term 2"]:
            score_val = max(15, min(100, base + random.randint(-12, 12)))
            db.add(Score(
                student_id=student.id,
                subject=subject,
                score=score_val,
                term=term,
                year=2025,
                exam_type="Mid Term" if term == "Term 1" else "End of Term"
            ))
db.commit()
<<<<<<< HEAD
print("[OK] Historical scores added")

# 6. ATTENDANCE (60 days)
=======
print("Scores recorded for all students (5 subjects x 2 terms)")

# 6. ATTENDANCE — First 3 students have low attendance
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
start_date = date(2025, 1, 6)
for i, student in enumerate(students):
    presence_prob = 0.62 if i in [1, 4] else 0.94
    for day_offset in range(40):
        school_day = start_date + timedelta(days=day_offset)
        if school_day.weekday() >= 5:
            continue
        status = "present" if random.random() < presence_prob else "absent"
        db.add(Attendance(
            student_id=student.id,
            date=school_day,
            status=status,
            term="Term 2",
            year=2025,
        ))
db.commit()
<<<<<<< HEAD
print("[OK] Attendance logs added")

# 7. PREDICTIONS (Early warning system results)
p1 = Prediction(
    student_id=students[1].id, # Akosua
    risk_level="High",
    confidence_score=0.91,
    reason="Low attendance (74%), declining Chemistry & Physics scores (<50%)",
    ai_suggestion="Akosua Frimpong is missing core science lessons. Recommend scheduling a 20-min catch-up session on redox reactions and contacting parent/guardian.",
    term="Term 2",
    year=2025
)
p2 = Prediction(
    student_id=students[4].id, # Kojo
    risk_level="High",
    confidence_score=0.88,
    reason="Very low attendance (62%), failed 3 subjects",
    ai_suggestion="Kojo Antwi hasn't submitted the last 4 assignments. Recommend contacting guardian and arranging after-school remedial tutoring.",
    term="Term 2",
    year=2025
)
p3 = Prediction(
    student_id=students[2].id, # Yaw Darko
    risk_level="Medium",
    confidence_score=0.68,
    reason="Slight downward score trend in Mathematics",
    ai_suggestion="Yaw Darko is experiencing a slight score drop in Core Maths. Monitor closely in class and provide extra practice problems.",
    term="Term 2",
    year=2025
)
p4 = Prediction(
    student_id=students[0].id, # Kwame
    risk_level="Low",
    confidence_score=0.95,
    reason="High attendance (96%), excellent average score (82%)",
    ai_suggestion="Kwame Mensah is performing strongly. Encourage him to assist peers as a study mentor.",
    term="Term 2",
    year=2025
)
db.add_all([p1, p2, p3, p4])
db.commit()
print("[OK] AI Risk predictions seeded")

# 8. ASSIGNMENT & SUBMISSION
=======
print("Attendance records created (60 school days)")

# 7. ASSIGNMENT — Create a sample assignment with one submission
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
assignment = Assignment(
    title="Photosynthesis Lab Report & Diagram Analysis",
    description="Explain the light-dependent and light-independent reactions of photosynthesis. Draw the Calvin cycle diagram and answer questions 1-5.",
    subject="Biology",
    due_date=date(2025, 7, 30),
    class_id=class_2a.id,
    teacher_id=teacher.id
)
db.add(assignment)
db.commit()
db.refresh(assignment)

<<<<<<< HEAD
sub = Submission(
    assignment_id=assignment.id,
    student_id=students[0].id, # Kwame Mensah
    answer_text="Photosynthesis consists of light-dependent reactions taking place in the thylakoid membrane where light splits water releasing oxygen, ATP and NADPH. The Calvin cycle occurs in the stroma where ATP and NADPH fix carbon dioxide into G3P to produce glucose.",
    ai_feedback="Clear understanding of light reactions vs Calvin cycle. Great explanation of thylakoid membrane and stroma locations. Consider elaborating on RuBisCO enzyme role.",
    ai_score=88,
    teacher_score=90
=======
submission = Submission(
    assignment_id=assignment.id,
    student_id=students[5].id,
    answer_text="1) x = 5  2) x = -3  3) x = 12  4) x = 7  5) x = -1 6) x = 9  7) x = 0  8) x = 4  9) x = -8  10) x = 6",
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
)
db.add(sub)
db.commit()
<<<<<<< HEAD
print("[OK] Assignment and submission created")

# 9. QUIZZES & QUESTIONS
=======
print("Sample assignment created with 1 submission")

# 8. QUIZ — Create a sample quiz with questions
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
quiz = Quiz(
    title="Cell Biology Quick Check",
    subject="Biology",
    topic="Cell Structure & Organelles",
    class_id=class_2a.id,
    teacher_id=teacher.id,
    time_limit=15,
    is_published=True,
    due_date=datetime(2025, 8, 5, 14, 0)
)
db.add(quiz)
db.commit()
db.refresh(quiz)

<<<<<<< HEAD
q1 = QuizQuestion(
    quiz_id=quiz.id,
    question_text="Which organelle is known as the powerhouse of the cell?",
    question_type="mcq",
    option_a="Nucleus", option_b="Mitochondria", option_c="Ribosome", option_d="Golgi Apparatus",
    correct_answer="B",
    marks=1, order_num=1
=======
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
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
)
q2 = QuizQuestion(
    quiz_id=quiz.id,
    question_text="True or False: Plant cells contain chloroplasts while animal cells do not.",
    question_type="true_false",
    option_a="True", option_b="False",
    correct_answer="True",
    marks=1, order_num=2
)
q3 = QuizQuestion(
    quiz_id=quiz.id,
    question_text="State the function of the cell membrane and describe semi-permeability.",
    question_type="short_answer",
    correct_answer="The cell membrane controls the movement of substances in and out of the cell. Semi-permeability allows certain molecules to pass while blocking others.",
    marks=3, order_num=3
)
db.add_all([q1, q2, q3])
db.commit()
<<<<<<< HEAD
print("[OK] Sample quiz with 3 questions created")

# 10. LESSON NOTES
n1 = LessonNote(
    title="Introduction to Photosynthesis",
    subject="Biology",
    topic="Photosynthesis & Cellular Respiration",
    class_level="SHS 2",
    content="""LESSON NOTE
Subject: Biology | Topic: Photosynthesis | Class: SHS 2
Duration: 80 minutes

LEARNING OBJECTIVES:
1. Explain the word and chemical equations for photosynthesis.
2. Differentiate between light-dependent and light-independent stages.
3. Identify factors affecting the rate of photosynthesis.

INTRODUCTION:
Ask students why plants are green and how autotrophs produce energy from sunlight.

MAIN CONTENT:
Photosynthesis is the process by which green plants synthesize carbohydrates from carbon dioxide and water using light energy absorbed by chlorophyll.

Equation: 6CO2 + 6H2O + light --> C6H12O6 + 6O2

WORKED EXAMPLES:
Calculate the mass of glucose produced from 264g of CO2 assuming 100% reaction efficiency.

HOMEWORK:
Complete Questions 1 to 5 on page 84 of NaCCA Biology Textbook.""",
    teacher_id=teacher.id,
    is_shared=True
)
db.add(n1)
db.commit()
print("[OK] Shared lesson note created")

# 11. STUDY CARDS
sc = StudyCardSet(
    title="Balancing Chemical Equations & Redox",
    subject="Chemistry",
    topic="Redox Reactions",
    student_id=students[0].id,
    cards=[
        {"question": "What is Oxidation in terms of electrons?", "answer": "Oxidation is the loss of electrons (OIL RIG)."},
        {"question": "What is Reduction in terms of oxidation state?", "answer": "Reduction is a decrease in oxidation state."},
        {"question": "What is an Oxidizing Agent?", "answer": "A substance that gains electrons and is reduced itself."},
        {"question": "What is the oxidation number of oxygen in H2O?", "answer": "-2"},
        {"question": "Balance: Fe + O2 -> Fe2O3", "answer": "4Fe + 3O2 -> 2Fe2O3"},
    ]
)
db.add(sc)
db.commit()
print("[OK] Study cards set created")

# 12. RESOURCES
r1 = Resource(
    title="NaCCA Senior High School Biology Syllabus",
    description="Official Ghana Education Service curriculum outline for Form 1 to Form 3 Biology.",
    subject="Biology",
    class_level="SHS 1-3",
    file_url="https://edualert.gh/files/biology_syllable_nacca.pdf",
    file_type="pdf",
    ai_summary="Comprehensive 3-year SHS syllabus detailing learning indicators, core competencies, and assessment schemes for Ghanaian biology students.",
    uploaded_by=teacher.id
)
db.add(r1)
db.commit()
print("[OK] Learning resource created")

# 13. ANNOUNCEMENTS
a1 = Announcement(
    title="Mid-term Exams Begin Next Monday",
    body="All Form 2 students should report to the exam hall by 7:45 AM. Ensure you bring your government-issued ID cards and student tablets.",
=======
print("Sample lesson note created and shared with students")

# 10. ANNOUNCEMENT — Sample school-wide and class announcements
schoolwide_announcement = Announcement(
    title="Mid-Term Exams Schedule Released",
    body="Mid-term examinations will run from March 24th to March 28th. Please check the notice board for your timetable.",
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
    author_id=headmaster.id,
    is_schoolwide=True
)
a2 = Announcement(
    title="Biology Field Trip Permission Slips Due",
    body="Please return signed permission slips to Mr. Mensah before Friday afternoon.",
    author_id=teacher.id,
    class_id=class_2a.id,
    is_schoolwide=False
)
db.add_all([a1, a2])
db.commit()
<<<<<<< HEAD
print("[OK] Announcements created")

# 14. REPORT CARD
rc = ReportCard(
    student_id=students[0].id, # Kwame Mensah
    term="Term 2",
    year=2025,
    overall_average=82.4,
    attendance_rate=96.0,
    ai_comment="Kwame has demonstrated exceptional diligence in Biology and Mathematics this term. His active participation and lab work show great dedication. To reach peak performance, focus on reviewing advanced redox calculations in Chemistry.",
    teacher_comment="Kwame has demonstrated exceptional diligence in Biology and Mathematics this term. His active participation and lab work show great dedication. To reach peak performance, focus on reviewing advanced redox calculations in Chemistry.",
    approved="approved"
)
db.add(rc)
db.commit()
print("[OK] Report card created")

db.close()

print("\n==================================================")
print("DATABASE SEEDING COMPLETE SUCCESSFULLY!")
print("==================================================")
print("\nTest Login Credentials:")
print("  Student   -> student@edualert.gh / password123")
print("  Teacher   -> teacher@edualert.gh / password123")
print("  Headmaster-> admin@edualert.gh   / password123")
print("==================================================")
=======
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
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
