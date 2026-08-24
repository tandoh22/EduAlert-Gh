from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.class_model import Class
from models.enrollment import Enrollment
from schemas.class_schema import ClassCreate, ClassUpdate, ClassResponse
from schemas.enrollment import EnrollmentCreate, EnrollmentResponse
from core.dependencies import require_teacher, require_admin, get_current_user
from models.user import User

router = APIRouter()

@router.post("/", response_model=ClassResponse, status_code=201)
def create_class(
    data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Headmaster creates a new class e.g. JHS 2B, SHS 1A."""
    new_class = Class(**data.dict())
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class

@router.get("/", response_model=List[ClassResponse])
def get_all_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all classes in the school."""
    return db.query(Class).all()

@router.get("/my-classes")
def get_my_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Get all classes and assigned subjects for the current teacher."""
    from models.teacher_assignment import TeacherAssignment
    
    if current_user.role == "admin":
        classes = db.query(Class).all()
        return [
            {
                "id": c.id,
                "name": c.name,
                "code": c.code,
                "level": c.level,
                "course": c.course,
                "year": c.year,
                "school": c.school,
                "subjects": c.subjects
            }
            for c in classes
        ]
        
    assignments = (
        db.query(TeacherAssignment, Class)
        .join(Class, TeacherAssignment.class_id == Class.id)
        .filter(TeacherAssignment.teacher_id == current_user.id)
        .all()
    )
    
    classes_map = {}
    for ta, c in assignments:
        if c.id not in classes_map:
            classes_map[c.id] = {
                "id": c.id,
                "name": c.name,
                "code": c.code,
                "level": c.level,
                "course": c.course,
                "year": c.year,
                "school": c.school,
                "subjects": []
            }
        if ta.subject and ta.subject not in classes_map[c.id]["subjects"]:
            classes_map[c.id]["subjects"].append(ta.subject)
            
    return list(classes_map.values())

@router.get("/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single class by ID."""
    class_ = db.query(Class).filter(Class.id == class_id).first()
    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")
    return class_

@router.put("/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: int,
    data: ClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Headmaster updates a class."""
    class_ = db.query(Class).filter(Class.id == class_id).first()
    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(class_, field, value)
    db.commit()
    db.refresh(class_)
    return class_

@router.delete("/{class_id}", status_code=204)
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Headmaster deletes a class."""
    class_ = db.query(Class).filter(Class.id == class_id).first()
    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(class_)
    db.commit()

@router.post("/enroll", response_model=EnrollmentResponse, status_code=201)
def enroll_student(
    data: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Enroll a student into a class."""
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == data.student_id,
        Enrollment.class_id == data.class_id,
        Enrollment.term == data.term,
        Enrollment.year == data.year
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled in this class")
    enrollment = Enrollment(**data.dict())
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment

@router.get("/{class_id}/students", response_model=List[EnrollmentResponse])
def get_class_students(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Get all students enrolled in a class."""
    return db.query(Enrollment).filter(Enrollment.class_id == class_id).all()