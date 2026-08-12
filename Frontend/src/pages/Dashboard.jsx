import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import SubjectTag from '../components/SubjectTag';
import LoadingState, { EmptyState, ErrorState } from '../components/LoadingState';
import { useStudent } from '../context/StudentContext';
import {
  fetchClassAssignments,
  fetchMySubmissions,
  fetchSchoolAnnouncements,
  fetchClassAnnouncements,
  fetchMyScores,
  fetchMyAttendance,
} from '../services/portalService';
import {
  calcAverageScore,
  calcAttendanceRate,
  formatDate,
  getAssignmentStatus,
  timeAgo,
} from '../utils/format';

export default function Dashboard() {
  const { classId, loading: profileLoading, error: profileError } = useStudent();
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profileLoading) return;
    if (!classId) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetchClassAssignments(classId),
      fetchMySubmissions(),
      fetchSchoolAnnouncements(),
      fetchClassAnnouncements(classId),
      fetchMyScores(),
      fetchMyAttendance(),
    ])
      .then(([assignRes, subRes, schoolAnn, classAnn, scoresRes, attRes]) => {
        const submissions = subRes.data;
        const submissionMap = Object.fromEntries(submissions.map((s) => [s.assignment_id, s]));
        const merged = assignRes.data.map((a) => ({
          ...a,
          status: getAssignmentStatus(a, submissionMap[a.id]),
        }));

        const pending = merged.filter((a) => a.status === 'Pending' || a.status === 'Late');
        const nextDue = pending.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];

        setAssignments(merged.slice(0, 4));
        setAnnouncements(
          [...schoolAnn.data, ...classAnn.data]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 3)
        );
        setStats({
          weightedAvg: calcAverageScore(scoresRes.data),
          attendance: calcAttendanceRate(attRes.data),
          assignmentsDue: pending.length,
          nextDue: nextDue ? formatDate(nextDue.due_date) : 'None',
        });
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [classId, profileLoading]);

  if (profileLoading || loading) return <LoadingState />;
  if (profileError) return <ErrorState message={profileError} />;
  if (error) return <ErrorState message={error} />;
<<<<<<< HEAD
  if (!classId) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Your overview for this term" />
        <div className="edu-card p-8 text-center">
          <p className="text-sm text-slate-600 mb-4">You haven't chosen a class yet.</p>
          <Link
            to="/enroll-class"
            className="inline-block px-5 py-2.5 rounded-lg bg-[#0A192F] text-white text-sm font-semibold hover:bg-[#0F2647] transition"
          >
            Choose your class
          </Link>
        </div>
      </div>
    );
  }
=======
  if (!classId) return <EmptyState message="No class enrollment found for your account." />;
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your overview for this term" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Weighted avg', value: `${stats?.weightedAvg ?? 0}%` },
          { label: 'Attendance', value: `${stats?.attendance ?? 0}%` },
          { label: 'Assignments due', value: stats?.assignmentsDue ?? 0 },
          { label: 'Next due', value: stats?.nextDue ?? 'None' },
        ].map((item) => (
          <div key={item.label} className="edu-card p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent assignments</h2>
            <Link to="/assignments" className="text-sm text-emerald-600 hover:text-emerald-700">View all</Link>
          </div>
          {assignments.length === 0 ? (
            <EmptyState message="No assignments posted yet." />
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="edu-card edu-card-hover p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-slate-900">{a.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <SubjectTag subject={a.subject} />
                        <span className="text-xs text-slate-500">Due {formatDate(a.due_date)}</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-600">{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Announcements</h2>
            <Link to="/announcements" className="text-sm text-emerald-600 hover:text-emerald-700">View all</Link>
          </div>
          {announcements.length === 0 ? (
            <EmptyState message="No announcements yet." />
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="edu-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-slate-900">{a.title}</h3>
                    <span className="text-xs text-slate-400 shrink-0">{timeAgo(a.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> c3591ca2c3b5ebf5102d4e9b8992579eef0282af
