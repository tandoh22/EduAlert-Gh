from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.user import User
from models.student import Student
from models.enrollment import Enrollment
from models.class_model import Class
from models.teacher_assignment import TeacherAssignment
from schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, ApproveUserRequest
from core.security import hash_password, verify_password, create_access_token
from core.dependencies import require_admin

router = APIRouter()


def _build_user_response(user: User, db: Session) -> dict:
    data = {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "subject": user.subject,
        "school": user.school,
        "created_at": user.created_at,
        "student_id": None,
        "class_id": None,
        "class_name": None,
        "admitted_course": None,
    }
    if user.role == "student":
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student:
            data["student_id"] = student.student_id or f"ACH2025{student.id:03d}"
            data["class_name"] = student.class_name
            data["admitted_course"] = student.admitted_course
            enrollment = (
                db.query(Enrollment)
                .filter(Enrollment.student_id == student.id)
                .first()
            )
            if enrollment:
                data["class_id"] = enrollment.class_id
            elif student.class_name and student.class_name != "Unassigned":
                cls = db.query(Class).filter(Class.name == student.class_name).first()
                if cls:
                    data["class_id"] = cls.id
    return data


@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if user_data.role not in ("student", "teacher"):
        raise HTTPException(
            status_code=400,
            detail="Only student or teacher accounts can self-register.",
        )

    if user_data.role == "student" and not user_data.admitted_course:
        raise HTTPException(status_code=400, detail="Please select the course you were admitted into.")

    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        status="pending",
        subject=user_data.subject,
        school=user_data.school,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Students need a linked profile row, or the dashboard has nothing to fetch.
    # class_name is a required column on Student — "Unassigned" holds the spot
    # until the student self-enrolls into an actual class.
    if new_user.role == "student":
        new_student = Student(
            full_name=new_user.full_name,
            class_name="Unassigned",
            admitted_course=user_data.admitted_course,
            school=new_user.school,
            user_id=new_user.id,
        )
        db.add(new_student)
        db.commit()

    # No token here — the account is pending until the headmaster approves it.
    return _build_user_response(new_user, db)


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if user.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval from the headmaster.",
        )
    if user.status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account request was declined. Contact your school administrator.",
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _build_user_response(user, db),
    }


@router.get("/pending-users", response_model=List[UserResponse])
def list_pending_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Headmaster-only: accounts awaiting approval."""
    pending = db.query(User).filter(User.status == "pending").all()
    return [_build_user_response(u, db) for u in pending]


@router.post("/approve-user/{user_id}")
def approve_user(
    user_id: int,
    data: ApproveUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Headmaster-only: approve a pending account.

    Students just get approved — they pick their own class afterward
    via self-enrollment, based on their admitted course and elective
    preference. Teachers still get assigned to specific classes here,
    each with the subject they teach in that class.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # These are placeholders until the app has a real "current term" setting.
    TERM, YEAR = "Semester 2", 2025

    if user.role == "teacher":
        if not data.assignments:
            raise HTTPException(status_code=400, detail="Select at least one class before approving.")

        class_ids = [a.class_id for a in data.assignments]
        classes = db.query(Class).filter(Class.id.in_(class_ids)).all()
        classes_by_id = {c.id: c for c in classes}
        if len(classes) != len(set(class_ids)):
            raise HTTPException(status_code=404, detail="One or more selected classes were not found.")

        for pick in data.assignments:
            target_class = classes_by_id[pick.class_id]
            if not pick.subject:
                raise HTTPException(status_code=400, detail=f"Choose a subject for {target_class.name}.")
            if pick.subject not in target_class.subjects:
                raise HTTPException(
                    status_code=400,
                    detail=f"'{pick.subject}' is not offered in {target_class.name}.",
                )
            already_assigned = db.query(TeacherAssignment).filter(
                TeacherAssignment.teacher_id == user.id,
                TeacherAssignment.class_id == target_class.id,
                TeacherAssignment.subject == pick.subject,
            ).first()
            if not already_assigned:
                db.add(TeacherAssignment(
                    teacher_id=user.id,
                    class_id=target_class.id,
                    subject=pick.subject,
                    term=TERM,
                    year=YEAR,
                ))

    if user.role == "student":
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student and not student.student_id:
            student.student_id = f"ACH2025{student.id:03d}"

    user.status = "approved"
    db.commit()
    return {"message": "User approved", "user_id": user_id}


@router.post("/reject-user/{user_id}")
def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Headmaster-only: decline a pending account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "rejected"
    db.commit()
    return {"message": "User rejected", "user_id": user_id}