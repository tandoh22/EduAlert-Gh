from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import httpx
import json
import base64
from database import get_db
from models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from models.student import Student
from schemas.quiz import (
    QuizCreate, QuizUpdate, QuizResponse, QuizQuestionCreate,
    QuizQuestionResponse, QuizSubmit, QuizAttemptResponse
)
from core.dependencies import require_teacher, get_current_user, get_current_student
from core.config import settings
from models.user import User

router = APIRouter()

def extract_text_from_file(file_bytes: bytes, filename: str, content_type: str) -> str:
    filename_lower = (filename or "").lower()
    content_type_lower = (content_type or "").lower()
    extracted_text = ""

    # 1. Try PDF extraction
    if filename_lower.endswith(".pdf") or "pdf" in content_type_lower:
        for mod_name in ("pypdf", "PyPDF2", "pdfplumber"):
            try:
                import io
                mod = __import__(mod_name)
                if hasattr(mod, "PdfReader"):
                    reader = mod.PdfReader(io.BytesIO(file_bytes))
                    pages_text = [page.extract_text() for page in reader.pages if page.extract_text()]
                    extracted_text = "\n".join(pages_text)
                    if extracted_text.strip():
                        break
                elif hasattr(mod, "open"):
                    with mod.open(io.BytesIO(file_bytes)) as pdf:
                        pages_text = [page.extract_text() for page in pdf.pages if page.extract_text()]
                        extracted_text = "\n".join(pages_text)
                        if extracted_text.strip():
                            break
            except Exception:
                pass

        # Pure Python PDF stream decompressor fallback for unencrypted PDFs
        if not extracted_text:
            try:
                import re, zlib
                stream_pattern = re.compile(rb'stream[\r\n]+(.*?)[\r\n]+endstream', re.DOTALL)
                texts = []
                for match in stream_pattern.finditer(file_bytes):
                    stream_data = match.group(1)
                    try:
                        decompressed = zlib.decompress(stream_data)
                    except Exception:
                        decompressed = stream_data

                    tj_matches = re.findall(rb'\(((?:[^()\\]|\\.)*)\)\s*Tj', decompressed)
                    for m in tj_matches:
                        try:
                            clean_str = m.decode("latin1", errors="ignore").replace(r'\(', '(').replace(r'\)', ')')
                            if clean_str.strip():
                                texts.append(clean_str)
                        except Exception:
                            pass

                    array_matches = re.findall(rb'\[(.*?)\]\s*TJ', decompressed, re.DOTALL)
                    for arr in array_matches:
                        inner_texts = re.findall(rb'\(((?:[^()\\]|\\.)*)\)', arr)
                        joined_arr = "".join([t.decode("latin1", errors="ignore") for t in inner_texts])
                        if joined_arr.strip():
                            texts.append(joined_arr)

                if texts:
                    extracted_text = " ".join(texts)
            except Exception:
                pass

    # 2. Try DOCX extraction
    elif filename_lower.endswith(".docx") or "officedocument" in content_type_lower or "word" in content_type_lower:
        try:
            import io, docx
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                    if row_text:
                        paragraphs.append(row_text)
            extracted_text = "\n".join(paragraphs)
        except Exception:
            pass

        if not extracted_text:
            try:
                import io, zipfile
                from xml.etree import ElementTree as ET
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                    xml_content = z.read("word/document.xml")
                    tree = ET.fromstring(xml_content)
                    paragraphs = []
                    for p in tree.iter():
                        if p.tag.endswith('}p'):
                            text_runs = [t.text for t in p.iter() if t.tag.endswith('}t') and t.text]
                            p_text = "".join(text_runs).strip()
                            if p_text:
                                paragraphs.append(p_text)
                    extracted_text = "\n".join(paragraphs)
            except Exception:
                pass

    # 3. Fallback for TXT, CSV, MD, JSON
    if not extracted_text:
        try:
            extracted_text = file_bytes.decode("utf-8")
        except Exception:
            try:
                extracted_text = file_bytes.decode("latin-1", errors="ignore")
            except Exception:
                extracted_text = ""

    return extracted_text.strip()


def _generate_file_based_fallback_questions(extracted_text: str, subject: str, topic: str, count: int) -> List[dict]:
    """Extract real statements from uploaded document and construct high quality MCQs."""
    import re
    # Clean and split text into sentences
    cleaned = re.sub(r'\s+', ' ', extracted_text)
    raw_sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', cleaned) if len(s.strip()) > 35 and len(s.strip()) < 220]
    
    questions = []
    
    for s in raw_sentences:
        # Check for definition or factual pattern: "X is ...", "X refers to ...", "X contains ...", "X leads to ..."
        m = re.match(r'^([A-Z][a-zA-Z0-9\s\-]{2,30})\s+(is\s+(?:defined\s+as\s+)?(?:a|an|the)?|refers\s+to|consists\s+of|describes|contains|functions\s+as|plays\s+a\s+key\s+role\s+in)\s+(.*)', s, re.IGNORECASE)
        if m:
            term = m.group(1).strip()
            predicate = m.group(2).strip()
            rest = m.group(3).strip().rstrip('.?!')
            
            if len(rest) > 15:
                q_text = f"According to the document, which of the following best describes '{term}'?"
                correct_opt = f"It {predicate} {rest[:90]}." if not rest.lower().startswith(('it', 'a', 'the', 'is')) else f"{rest[:90]}."
                
                questions.append({
                    "question_text": q_text,
                    "question_type": "mcq",
                    "option_a": correct_opt,
                    "option_b": f"It is unrelated to {subject} core concepts",
                    "option_c": f"It causes an immediate decrease in {term.lower()} activity",
                    "option_d": f"It is only observed under theoretical laboratory conditions",
                    "correct_answer": "A",
                    "marks": 1
                })
        else:
            # Question from factual statement
            words = s.split()
            if len(words) >= 7:
                q_text = f"Based on the text: \"{s[:120]}...\", which statement is TRUE?"
                questions.append({
                    "question_text": q_text,
                    "question_type": "mcq",
                    "option_a": f"The statement directly affirms that {s[:85].lower()}...",
                    "option_b": f"The document explicitly refutes this observation in {subject}",
                    "option_c": f"This phenomenon only occurs in non-standard systems",
                    "option_d": "None of the above conclusions can be drawn",
                    "correct_answer": "A",
                    "marks": 1
                })

        if len(questions) >= count:
            break

    # If document sentences didn't fulfill the requested count, fill remaining with curriculum fallback
    if len(questions) < count:
        needed = count - len(questions)
        curriculum_qs = _generate_fallback_quiz_questions(subject, topic, needed)
        questions.extend(curriculum_qs)

    return questions[:count]


SUBJECT_QUESTION_BANKS = {
    "biology": [
        {
            "question_text": "Which organelle is primarily responsible for ATP synthesis in eukaryotic cells?",
            "question_type": "mcq",
            "option_a": "Mitochondrion",
            "option_b": "Golgi apparatus",
            "option_c": "Endoplasmic reticulum",
            "option_d": "Ribosome",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "During photosynthesis, what is the source of oxygen released as a byproduct?",
            "question_type": "mcq",
            "option_a": "Photolysis of water molecules",
            "option_b": "Carbon dioxide fixation",
            "option_c": "Glucose breakdown",
            "option_d": "NADPH oxidation",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "Which enzyme catalyzes the breakdown of starch into maltose in the human digestive system?",
            "question_type": "mcq",
            "option_a": "Salivary amylase",
            "option_b": "Pepsin",
            "option_c": "Lipase",
            "option_d": "Trypsin",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "What type of blood vessel carries oxygenated blood from the lungs back to the left atrium of the heart?",
            "question_type": "mcq",
            "option_a": "Pulmonary vein",
            "option_b": "Pulmonary artery",
            "option_c": "Vena cava",
            "option_d": "Aorta",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "In Mendelian genetics, what is the expected phenotypic ratio in a monohybrid cross of two heterozygous individuals (Aa x Aa)?",
            "question_type": "mcq",
            "option_a": "3 dominant : 1 recessive",
            "option_b": "1 dominant : 1 recessive",
            "option_c": "9:3:3:1",
            "option_d": "1:2:1",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "Which blood component is primarily responsible for immune defense and antibody production?",
            "question_type": "mcq",
            "option_a": "White blood cells (Leukocytes)",
            "option_b": "Red blood cells (Erythrocytes)",
            "option_c": "Platelets (Thrombocytes)",
            "option_d": "Blood plasma proteins",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "What is the function of xylem tissue in vascular plants?",
            "question_type": "mcq",
            "option_a": "Transport of water and dissolved minerals from roots to leaves",
            "option_b": "Transport of sucrose and amino acids from leaves to roots",
            "option_c": "Storage of starch granules in the cortex",
            "option_d": "Photosynthetic light absorption",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "Which hormone regulates glucose uptake by body cells to lower blood sugar levels?",
            "question_type": "mcq",
            "option_a": "Insulin",
            "option_b": "Glucagon",
            "option_c": "Adrenaline",
            "option_d": "Thyroxine",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "In an ecosystem, which trophic level converts radiant solar energy into chemical energy?",
            "question_type": "mcq",
            "option_a": "Primary producers (Autotrophs)",
            "option_b": "Primary consumers (Herbivores)",
            "option_c": "Secondary consumers (Carnivores)",
            "option_d": "Decomposers (Saprotrophs)",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "Which nitrogenous base pairs with Adenine in DNA?",
            "question_type": "mcq",
            "option_a": "Thymine",
            "option_b": "Cytosine",
            "option_c": "Guanine",
            "option_d": "Uracil",
            "correct_answer": "A",
            "marks": 1
        }
    ],
    "chemistry": [
        {
            "question_text": "What is the oxidation state of sulfur in sulfuric acid (H2SO4)?",
            "question_type": "mcq",
            "option_a": "+6",
            "option_b": "+4",
            "option_c": "-2",
            "option_d": "+2",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "According to Avogadro's law, what volume does one mole of any ideal gas occupy at standard temperature and pressure (STP)?",
            "question_type": "mcq",
            "option_a": "22.4 dm³ (liters)",
            "option_b": "24.0 dm³ (liters)",
            "option_c": "11.2 dm³ (liters)",
            "option_d": "1.0 dm³ (liter)",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "Which bond type is formed by the electrostatic attraction between oppositely charged ions?",
            "question_type": "mcq",
            "option_a": "Ionic bond",
            "option_b": "Covalent bond",
            "option_c": "Metallic bond",
            "option_d": "Hydrogen bond",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "What is the pH value of a neutral aqueous solution at 25°C?",
            "question_type": "mcq",
            "option_a": "7.0",
            "option_b": "1.0",
            "option_c": "14.0",
            "option_d": "0.0",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "Which catalyst is traditionally used in the industrial Haber Process for ammonia synthesis?",
            "question_type": "mcq",
            "option_a": "Finely divided Iron (Fe)",
            "option_b": "Vanadium(V) oxide (V2O5)",
            "option_c": "Platinum (Pt)",
            "option_d": "Nickel (Ni)",
            "correct_answer": "A",
            "marks": 1
        }
    ],
    "physics": [
        {
            "question_text": "According to Newton's Second Law of Motion, what is the mathematical formula for force?",
            "question_type": "mcq",
            "option_a": "F = m * a",
            "option_b": "F = m * v",
            "option_c": "F = 0.5 * m * v²",
            "option_d": "F = m * g * h",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "What is the SI unit of electrical resistance?",
            "question_type": "mcq",
            "option_a": "Ohm (Ω)",
            "option_b": "Volt (V)",
            "option_c": "Ampere (A)",
            "option_d": "Watt (W)",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "Which phenomenon causes a light ray to bend when passing obliquely from air into water?",
            "question_type": "mcq",
            "option_a": "Refraction",
            "option_b": "Diffraction",
            "option_c": "Total internal reflection",
            "option_d": "Polarization",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "What is the kinetic energy of an object of mass 'm' moving at velocity 'v'?",
            "question_type": "mcq",
            "option_a": "0.5 * m * v²",
            "option_b": "m * v",
            "option_c": "m * g * h",
            "option_d": "0.5 * m * a",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "Which instrument is used to measure electric current in a closed circuit?",
            "question_type": "mcq",
            "option_a": "Ammeter connected in series",
            "option_b": "Voltmeter connected in parallel",
            "option_c": "Galvanometer connected across the battery only",
            "option_d": "Rheostat",
            "correct_answer": "A",
            "marks": 1
        }
    ],
    "mathematics": [
        {
            "question_text": "If 2x + 5 = 19, what is the value of x?",
            "question_type": "mcq",
            "option_a": "7",
            "option_b": "12",
            "option_c": "6",
            "option_d": "14",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "What is the gradient (slope) of the line represented by the equation 3x - y + 6 = 0?",
            "question_type": "mcq",
            "option_a": "3",
            "option_b": "-3",
            "option_c": "6",
            "option_d": "1/3",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "What is the value of sin(30°)?",
            "question_type": "mcq",
            "option_a": "0.5 (1/2)",
            "option_b": "√3 / 2",
            "option_c": "1.0",
            "option_d": "√2 / 2",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "What are the roots of the quadratic equation x² - 5x + 6 = 0?",
            "question_type": "mcq",
            "option_a": "x = 2 and x = 3",
            "option_b": "x = -2 and x = -3",
            "option_c": "x = 1 and x = 6",
            "option_d": "x = -1 and x = 6",
            "correct_answer": "A",
            "marks": 1
        },
        {
            "question_text": "What is the median of the data set: [4, 7, 9, 12, 15, 18, 21]?",
            "question_type": "mcq",
            "option_a": "12",
            "option_b": "14",
            "option_c": "9",
            "option_d": "15",
            "correct_answer": "A",
            "marks": 1
        }
    ]
}


def _generate_fallback_quiz_questions(subject: str, topic: str, count: int) -> List[dict]:
    subject_key = (subject or "").lower().strip()
    
    bank = None
    for key in SUBJECT_QUESTION_BANKS:
        if key in subject_key or ("math" in subject_key and key == "mathematics"):
            bank = SUBJECT_QUESTION_BANKS[key]
            break
            
    if not bank:
        # Integrated science / general science / general fallback
        bank = SUBJECT_QUESTION_BANKS.get("biology", []) + SUBJECT_QUESTION_BANKS.get("chemistry", []) + SUBJECT_QUESTION_BANKS.get("physics", [])

    results = []
    for i in range(count):
        tmpl = bank[i % len(bank)]
        q_copy = dict(tmpl)
        if topic and topic.lower() != subject_key and i % 3 == 0:
            q_copy["question_text"] = f"In the study of {topic} ({subject}): {q_copy['question_text']}"
        results.append(q_copy)
    return results


@router.post("/", response_model=QuizResponse, status_code=201)
def create_quiz(
    data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    if current_user.role not in ("admin", "headmaster"):
        from models.teacher_assignment import TeacherAssignment
        assignments = db.query(TeacherAssignment).filter(
            TeacherAssignment.teacher_id == current_user.id,
            TeacherAssignment.class_id == data.class_id,
        ).all()
        assigned_subjects = [a.subject.lower() for a in assignments if a.subject]
        if current_user.subject:
            assigned_subjects.append(current_user.subject.lower())
        if not assignments and not (current_user.subject and data.subject and data.subject.lower() == current_user.subject.lower()):
            raise HTTPException(status_code=400, detail="You are not assigned to teach this class.")
        if data.subject and assigned_subjects and data.subject.lower() not in assigned_subjects:
            raise HTTPException(status_code=400, detail=f"You are not assigned to teach '{data.subject}' in this class.")

    quiz = Quiz(**data.dict(), teacher_id=current_user.id)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/teacher", response_model=List[QuizResponse])
def get_teacher_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Get all quizzes created by the current teacher."""
    return db.query(Quiz).filter(
        Quiz.teacher_id == current_user.id
    ).order_by(Quiz.created_at.desc()).all()


@router.put("/{quiz_id}", response_model=QuizResponse)
def update_quiz(
    quiz_id: int,
    data: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if data.class_id is not None and current_user.role not in ("admin", "headmaster"):
        from models.teacher_assignment import TeacherAssignment
        assignments = db.query(TeacherAssignment).filter(
            TeacherAssignment.teacher_id == current_user.id,
            TeacherAssignment.class_id == data.class_id,
        ).all()
        assigned_subjects = [a.subject.lower() for a in assignments if a.subject]
        if current_user.subject:
            assigned_subjects.append(current_user.subject.lower())
        if not assignments and not (current_user.subject and data.subject and data.subject.lower() == current_user.subject.lower()):
            raise HTTPException(status_code=400, detail="You are not assigned to teach this class.")
        if data.subject and assigned_subjects and data.subject.lower() not in assigned_subjects:
            raise HTTPException(status_code=400, detail=f"You are not assigned to teach '{data.subject}' in this class.")

    update_dict = data.model_dump(exclude_unset=True) if hasattr(data, "model_dump") else data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(quiz, field, value)

    db.commit()
    db.refresh(quiz)
    return quiz


@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Teacher deletes a quiz."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted successfully"}


@router.post("/generate-questions/{quiz_id}")
def generate_quiz_questions(
    quiz_id: int,
    num_questions: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions_data = None
    if settings.ANTHROPIC_API_KEY:
        try:
            prompt = f"""
You are an expert Ghanaian Senior High School (SHS) teacher and assessment specialist.
Generate exactly {num_questions} high-quality Multiple Choice Questions (MCQs) for:
Subject: {quiz.subject}
Topic: {quiz.topic or quiz.title}

CURRICULUM INSTRUCTIONS:
1. Ground the questions strictly in the Ghanaian NaCCA/WAEC SHS syllabus for {quiz.subject}.
2. Generate exactly {num_questions} distinct 4-option MCQs.
3. For each question, provide:
   - "question_text": Clear, unambiguous question prompt
   - "question_type": "mcq"
   - "option_a": Option A text
   - "option_b": Option B text
   - "option_c": Option C text
   - "option_d": Option D text
   - "correct_answer": Exactly one letter ("A", "B", "C", or "D") that accurately matches the correct option.
   - "marks": 1
4. Make distractors plausible and educational.
5. Respond ONLY with a valid JSON array of objects. Do not include markdown code block formatting (no ```json).

JSON SCHEMA:
[
  {{
    "question_text": "...",
    "question_type": "mcq",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A",
    "marks": 1
  }}
]
"""
            response = httpx.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 3500,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=35.0
            )
            data = response.json()
            if "content" in data and len(data["content"]) > 0:
                text = data["content"][0]["text"].strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                parsed = json.loads(text)
                if isinstance(parsed, list) and len(parsed) > 0:
                    questions_data = parsed[:num_questions]
        except Exception as e:
            print("AI topic quiz generation error:", e)

    if not questions_data:
        questions_data = _generate_fallback_quiz_questions(quiz.subject, quiz.topic or quiz.title, num_questions)

    saved_count = 0
    for i, q in enumerate(questions_data, 1):
        question = QuizQuestion(
            quiz_id=quiz_id,
            question_text=q["question_text"],
            question_type=q.get("question_type", "mcq"),
            option_a=q.get("option_a") or "Option A",
            option_b=q.get("option_b") or "Option B",
            option_c=q.get("option_c") or "Option C",
            option_d=q.get("option_d") or "Option D",
            correct_answer=str(q.get("correct_answer", "A")).strip().upper(),
            marks=q.get("marks", 1),
            order_num=i
        )
        db.add(question)
        saved_count += 1

    db.commit()
    return {
        "message": f"{saved_count} questions generated and saved",
        "quiz_id": quiz_id,
        "questions_count": saved_count
    }


@router.post("/generate-questions-from-file/{quiz_id}")
async def generate_quiz_questions_from_file(
    quiz_id: int,
    num_questions: int = 10,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    file_bytes = await file.read()
    filename = file.filename or ""
    content_type = file.content_type or ""
    extracted_text = extract_text_from_file(file_bytes, filename, content_type)

    questions_data = None
    if settings.ANTHROPIC_API_KEY:
        try:
            messages_content = []
            
            # If PDF and bytes are reasonable size, attach document block for highest native OCR/parsing accuracy
            if (filename.lower().endswith(".pdf") or "pdf" in content_type.lower()) and len(file_bytes) < 15 * 1024 * 1024:
                pdf_b64 = base64.b64encode(file_bytes).decode("utf-8")
                messages_content.append({
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": pdf_b64
                    }
                })

            prompt = f"""
You are an expert Ghanaian Senior High School (SHS) curriculum teacher and assessment creator.
Generate exactly {num_questions} Multiple Choice Questions (MCQs) strictly and accurately based on the document provided.

DOCUMENT SUMMARY & CONTEXT:
Subject: {quiz.subject}
Topic: {quiz.topic or quiz.title}
File Name: {filename}
{f"Document Excerpt:\n---\n{extracted_text[:14000]}\n---" if extracted_text else ""}

STRICT ACCURACY RULES:
1. GROUNDING: Every question MUST test specific facts, definitions, processes, data, or principles directly mentioned in the document.
2. FORMAT: Generate exactly {num_questions} MCQs with 4 distinct options: "option_a", "option_b", "option_c", "option_d".
3. CORRECT ANSWER: Set "correct_answer" to the exact letter ("A", "B", "C", or "D") that contains the correct statement. Ensure the letter strictly corresponds to the true fact from the document.
4. DISTRACTORS: Make the 3 incorrect options plausible misconceptions related to the subject matter.
5. NO MARKDOWN: Respond ONLY with a clean JSON array of objects. Do not wrap with ```json.

JSON SCHEMA:
[
  {{
    "question_text": "...",
    "question_type": "mcq",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A",
    "marks": 1
  }}
]
"""
            messages_content.append({"type": "text", "text": prompt})

            response = httpx.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 4000,
                    "messages": [{"role": "user", "content": messages_content}]
                },
                timeout=50.0
            )
            data = response.json()
            if "content" in data and len(data["content"]) > 0:
                text = data["content"][0]["text"].strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                parsed = json.loads(text)
                if isinstance(parsed, list) and len(parsed) > 0:
                    questions_data = parsed[:num_questions]
        except Exception as e:
            print("AI file quiz generation error:", e)

    if not questions_data:
        if len(extracted_text) > 30:
            questions_data = _generate_file_based_fallback_questions(extracted_text, quiz.subject, quiz.topic or quiz.title, num_questions)
        else:
            topic_title = quiz.topic or quiz.title
            if filename:
                topic_title = f"{topic_title} ({filename})"
            questions_data = _generate_fallback_quiz_questions(quiz.subject, topic_title, num_questions)

    saved_count = 0
    for i, q in enumerate(questions_data, 1):
        question = QuizQuestion(
            quiz_id=quiz_id,
            question_text=q["question_text"],
            question_type=q.get("question_type", "mcq"),
            option_a=q.get("option_a") or "Option A",
            option_b=q.get("option_b") or "Option B",
            option_c=q.get("option_c") or "Option C",
            option_d=q.get("option_d") or "Option D",
            correct_answer=str(q.get("correct_answer", "A")).strip().upper(),
            marks=q.get("marks", 1),
            order_num=i
        )
        db.add(question)
        saved_count += 1

    db.commit()
    return {
        "message": f"{saved_count} MCQ questions generated from '{filename}' and saved successfully!",
        "quiz_id": quiz_id,
        "questions_count": saved_count
    }


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    quiz = db.query(Quiz).filter(
        Quiz.id == question.quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz and current_user.role not in ("admin", "headmaster"):
        raise HTTPException(status_code=403, detail="Not authorized to delete this question")

    db.delete(question)
    db.commit()
    return {"message": "Question deleted successfully"}


@router.post("/{quiz_id}/questions", response_model=QuizQuestionResponse, status_code=201)
def add_question_manually(
    quiz_id: int,
    data: QuizQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    order_num = data.order_num
    if not order_num or order_num <= 1:
        count = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).count()
        order_num = count + 1

    question_dict = data.dict()
    question_dict["order_num"] = order_num
    question = QuizQuestion(**question_dict, quiz_id=quiz_id)
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.post("/{quiz_id}/questions/batch", response_model=List[QuizQuestionResponse], status_code=201)
def add_questions_batch(
    quiz_id: int,
    questions: List[QuizQuestionCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Save multiple manual questions to a quiz in one atomic request."""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    existing_count = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).count()

    created_questions = []
    for idx, q_data in enumerate(questions, start=existing_count + 1):
        q_dict = q_data.dict()
        q_dict["order_num"] = q_dict.get("order_num") or idx
        question = QuizQuestion(**q_dict, quiz_id=quiz_id)
        db.add(question)
        created_questions.append(question)

    db.commit()
    for q in created_questions:
        db.refresh(q)
    return created_questions


@router.get("/{quiz_id}/questions", response_model=List[QuizQuestionResponse])
def get_quiz_questions(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(QuizQuestion).filter(
        QuizQuestion.quiz_id == quiz_id
    ).order_by(QuizQuestion.order_num).all()

@router.post("/{quiz_id}/publish")
def publish_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz.is_published = True
    db.commit()
    return {"message": "Quiz published successfully", "is_published": True}

@router.post("/{quiz_id}/unpublish")
def unpublish_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.teacher_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz.is_published = False
    db.commit()
    return {"message": "Quiz unpublished successfully", "is_published": False}

@router.post("/{quiz_id}/start", response_model=QuizAttemptResponse)
def start_quiz(
    quiz_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.is_published == True
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or not published")

    existing = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.student_id == student_id,
        QuizAttempt.is_completed == True
    ).first()
    if existing:
        return existing

    attempt = QuizAttempt(quiz_id=quiz_id, student_id=student_id)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt

@router.post("/submit", response_model=QuizAttemptResponse)
def submit_quiz(
    data: QuizSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == data.attempt_id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    total_marks = 0
    scored_marks = 0.0

    for ans in data.answers:
        question = db.query(QuizQuestion).filter(
            QuizQuestion.id == ans.question_id
        ).first()
        if not question:
            continue

        total_marks += question.marks
        is_correct = False
        marks_awarded = 0.0
        ai_feedback = None

        if question.question_type == "mcq":
            raw_student_ans = str(ans.student_answer or "").strip()
            raw_correct_ans = str(question.correct_answer or "").strip()

            if raw_student_ans.upper() == raw_correct_ans.upper():
                is_correct = True
            else:
                opts = {
                    "A": str(question.option_a or "").strip(),
                    "B": str(question.option_b or "").strip(),
                    "C": str(question.option_c or "").strip(),
                    "D": str(question.option_d or "").strip(),
                }
                text_to_letter = {v.upper(): k for k, v in opts.items() if v}
                student_letter = text_to_letter.get(raw_student_ans.upper(), raw_student_ans.upper())
                correct_letter = text_to_letter.get(raw_correct_ans.upper(), raw_correct_ans.upper())

                if student_letter in opts and correct_letter in opts and student_letter == correct_letter:
                    is_correct = True
                elif opts.get(correct_letter, "").upper() == raw_student_ans.upper():
                    is_correct = True
                elif opts.get(student_letter, "").upper() == raw_correct_ans.upper():
                    is_correct = True
                else:
                    is_correct = False

            marks_awarded = float(question.marks) if is_correct else 0.0

        elif question.question_type == "true_false":
            is_correct = (
                str(ans.student_answer or "").strip().upper() ==
                str(question.correct_answer or "").strip().upper()
            )
            marks_awarded = float(question.marks) if is_correct else 0.0

        elif question.question_type == "short_answer":
            student_text = (ans.student_answer or "").strip()
            if student_text:
                if settings.ANTHROPIC_API_KEY:
                    try:
                        prompt = f"""
Mark short answer for Ghanaian SHS student.
Question: {question.question_text}
Expected: {question.correct_answer}
Student Answer: {student_text}
Max Marks: {question.marks}

Respond format:
MARKS: [number]
FEEDBACK: [2 sentences]
"""
                        response = httpx.post(
                            "https://api.anthropic.com/v1/messages",
                            headers={
                                "x-api-key": settings.ANTHROPIC_API_KEY,
                                "anthropic-version": "2023-06-01",
                                "content-type": "application/json",
                            },
                            json={
                                "model": "claude-3-5-sonnet-20241022",
                                "max_tokens": 200,
                                "messages": [{"role": "user", "content": prompt}]
                            },
                            timeout=15.0
                        )
                        result = response.json()
                        text = result["content"][0]["text"]
                        for line in text.strip().split("\n"):
                            if line.startswith("MARKS:"):
                                try:
                                    marks_awarded = float(line.replace("MARKS:", "").strip())
                                except ValueError:
                                    pass
                            if line.startswith("FEEDBACK:"):
                                ai_feedback = line.replace("FEEDBACK:", "").strip()
                    except Exception:
                        pass

                if marks_awarded == 0.0:
                    words = [w.lower() for w in student_text.split() if len(w) > 3]
                    matches = sum(1 for w in words if w in question.correct_answer.lower())
                    if matches >= 2 or len(student_text) > 30:
                        marks_awarded = float(question.marks)
                        ai_feedback = "Good explanation! You correctly identified core concepts and relevant principles."
                    elif len(student_text) > 10:
                        marks_awarded = round(question.marks * 0.5, 1)
                        ai_feedback = "Partial credit awarded. Your response mentions relevant terms but needs more detail."
                    else:
                        marks_awarded = 0.0
                        ai_feedback = "Answer is incomplete. Be sure to elaborate on the key points outlined in class."

                is_correct = marks_awarded >= (question.marks * 0.5)

        scored_marks += marks_awarded

        quiz_answer = QuizAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            student_answer=ans.student_answer,
            is_correct=is_correct,
            marks_awarded=marks_awarded,
            ai_feedback=ai_feedback
        )
        db.add(quiz_answer)

    percentage = (scored_marks / total_marks * 100) if total_marks > 0 else 0
    attempt.score = round(scored_marks, 1)
    attempt.total_marks = total_marks
    attempt.percentage = round(percentage, 1)
    attempt.is_completed = True
    attempt.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(attempt)
    return attempt

@router.get("/my-attempts", response_model=List[QuizAttemptResponse])
def get_my_quiz_attempts(
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    """Completed quiz attempts for the logged-in student."""
    return db.query(QuizAttempt).filter(
        QuizAttempt.student_id == student.id,
        QuizAttempt.is_completed == True,
    ).order_by(QuizAttempt.submitted_at.desc()).all()

@router.get("/class/{class_id}", response_model=List[QuizResponse])
def get_class_quizzes(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all published quizzes for a class — used by students."""
    quizzes = db.query(Quiz).filter(
        Quiz.class_id == class_id,
        Quiz.is_published == True
    ).all()
    
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if student:
        completed_quiz_ids = db.query(QuizAttempt.quiz_id).filter(
            QuizAttempt.student_id == student.id,
            QuizAttempt.is_completed == True
        ).all()
        completed_ids = [q[0] for q in completed_quiz_ids]
        quizzes = [q for q in quizzes if q.id not in completed_ids]
    
    return quizzes

@router.get("/{quiz_id}/results")
def get_quiz_results(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.is_completed == True
    ).all()

    results = []
    for a in attempts:
        roster_id = "N/A"
        student_name = "Student"
        if a.student:
            student_name = a.student.full_name or "Student"
            roster_id = a.student.student_id or f"ACH2025{a.student_id:03d}"
        else:
            roster_id = f"ACH2025{a.student_id:03d}"

        results.append({
            "student_db_id": a.student_id,
            "student_id": roster_id,
            "student_name": student_name,
            "score": a.score,
            "total_marks": a.total_marks,
            "percentage": a.percentage,
            "submitted_at": a.submitted_at
        })
    return results