import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import LoadingState, { EmptyState, ErrorState } from '../../components/LoadingState';
import { fetchStudentPerformance } from '../../services/headmasterService';

const getRiskBadge = (level) => {
  switch (level) {
    case 'high':
      return 'bg-red-100 text-red-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'low':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getAttendanceColor = (attendance) => {
  if (attendance == null) return 'text-slate-400';
  if (attendance < 60) return 'text-red-600';
  if (attendance < 75) return 'text-yellow-600';
  return 'text-emerald-600';
};

export default function StudentPerformance() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchStudentPerformance(studentId)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load student performance.'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const { student, overall_average, attendance_rate, subject_averages, score_trend, scores, risk_factors, latest_prediction } = data;

  const TrendIcon = score_trend > 0 ? TrendingUp : score_trend < 0 ? TrendingDown : Minus;
  const trendColor = score_trend > 0 ? 'text-emerald-600' : score_trend < 0 ? 'text-red-600' : 'text-slate-400';

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <PageHeader
        title={student.full_name}
        subtitle={`${student.class_name}${student.admitted_course ? ' · ' + student.admitted_course : ''}`}
      />

      {/* Risk summary */}
      {latest_prediction ? (
        <div className="edu-card p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRiskBadge(latest_prediction.risk_level)}`}>
              <AlertTriangle className="w-3 h-3" />
              {latest_prediction.risk_level} risk
            </span>
            <span className="text-xs text-slate-400">
              {latest_prediction.confidence_score != null && `${Math.round(latest_prediction.confidence_score * 100)}% confidence`}
            </span>
          </div>
          {latest_prediction.ai_suggestion && (
            <p className="text-sm text-slate-600">{latest_prediction.ai_suggestion}</p>
          )}
        </div>
      ) : (
        <div className="edu-card mb-6">
          <EmptyState message="No risk assessment has been run for this student yet." />
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="edu-card p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Overall average</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{overall_average}%</p>
        </div>
        <div className="edu-card p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Attendance rate</p>
          <p className={`text-2xl font-bold mt-1 ${getAttendanceColor(attendance_rate)}`}>{attendance_rate}%</p>
        </div>
        <div className="edu-card p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Score trend</p>
          <p className={`text-2xl font-bold mt-1 flex items-center gap-1.5 ${trendColor}`}>
            <TrendIcon className="w-5 h-5" />
            {score_trend > 0 ? '+' : ''}{score_trend}
          </p>
        </div>
      </div>

      {/* Risk factors */}
      {risk_factors && risk_factors.length > 0 && (
        <div className="edu-card p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Risk factors</h2>
          <div className="flex flex-wrap gap-2">
            {risk_factors.map((factor, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded">
                {factor}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject averages */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Subject averages</h2>
          {Object.keys(subject_averages).length === 0 ? (
            <div className="edu-card"><EmptyState message="No scores recorded yet." /></div>
          ) : (
            <div className="edu-card divide-y divide-slate-100">
              {Object.entries(subject_averages).map(([subject, avg]) => (
                <div key={subject} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-slate-700">{subject}</span>
                  <span className="text-sm font-semibold text-slate-900">{avg}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score history */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Score history</h2>
          {scores.length === 0 ? (
            <div className="edu-card"><EmptyState message="No scores recorded yet." /></div>
          ) : (
            <div className="edu-card overflow-hidden">
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Subject</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Term</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scores.map((s, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-sm text-slate-700">{s.subject}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-500">{s.term} {s.year}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-slate-900 text-right">{s.score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
