"""
Fixed SHS course -> subjects mapping, based on the school's official
combination structure (see COURSES - subjects reference).

Used to determine which subjects are available for a class once it's
been assigned a course, e.g. for enrolling students or picking which
subject a teacher is assigned to teach in that class.
"""

COURSE_SUBJECTS = {
    "Science 1": [
        "Core Mathematics", "Social Studies", "English", "Integrated Science",
        "Biology", "Chemistry", "Physics", "Elective Math",
    ],
    "Science 2": [
        "Core Mathematics", "Social Studies", "English", "Integrated Science",
        "Geography", "Chemistry", "Physics", "Elective Math",
    ],
    "Science 3": [
        "Core Mathematics", "Social Studies", "English", "Integrated Science",
        "Elective ICT", "Chemistry", "Physics", "Elective Math",
    ],
    "Arts 1": [
        "Core Mathematics", "Social Studies", "English", "Integrated Science",
        "Government", "History", "CRS", "Literature",
    ],
    "Arts 2": [
        "Core Mathematics", "Social Studies", "English", "Integrated Science",
        "Elective Math", "Economics", "Geography", "Elective ICT / GKA",
    ],
    "Arts 3": [
        "Core Mathematics", "Social Studies", "English", "Integrated Science",
        "Government", "Economics", "Geography", "Music / French",
    ],
    "Visual Arts 1": [
        "Core Mathematics", "Social Studies", "English", "Integrated Science",
        "Graphic Design", "GKA", "Ceramics", "Painting / Sculpture",
    ],
    "Visual Arts 2": [
        "Core Mathematics", "Social Studies", "English", "Integrated Science",
        "Graphic Design", "Leather Work", "Ceramics", "Elective Math / Economics",
    ],
    "Business 1": [
        "Core Mathematics", "Social Studies", "English", "Integrated Science",
        "Elective Math", "Business Management", "Economics", "Financial Accounting",
    ],
    "Business 2": [
        "Core Mathematics", "Social Studies", "English", "Integrated Science",
        "Cost Accounting", "Business Management", "Economics", "Financial Accounting",
    ],
    "Home Economics": [
        "Core Mathematics", "Social Studies", "English", "Integrated Science",
        "Management in Living", "Food and Nutrition", "Clothing and Textiles", "Biology / Economics",
    ],
}

COURSE_NAMES = list(COURSE_SUBJECTS.keys())

# The broad course a student is admitted into (chosen at registration).
# Each maps to the specific class combinations under it — a student picks
# their exact class themselves later, based on elective preference, but
# only from classes that fall under their admitted course.
BROAD_COURSE_TO_CLASS_COURSES = {
    "General Science": ["Science 1", "Science 2", "Science 3"],
    "General Arts": ["Arts 1", "Arts 2", "Arts 3"],
    "Visual Arts": ["Visual Arts 1", "Visual Arts 2"],
    "General Business": ["Business 1", "Business 2"],
    "Home Economics": ["Home Economics"],
}

BROAD_COURSES = list(BROAD_COURSE_TO_CLASS_COURSES.keys())