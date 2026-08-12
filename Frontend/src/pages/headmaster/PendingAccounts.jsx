import { useEffect, useState } from 'react';
import { UserCheck, UserX, ChevronDown } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import LoadingState, { EmptyState, ErrorState } from '../../components/LoadingState';
import { fetchPendingUsers, fetchClasses, approveUser, rejectUser } from '../../services/headmasterService';

export default function PendingAccounts() {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Teacher only: { [userId]: { [classId]: subject } }
  const [teacherPicks, setTeacherPicks] = useState({});

  const load = () => {
    setLoading(true);
    Promise.all([fetchPendingUsers(), fetchClasses()])
      .then(([usersRes, classesRes]) => {
        setUsers(usersRes.data);
        setClasses(classesRes.data);
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load pending accounts.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = (userId) => {
    setExpandedId((prev) => (prev === userId ? null : userId));
    setError(null);
  };

  const toggleTeacherClass = (userId, classId) => {
    setTeacherPicks((prev) => {
      const current = { ...(prev[userId] || {}) };
      if (classId in current) {
        delete current[classId];
      } else {
        current[classId] = '';
      }
      return { ...prev, [userId]: current };
    });
  };

  const setTeacherSubject = (userId, classId, subject) => {
    setTeacherPicks((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [classId]: subject },
    }));
  };

  const doApprove = async (userId, assignments) => {
    setActioningId(userId);
    setError(null);
    try {
      await approveUser(userId, assignments);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setExpandedId(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not approve this account.');
    } finally {
      setActioningId(null);
    }
  };

  const handleApproveClick = (user) => {
    if (user.role === 'teacher') {
      // Teacher approval needs a class+subject pick first — just expand the picker
      toggleExpand(user.id);
      return;
    }
    // Students: the admin's job is just approval — they pick their own
    // class/electives afterward via self-enrollment.
    doApprove(user.id, []);
  };

  const handleConfirmTeacher = (user) => {
    const picks = teacherPicks[user.id] || {};
    const assignments = Object.entries(picks).map(([classId, subject]) => ({
      class_id: Number(classId),
      subject,
    }));
    if (assignments.length === 0) {
      setError('Select at least one class before approving.');
      return;
    }
    if (assignments.some((a) => !a.subject)) {
      setError('Choose a subject for every class you selected.');
      return;
    }
    doApprove(user.id, assignments);
  };

  const handleReject = async (id) => {
    setActioningId(id);
    setError(null);
    try {
      await rejectUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not reject this account.');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Pending Accounts" subtitle="Review and approve new teacher and student sign-ups." />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="edu-card">
          <EmptyState message="No accounts waiting for approval." />
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => {
            const isTeacher = u.role === 'teacher';
            const isExpanded = isTeacher && expandedId === u.id;
            const teacherSelections = teacherPicks[u.id] || {};

            return (
              <div key={u.id} className="edu-card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{u.full_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                    {!isTeacher && u.admitted_course && (
                      <p className="text-xs text-slate-500 mt-1">
                        Admitted into <span className="font-medium text-slate-700">{u.admitted_course}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                      {u.role}
                    </span>
                    <button
                      onClick={() => handleApproveClick(u)}
                      disabled={actioningId === u.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {actioningId === u.id ? 'Approving...' : 'Approve'}
                      {isTeacher && (
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(u.id)}
                      disabled={actioningId === u.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold border border-red-200 hover:bg-red-100 transition disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                      Assign to class(es) — pick as many as they teach
                    </p>
                    {classes.length === 0 ? (
                      <p className="text-sm text-slate-500">No classes exist yet. Create one in Class Management first.</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {classes.map((c) => {
                          const isPicked = c.id in teacherSelections;
                          const hasSubjects = c.subjects && c.subjects.length > 0;
                          return (
                            <div
                              key={c.id}
                              className={`border rounded-lg p-3 ${
                                isPicked ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <label className={`flex items-center gap-2 ${hasSubjects ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                                <input
                                  type="checkbox"
                                  checked={isPicked}
                                  disabled={!hasSubjects}
                                  onChange={() => toggleTeacherClass(u.id, c.id)}
                                  className="w-3.5 h-3.5 accent-emerald-600"
                                />
                                <span className="text-sm font-medium text-slate-900">{c.name}</span>
                                <span className="text-xs text-slate-400">
                                  {c.course || 'No course set'}
                                </span>
                              </label>
                              {isPicked && (
                                <select
                                  value={teacherSelections[c.id] || ''}
                                  onChange={(e) => setTeacherSubject(u.id, c.id, e.target.value)}
                                  className="mt-2 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                                >
                                  <option value="">Select subject to teach...</option>
                                  {c.subjects.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button
                      onClick={() => handleConfirmTeacher(u)}
                      disabled={actioningId === u.id}
                      className="px-4 py-2 rounded-lg bg-[#0A192F] text-white text-xs font-semibold hover:bg-[#0F2647] transition disabled:opacity-50"
                    >
                      {actioningId === u.id ? 'Approving...' : 'Confirm approval'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}