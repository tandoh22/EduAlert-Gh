import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Search, Filter, Download, FileText, Clock, CheckCircle, XCircle, Eye, Calendar, Loader2 } from 'lucide-react';
import { getSubmissions, gradeSubmission, getAssignments } from '../../services/assignmentsService';

export default function Submissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions(selectedAssignment);
    }
  }, [selectedAssignment]);

  const fetchAssignments = async () => {
    try {
      const data = await getAssignments();
      setAssignments(data);
    } catch (err) {
      setError('Failed to load assignments');
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      setLoading(true);
      setError('');
      const data = await getSubmissions(assignmentId);
      setSubmissions(data);
    } catch (err) {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId, score) => {
    try {
      setGrading(submissionId);
      await gradeSubmission(submissionId, score);
      fetchSubmissions(selectedAssignment);
    } catch (err) {
      setError('Failed to grade submission');
    } finally {
      setGrading(null);
    }
  };

  const filteredSubmissions = submissions.filter(
    (submission) =>
      true // Add filtering logic if needed
  );

  const getStatusBadge = (submission) => {
    if (submission.teacher_score !== null) return 'bg-emerald-100 text-emerald-700';
    if (submission.ai_score !== null) return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getStatusIcon = (submission) => {
    if (submission.teacher_score !== null) return CheckCircle;
    if (submission.ai_score !== null) return FileText;
    return Clock;
  };

  const getStatusText = (submission) => {
    if (submission.teacher_score !== null) return 'Graded';
    if (submission.ai_score !== null) return 'AI Graded';
    return 'Pending';
  };

  return (
    <div>
      <PageHeader title="Submissions" subtitle="Review and grade student assignment submissions" />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="edu-card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="relative min-w-[250px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Select Assignment</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
              ))}
            </select>

            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0A192F] hover:bg-slate-100 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="edu-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Total Submissions</span>
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{submissions.length}</div>
            </div>

            <div className="edu-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Pending Review</span>
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {submissions.filter(s => s.teacher_score === null && s.ai_score === null).length}
              </div>
            </div>

            <div className="edu-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Graded</span>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {submissions.filter(s => s.teacher_score !== null).length}
              </div>
            </div>

            <div className="edu-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">AI Graded</span>
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {submissions.filter(s => s.ai_score !== null && s.teacher_score === null).length}
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="edu-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student ID</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Score</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher Score</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((submission) => {
                    const StatusIcon = getStatusIcon(submission);
                    return (
                      <tr key={submission.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{submission.student_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-sm text-slate-600">
                                {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(submission)}`}>
                            <StatusIcon className="w-3 h-3" />
                            {getStatusText(submission)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {submission.ai_score !== null ? (
                            <span className="text-sm font-semibold text-slate-900">{submission.ai_score}%</span>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {submission.teacher_score !== null ? (
                            <span className="text-sm font-semibold text-emerald-600">{submission.teacher_score}%</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0-100"
                                className="w-16 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                              />
                              <button
                                onClick={(e) => {
                                  const input = e.target.previousElementSibling;
                                  if (input.value) {
                                    handleGrade(submission.id, parseInt(input.value));
                                  }
                                }}
                                disabled={grading === submission.id}
                                className="px-2 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-60"
                              >
                                {grading === submission.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Grade'}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors" title="View">
                              <Eye className="w-4 h-4 text-slate-400" />
                            </button>
                            {submission.ai_feedback && (
                              <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors" title="View AI Feedback">
                                <FileText className="w-4 h-4 text-blue-400" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500">No submissions found. Select an assignment to view submissions.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
