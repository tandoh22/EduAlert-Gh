import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Trophy, Timer, ClipboardList, CheckCircle2, TrendingUp, BookOpen } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingState, { EmptyState, ErrorState } from '../components/LoadingState';
import {
  fetchMyAttendance,
  fetchMyScores,
  fetchMyQuizAttempts,
  fetchMySubmissions,
} from '../services/portalService';
import {
  calcAttendanceRate,
  calcAverageScore,
  groupScoresBySubject,
  scoreColor,
  formatDate,
  gradeLetter,
} from '../utils/format';

const monthLabel = (date) =>
  new Date(date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

export default function Performance() {
  const [scores, setScores] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchMyScores().catch(() => ({ data: [] })),
      fetchMyAttendance().catch(() => ({ data: [] })),
      fetchMyQuizAttempts().catch(() => ({ data: [] })),
      fetchMySubmissions().catch(() => ({ data: [] })),
    ])
      .then(([scoreRes, attendanceRes, quizRes, subRes]) => {
        setScores(scoreRes.data || []);
        setAttendance(attendanceRes.data || []);
        setQuizAttempts(quizRes.data || []);
        setSubmissions(subRes.data || []);
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load performance.'))
      .finally(() => setLoading(false));
  }, []);

  // Consolidate all graded evaluations: teacher scores, quizzes, and assignments
  const allScores = useMemo(() => {
    const list = [];

    // 1. Teacher-recorded Exam/Term Scores
    scores.forEach((item) => {
      list.push({
        id: `exam-${item.id}`,
        subject: item.subject || 'Core Subject',
        score: Number(item.score),
        recorded_at: item.recorded_at || new Date().toISOString(),
        type: 'Terminal Exam',
        source: 'Exam',
        title: item.exam_type || 'Exam Score',
      });
    });

    // 2. Completed Quiz Attempts
    quizAttempts.forEach((item) => {
      const percentage =
        item.percentage != null
          ? Number(item.percentage)
          : item.score != null && item.total_marks
          ? Math.round((item.score / item.total_marks) * 100)
          : null;

      if (percentage != null) {
        list.push({
          id: `quiz-${item.id}`,
          subject: item.quiz?.subject || 'General Quiz',
          score: percentage,
          recorded_at: item.submitted_at || item.started_at || new Date().toISOString(),
          type: 'Quiz Assessment',
          source: 'Quiz',
          title: item.quiz?.title || 'Quiz Attempt',
        });
      }
    });

    // 3. Graded Assignment Submissions
    submissions.forEach((item) => {
      const scoreVal =
        item.teacher_score != null
          ? Number(item.teacher_score)
          : item.ai_score != null
          ? Number(item.ai_score)
          : null;

      if (scoreVal != null) {
        list.push({
          id: `assign-${item.id}`,
          subject: item.assignment?.subject || 'Assignment',
          score: scoreVal,
          recorded_at: item.submitted_at || new Date().toISOString(),
          type: 'Assignment Assessment',
          source: 'Assignment',
          title: item.assignment?.title || 'Assignment Submission',
        });
      }
    });

    return list;
  }, [scores, quizAttempts, submissions]);

  const subjectBreakdown = useMemo(() => groupScoresBySubject(allScores), [allScores]);

  const scoreTrend = useMemo(
    () =>
      allScores
        .slice()
        .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
        .map((item) => ({
          month: monthLabel(item.recorded_at),
          score: item.score,
          title: item.title,
          subject: item.subject,
        })),
    [allScores]
  );

  const attendanceTrend = useMemo(() => {
    const groups = {};
    attendance.forEach((item) => {
      const key = monthLabel(item.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups).map(([month, records]) => ({
      month,
      attendance: calcAttendanceRate(records),
    }));
  }, [attendance]);

  const quizScores = useMemo(
    () => allScores.filter((s) => s.source === 'Quiz'),
    [allScores]
  );
  const assignmentScores = useMemo(
    () => allScores.filter((s) => s.source === 'Assignment'),
    [allScores]
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const average = calcAverageScore(allScores);
  const quizAvg = calcAverageScore(quizScores);
  const assignAvg = calcAverageScore(assignmentScores);
  const attendanceRate = calcAttendanceRate(attendance);

  const isEmpty = allScores.length === 0 && attendance.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Performance"
        subtitle="Track your real-time academic progress across quizzes, assignments, and terminal exams."
      />

      {isEmpty ? (
        <EmptyState message="Your performance will appear here once you complete quizzes, submit assignments, or your teacher records attendance and scores." />
      ) : (
        <>
          {/* Top Metric Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="edu-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{average}%</p>
                <p className="text-xs text-slate-500 font-medium">Overall Average</p>
              </div>
            </div>

            <div className="edu-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">
                  {quizScores.length > 0 ? `${quizAvg}%` : '—'}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Quizzes ({quizScores.length} taken)
                </p>
              </div>
            </div>

            <div className="edu-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">
                  {assignmentScores.length > 0 ? `${assignAvg}%` : '—'}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Assignments ({assignmentScores.length} graded)
                </p>
              </div>
            </div>

            <div className="edu-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{attendanceRate}%</p>
                <p className="text-xs text-slate-500 font-medium">Attendance Rate</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scoreTrend.length > 0 && (
              <div className="edu-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Continuous Score Trend
                  </h3>
                  <span className="text-xs text-slate-500">{allScores.length} Assessment(s)</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={scoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#0A192F"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {attendanceTrend.length > 0 && (
              <div className="edu-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Monthly Attendance %
                  </h3>
                  <span className="text-xs text-slate-500">{attendance.length} Total Record(s)</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="attendance" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Subject Breakdown Progress Bars */}
          {subjectBreakdown.length > 0 && (
            <div className="edu-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Subject Breakdown & Performance
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {subjectBreakdown.length} Subject(s) Assessed
                </span>
              </div>
              <div className="space-y-4">
                {subjectBreakdown.map((item) => (
                  <div key={item.subject} className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-slate-700 w-32 shrink-0 truncate">
                      {item.subject}
                    </span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.score}%`,
                          backgroundColor: scoreColor(item.score),
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-900 w-12 text-right">
                      {item.score}%
                    </span>
                    <span
                      className="text-xs font-extrabold px-2 py-0.5 rounded border shrink-0"
                      style={{
                        borderColor: scoreColor(item.score),
                        color: scoreColor(item.score),
                      }}
                    >
                      {gradeLetter(item.score)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Graded Assessments Roster */}
          {allScores.length > 0 && (
            <div className="edu-card p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">
                Recent Graded Assessments (Quizzes & Assignments)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Type</th>
                      <th className="p-3">Title / Assessment</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allScores
                      .slice()
                      .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                                item.source === 'Quiz'
                                  ? 'bg-blue-100 text-blue-800'
                                  : item.source === 'Assignment'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.source}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-900">{item.title}</td>
                          <td className="p-3 text-slate-600">{item.subject}</td>
                          <td className="p-3 text-slate-400">{formatDate(item.recorded_at)}</td>
                          <td className="p-3 text-right">
                            <span className="font-bold text-slate-900 text-sm">
                              {item.score}%
                            </span>
                            <span className="text-slate-400 ml-1.5 font-medium">
                              ({gradeLetter(item.score)})
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
