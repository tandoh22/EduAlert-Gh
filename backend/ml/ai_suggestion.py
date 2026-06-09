import httpx
from core.config import settings

def generate_suggestion(student_name: str, prediction_result: dict) -> str:
    if not settings.ANTHROPIC_API_KEY:
        return _fallback_suggestion(prediction_result)

    risk_level = prediction_result["risk_level"]
    reason = prediction_result["reason"]
    features = prediction_result.get("features", {})

    prompt = f"""
You are an educational advisor assistant for a Ghanaian JHS/SHS school.
A student named {student_name} has been flagged as {risk_level} risk.
Reasons: {reason}
Key data: Attendance rate = {features.get('attendance_rate')}%,
          Average score = {features.get('avg_score')}%,
          Failed subjects = {features.get('failed_subjects')}.
Write a short, practical, empathetic suggestion (2-3 sentences) for the teacher
on what specific action to take to help this student. Be direct and actionable.
Do not repeat the data back — focus on the recommended intervention.
"""
    try:
        response = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 200,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=15.0
        )
        data = response.json()
        return data["content"][0]["text"].strip()
    except Exception:
        return _fallback_suggestion(prediction_result)

def _fallback_suggestion(result: dict) -> str:
    risk = result["risk_level"]
    if risk == "High":
        return ("This student needs urgent attention. Schedule a one-on-one meeting, "
                "contact the parents or guardians, and consider enrolling them in after-school "
                "remedial classes as soon as possible.")
    elif risk == "Medium":
        return ("Monitor this student closely over the next few weeks. "
                "Offer extra encouragement during class and check in after assessments "
                "to understand any underlying challenges they may be facing.")
    else:
        return ("This student is on track. Continue to engage them with challenging "
                "material and recognise their effort to keep motivation high.")