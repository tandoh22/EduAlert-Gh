def compute_features(student, scores, attendances) -> dict:
    total_days = len(attendances)
    present_days = sum(1 for a in attendances if a.status == "present")
    attendance_rate = (present_days / total_days * 100) if total_days > 0 else 100.0

    score_values = [s.score for s in scores]
    avg_score = sum(score_values) / len(score_values) if score_values else 100.0

    score_trend = 0
    if len(score_values) >= 4:
        mid = len(score_values) // 2
        first_half_avg = sum(score_values[:mid]) / mid
        second_half_avg = sum(score_values[mid:]) / (len(score_values) - mid)
        score_trend = second_half_avg - first_half_avg

    subjects = {}
    for s in scores:
        if s.subject not in subjects:
            subjects[s.subject] = []
        subjects[s.subject].append(s.score)

    failed_subjects = sum(1 for subj, subj_scores in subjects.items() if (sum(subj_scores) / len(subj_scores)) < 50)

    return {
        "attendance_rate": round(attendance_rate, 2),
        "avg_score": round(avg_score, 2),
        "score_trend": round(score_trend, 2),
        "failed_subjects": failed_subjects,
        "total_subjects": len(subjects),
    }

def predict_student_risk(student, scores, attendances) -> dict:
    features = compute_features(student, scores, attendances)
    attendance_rate = features["attendance_rate"]
    avg_score = features["avg_score"]
    score_trend = features["score_trend"]
    failed_subjects = features["failed_subjects"]

    risk_points = 0
    reasons = []

    if attendance_rate < 60:
        risk_points += 3
        reasons.append(f"Very low attendance ({attendance_rate:.0f}%)")
    elif attendance_rate < 75:
        risk_points += 2
        reasons.append(f"Low attendance ({attendance_rate:.0f}%)")
    elif attendance_rate < 85:
        risk_points += 1

    if avg_score < 40:
        risk_points += 3
        reasons.append(f"Very low average score ({avg_score:.0f}%)")
    elif avg_score < 50:
        risk_points += 2
        reasons.append(f"Below average performance ({avg_score:.0f}%)")
    elif avg_score < 60:
        risk_points += 1

    if score_trend < -10:
        risk_points += 2
        reasons.append("Scores declining significantly across terms")
    elif score_trend < -5:
        risk_points += 1
        reasons.append("Slight downward score trend")

    if failed_subjects >= 3:
        risk_points += 2
        reasons.append(f"Failing {failed_subjects} subjects")
    elif failed_subjects >= 1:
        risk_points += 1
        reasons.append(f"Struggling in {failed_subjects} subject(s)")

    if risk_points >= 6:
        risk_level = "High"
        confidence = min(0.95, 0.70 + (risk_points * 0.03))
    elif risk_points >= 3:
        risk_level = "Medium"
        confidence = 0.65
    else:
        risk_level = "Low"
        confidence = 0.80

    return {
        "risk_level": risk_level,
        "confidence": round(confidence, 2),
        "reason": "; ".join(reasons) if reasons else "Student is performing well",
        "features": features,
    }