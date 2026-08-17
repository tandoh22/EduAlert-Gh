"""
Seed script — populates the database with sample data for testing.
Run this once after setting up: python seed.py
"""
import random
from datetime import date, timedelta, datetime
from database import SessionLocal, engine, Base
from models.all_models import (
    User, Student, Score, Attendance, Prediction,
    Class, Enrollment, TeacherAssignment, Assignment, Submission,
    Quiz, QuizQuestion, QuizAttempt, QuizAnswer,
    LessonNote, StudyCardSet, Resource, Announcement, ReportCard
)
from core.security import hash_password
from ml.predictor import predict_student_risk

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("Seeding EduAlert GH database...\n")

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
teacher = User(
    full_name="Mr. Kofi Mensah",
    email="teacher@edualert.gh",
    password_hash=hash_password("password123"),
    role="teacher",
    status="approved",
    subject="Core Mathematics",
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

student_user = User(
    full_name="Kwame Mensah",
    email="student@edualert.gh",
    password_hash=hash_password("password123"),
    role="student",
    status="approved",
    school="Achimota Senior High School"
)
db.add(student_user)
db.commit()
db.refresh(teacher)
db.refresh(headmaster)
db.refresh(student_user)

print("[OK] Users created (teacher, headmaster, student)")

# 2. CLASS
class_2a = Class(
    name="Form 2 Science 1",
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
    term="Semester 2",
    year=2025
))
db.commit()
print("[OK] Teacher assigned to Form 2 Science 1")

# 3. STUDENTS
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
        class_name="Form 2 Science 1",
        gender=gender,
        teacher_id=teacher.id,
        user_id=u_id,
        school="Achimota Senior High School"
    )
    db.add(s)
    students.append(s)
db.commit()

for s in students:
    db.refresh(s)

print(f"[OK] {len(students)} students created (Kwame Mensah linked to student@edualert.gh)")

# 4. ENROLLMENTS
subjects = ["Biology", "Chemistry", "Physics", "Core Maths", "Elective Maths", "English", "Social Studies", "Integrated Science"]
for student in students:
    for subject in subjects:
        db.add(Enrollment(
            student_id=student.id,
            class_id=class_2a.id,
            subject=subject,
            term="Semester 2",
            year=2025
        ))
db.commit()
print(f"[OK] Students enrolled in {len(subjects)} subjects")

# 5. SCORES (including at-risk students like Akosua & Kojo)
for i, student in enumerate(students):
    # Akosua (index 1) & Kojo (index 4) are at-risk with low scores
    if i in [1, 4]:
        base = 42
    elif i in [2]:
        base = 65
    else:
        base = 80

    for subject in subjects:
        for term in ["Semester 1", "Semester 2"]:
            score_val = max(15, min(100, base + random.randint(-12, 12)))
            db.add(Score(
                student_id=student.id,
                subject=subject,
                score=score_val,
                term=term,
                year=2025,
                exam_type="Mid Semester" if term == "Semester 1" else "End of Semester"
            ))
db.commit()
print("[OK] Historical scores added")

# 6. ATTENDANCE (60 days)
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
            term="Semester 2",
            year=2025,
        ))
db.commit()
print("[OK] Attendance logs added")

# 7. PREDICTIONS (Early warning system results)
p1 = Prediction(
    student_id=students[1].id, # Akosua
    risk_level="High",
    confidence_score=0.91,
    reason="Low attendance (74%), declining Chemistry & Physics scores (<50%)",
    ai_suggestion="Akosua Frimpong is missing core science lessons. Recommend scheduling a 20-min catch-up session on redox reactions and contacting parent/guardian.",
    term="Semester 2",
    year=2025
)
p2 = Prediction(
    student_id=students[4].id, # Kojo
    risk_level="High",
    confidence_score=0.88,
    reason="Very low attendance (62%), failed 3 subjects",
    ai_suggestion="Kojo Antwi hasn't submitted the last 4 assignments. Recommend contacting guardian and arranging after-school remedial tutoring.",
    term="Semester 2",
    year=2025
)
p3 = Prediction(
    student_id=students[2].id, # Yaw Darko
    risk_level="Medium",
    confidence_score=0.68,
    reason="Slight downward score trend in Mathematics",
    ai_suggestion="Yaw Darko is experiencing a slight score drop in Core Maths. Monitor closely in class and provide extra practice problems.",
    term="Semester 2",
    year=2025
)
p4 = Prediction(
    student_id=students[0].id, # Kwame
    risk_level="Low",
    confidence_score=0.95,
    reason="High attendance (96%), excellent average score (82%)",
    ai_suggestion="Kwame Mensah is performing strongly. Encourage him to assist peers as a study mentor.",
    term="Semester 2",
    year=2025
)
db.add_all([p1, p2, p3, p4])
db.commit()
print("[OK] AI Risk predictions seeded (4 hand-authored)")

# The 4 above (indices 0, 1, 2, 4) already have hand-written predictions.
# Run the real predictor for everyone else so all 10 students are actually
# tracked, using the same logic the live "Run risk assessment" button uses.
already_predicted_indices = {0, 1, 2, 4}
for i, student in enumerate(students):
    if i in already_predicted_indices:
        continue
    student_scores = db.query(Score).filter(Score.student_id == student.id).all()
    student_attendance = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    result = predict_student_risk(student, student_scores, student_attendance)
    db.add(Prediction(
        student_id=student.id,
        risk_level=result["risk_level"],
        confidence_score=result["confidence"],
        reason=result["reason"],
        ai_suggestion=f"{student.full_name.split()[0]} should be monitored based on current attendance and score trends this term.",
        term="Semester 2",
        year=2025,
    ))
db.commit()
print("[OK] Risk predictions generated for the remaining students")

# 8. ASSIGNMENT & SUBMISSION
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

sub = Submission(
    assignment_id=assignment.id,
    student_id=students[0].id, # Kwame Mensah
    answer_text="Photosynthesis consists of light-dependent reactions taking place in the thylakoid membrane where light splits water releasing oxygen, ATP and NADPH. The Calvin cycle occurs in the stroma where ATP and NADPH fix carbon dioxide into G3P to produce glucose.",
    ai_feedback="Clear understanding of light reactions vs Calvin cycle. Great explanation of thylakoid membrane and stroma locations. Consider elaborating on RuBisCO enzyme role.",
    ai_score=88,
    teacher_score=90
)
db.add(sub)
db.commit()
print("[OK] Assignment and submission created")

# 9. QUIZZES & QUESTIONS
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

q1 = QuizQuestion(
    quiz_id=quiz.id,
    question_text="Which organelle is known as the powerhouse of the cell?",
    question_type="mcq",
    option_a="Nucleus", option_b="Mitochondria", option_c="Ribosome", option_d="Golgi Apparatus",
    correct_answer="B",
    marks=1, order_num=1
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
    title="Mid-Sem Exams Begin Next Monday",
    body="All Form 2 students should report to the exam hall by 7:45 AM. Ensure you bring your government-issued ID cards and student tablets.",
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
print("[OK] Announcements created")

# 14. REPORT CARD
rc = ReportCard(
    student_id=students[0].id, # Kwame Mensah
    term="Semester 2",
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