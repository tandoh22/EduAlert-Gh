export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${Math.max(diffMins, 1)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateStr);
}

export function getAssignmentStatus(assignment, submission) {
  if (submission) {
    const score = submission.teacher_score ?? submission.ai_score;
    if (score != null) return 'Graded';
    return 'Submitted';
  }
  const due = new Date(assignment.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today ? 'Late' : 'Pending';
}

export function calcAttendanceRate(records) {
  if (!records.length) return 0;
  const present = records.filter((r) => r.status === 'present').length;
  return Math.round((present / records.length) * 100);
}

export function calcAverageScore(scores) {
  if (!scores.length) return 0;
  const total = scores.reduce((sum, s) => sum + s.score, 0);
  return Math.round(total / scores.length);
}

export function groupScoresBySubject(scores) {
  const grouped = {};
  for (const score of scores) {
    if (!grouped[score.subject]) grouped[score.subject] = [];
    grouped[score.subject].push(score.score);
  }
  return Object.entries(grouped).map(([subject, values]) => ({
    subject,
    score: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
  }));
}

export function scoreColor(score) {
  if (score >= 75) return '#22C55E';
  if (score >= 60) return '#EAB308';
  return '#EF4444';
}

export function gradeLetter(score) {
  if (score >= 80) return 'A1';
  if (score >= 75) return 'B2';
  if (score >= 70) return 'B3';
  if (score >= 65) return 'C4';
  if (score >= 60) return 'C5';
  if (score >= 55) return 'C6';
  if (score >= 50) return 'D7';
  if (score >= 45) return 'E8';
  return 'F9';
}
