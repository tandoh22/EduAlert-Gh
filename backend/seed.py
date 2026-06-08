"""
Seed script — populates the database with sample data for testing.
Run this once after setting up: python seed.py
"""
from database import SessionLocal, engine, Base
from models.user import User
from models.student import Student
from models.score import Score
from models.attendance import Attendance
from core.security import hash_password
from datetime import date, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("🌱 Seeding EduAlert GH database...")

# --- Create a teacher account ---
teacher = User(
    full_name     = "Mr. Kofi Mensah",
    email         = "teacher@edualert.gh",
    password_hash = hash_password("password123"),
    role          = "teacher",
    subject       = "Mathematics",
    school        = "Accra Academy"
)
db.add(teacher)

# --- Create a headmaster account ---
headmaster = User(
    full_name     = "Mrs. Abena Osei",
    email         = "admin@edualert.gh",
    password_hash = hash_password("password123"),
    role          = "admin",
    school        = "Accra Academy"
)
db.add(headmaster)
db.commit()

# --- Create sample students ---
student_names = [
    ("Kwame Asante", "M"), ("Ama Boateng", "F"), ("Yaw Darko", "M"),
    ("Akosua Frimpong", "F"), ("Kojo Appiah", "M"), ("Efua Mensah", "F"),
    ("Kwesi Owusu", "M"), ("Adwoa Ntim", "F"), ("Fiifi Agyei", "M"),
    ("Abena Kyei", "F"),
]

students = []
for i, (name, gender) in enumerate(student_names):
    s = Student(
        full_name  = name,
        student_id = f"ACC2025{i+1:03d}",
        class_name = "JHS 3B",
        gender     = gender,
        teacher_id = teacher.id,
        school     = "Accra Academy"
    )
    db.add(s)
    students.append(s)
db.commit()

# --- Add scores (some students will look at-risk) ---
subjects = ["Mathematics", "English", "Science", "Social Studies", "ICT"]
for i, student in enumerate(students):
    # First 3 students will be high/medium risk (low scores)
    base_score = 35 if i < 3 else (55 if i < 6 else 75)

    for subject in subjects:
        for term in ["Term 1", "Term 2"]:
            score_val = max(10, min(100, base_score + random.randint(-15, 15)))
            db.add(Score(
                student_id = student.id,
                subject    = subject,
                score      = score_val,
                term       = term,
                year       = 2025,
                exam_type  = "End of Term"
            ))

# --- Add attendance (first 3 students have low attendance) ---
start_date = date(2025, 1, 6)
for i, student in enumerate(students):
    presence_prob = 0.5 if i < 3 else 0.85  # at-risk students skip more
    for day_offset in range(60):
        school_day = start_date + timedelta(days=day_offset)
        if school_day.weekday() >= 5:
            continue  # skip weekends
        status = "present" if random.random() < presence_prob else "absent"
        db.add(Attendance(
            student_id = student.id,
            date       = school_day,
            status     = status,
            term       = "Term 1",
            year       = 2025,
        ))

db.commit()
db.close()

print("✅ Done! Sample accounts created:")
print("   Teacher  → teacher@edualert.gh  / password123")
print("   Admin    → admin@edualert.gh    / password123")
print(f"   {len(students)} students seeded in class JHS 3B")
