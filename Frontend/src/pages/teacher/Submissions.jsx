import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import {
  Search,
  Filter,
  Download,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Loader2,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Award,
  Sparkles,
  Check,
  Paperclip,
  BookOpen
} from 'lucide-react';
import { getSubmissions, gradeSubmission, getAssignments } from '../../services/assignmentsService';

export default function Submissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [gradingId, setGradingId] = useState(null);
  const [inlineScores, setInlineScores] = useState({});
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [modalGrade, setModalGrade] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions(selectedAssignment);
    } else {
      setSubmissions([]);
    }
  }, [selectedAssignment]);

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const data = await getAssignments();
      setAssignments(data || []);
      if (data && data.length > 0) {
        setSelectedAssignment(String(data[0].id));
      }
    } catch (err) {
      setError('Failed to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      setLoading(true);
      setError('');
      const data = await getSubmissions(assignmentId);
      setSubmissions(data || []);
    } catch (err) {
      setError('Failed to load submissions for this assignment');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId, score) => {
    if (score === undefined || score === null || score === '' || isNaN(score) || score < 0 || score > 100) {
      setError('Please enter a valid score between 0 and 100');
      return;
    }
    try {
      setGradingId(submissionId);
      setError('');
      await gradeSubmission(submissionId, parseInt(score, 10));
      
      // Update locally
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, teacher_score: parseInt(score, 10) } : s))
      );

      if (activeSubmission && activeSubmission.id === submissionId) {
        setActiveSubmission((prev) => ({ ...prev, teacher_score: parseInt(score, 10) }));
      }

      setSuccessMsg('Grade saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to save grade. Please try again.');
    } finally {
      setGradingId(null);
    }
  };

  const handleModalSaveGrade = async () => {
    if (!activeSubmission) return;
    if (modalGrade === '' || isNaN(modalGrade) || modalGrade < 0 || modalGrade > 100) {
      setError('Please enter a valid score between 0 and 100');
      return;
    }
    try {
      setModalSaving(true);
      setError('');
      await gradeSubmission(activeSubmission.id, parseInt(modalGrade, 10));
      
      const newScore = parseInt(modalGrade, 10);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === activeSubmission.id ? { ...s, teacher_score: newScore } : s))
      );
      setActiveSubmission((prev) => ({ ...prev, teacher_score: newScore }));

      setSuccessMsg(`Score of ${newScore}% recorded for ${activeSubmission.student_name || 'student'}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to save grade.');
    } finally {
      setModalSaving(false);
    }
  };

  const openReviewModal = (submission) => {
    setActiveSubmission(submission);
    setModalGrade(submission.teacher_score !== null ? String(submission.teacher_score) : (submission.ai_score !== null ? String(submission.ai_score) : ''));
    setError('');
  };

  const closeReviewModal = () => {
    setActiveSubmission(null);
    setModalGrade('');
  };

  const navigateSubmission = (direction) => {
    if (!activeSubmission) return;
    const currentIndex = filteredSubmissions.findIndex((s) => s.id === activeSubmission.id);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < filteredSubmissions.length) {
      const nextSub = filteredSubmissions[nextIndex];
      setActiveSubmission(nextSub);
      setModalGrade(nextSub.teacher_score !== null ? String(nextSub.teacher_score) : (nextSub.ai_score !== null ? String(nextSub.ai_score) : ''));
    }
  };

  const currentAssignmentObj = assignments.find((a) => String(a.id) === String(selectedAssignment));

  const filteredSubmissions = submissions.filter((submission) => {
    const sName = (submission.student_name || '').toLowerCase();
    const sCode = (submission.student_code || `ACH2025${String(submission.student_id).padStart(3, '0')}`).toLowerCase();
    const answer = (submission.answer_text || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = !searchTerm || sName.includes(term) || sCode.includes(term) || answer.includes(term);

    let matchesStatus = true;
    if (selectedStatus === 'GRADED') {
      matchesStatus = submission.teacher_score !== null;
    } else if (selectedStatus === 'AI_GRADED') {
      matchesStatus = submission.ai_score !== null && submission.teacher_score === null;
    } else if (selectedStatus === 'PENDING') {
      matchesStatus = submission.teacher_score === null && submission.ai_score === null;
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (submission) => {
    if (submission.teacher_score !== null) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (submission.ai_score !== null) return 'bg-blue-50 text-blue-700 border border-blue-200';
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  };

  const getStatusIcon = (submission) => {
    if (submission.teacher_score !== null) return CheckCircle;
    if (submission.ai_score !== null) return Sparkles;
    return Clock;
  };

  const getStatusText = (submission) => {
    if (submission.teacher_score !== null) return 'Teacher Graded';
    if (submission.ai_score !== null) return 'AI Graded';
    return 'Pending Review';
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const currentModalIndex = activeSubmission
    ? filteredSubmissions.findIndex((s) => s.id === activeSubmission.id)
    : -1;

  return (
    <div>
      <PageHeader
        title="Assignment Submissions"
        subtitle="Review student written answers, inspect AI assessments, and assign official grades."
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <p className="text-sm text-emerald-800 font-medium">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Assignment Selector & Filters */}
      <div className="edu-card p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="min-w-[260px]">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Select Assignment
              </label>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                disabled={loadingAssignments}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
              >
                {assignments.length === 0 ? (
                  <option value="">No assignments created yet</option>
                ) : (
                  assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title} ({assignment.subject})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Search Submissions
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by student name, ID (ACH20...), or answer..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'PENDING', label: 'Pending' },
                { id: 'AI_GRADED', label: 'AI Graded' },
                { id: 'GRADED', label: 'Graded' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    selectedStatus === tab.id
                      ? 'bg-white text-[#0A192F] shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Assignment Info Banner */}
        {currentAssignmentObj && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                {currentAssignmentObj.subject}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Calendar className="w-3.5 h-3.5" /> Due: {new Date(currentAssignmentObj.due_date).toLocaleDateString()}
              </span>
              {currentAssignmentObj.description && (
                <span className="text-slate-500 max-w-md truncate hidden sm:inline" title={currentAssignmentObj.description}>
                  · {currentAssignmentObj.description}
                </span>
              )}
            </div>
            {currentAssignmentObj.file_url && (
              <a
                href={currentAssignmentObj.file_url.startsWith('http') ? currentAssignmentObj.file_url : `http://localhost:8000${currentAssignmentObj.file_url}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                <Paperclip className="w-3.5 h-3.5" /> Attached prompt file
              </a>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading submissions...</p>
        </div>
      ) : (
        <>
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="edu-card p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Submissions</span>
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{submissions.length}</div>
            </div>

            <div className="edu-card p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {submissions.filter((s) => s.teacher_score === null && s.ai_score === null).length}
              </div>
            </div>

            <div className="edu-card p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Assessed</span>
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-indigo-600">
                {submissions.filter((s) => s.ai_score !== null && s.teacher_score === null).length}
              </div>
            </div>

            <div className="edu-card p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher Graded</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {submissions.filter((s) => s.teacher_score !== null).length}
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="edu-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Answer Preview
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      AI Score
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Teacher Score
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((submission) => {
                    const StatusIcon = getStatusIcon(submission);
                    const studentCode = submission.student_code || `ACH2025${String(submission.student_id).padStart(3, '0')}`;
                    const studentDisplayName = submission.student_name || `Student (${studentCode})`;
                    const inlineScoreVal = inlineScores[submission.id] !== undefined ? inlineScores[submission.id] : (submission.teacher_score ?? '');

                    return (
                      <tr key={submission.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Student Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#0A192F] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {getInitials(submission.student_name)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">{studentDisplayName}</div>
                              {submission.class_name && (
                                <div className="text-xs text-slate-400">{submission.class_name}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Student ID (ACH20...) */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                            {studentCode}
                          </span>
                        </td>

                        {/* Answer Preview */}
                        <td className="px-6 py-4 max-w-xs">
                          {submission.answer_text ? (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {submission.answer_text}
                            </p>
                          ) : submission.file_url ? (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                              <Paperclip className="w-3 h-3" /> Attached document
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No text provided</span>
                          )}
                        </td>

                        {/* Submitted Date */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : '—'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(submission)}`}>
                            <StatusIcon className="w-3 h-3" />
                            {getStatusText(submission)}
                          </span>
                        </td>

                        {/* AI Score */}
                        <td className="px-6 py-4">
                          {submission.ai_score !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                {submission.ai_score}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Teacher Score & Quick Grade */}
                        <td className="px-6 py-4">
                          {submission.teacher_score !== null ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                {submission.teacher_score}%
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0-100"
                                value={inlineScoreVal}
                                onChange={(e) =>
                                  setInlineScores({ ...inlineScores, [submission.id]: e.target.value })
                                }
                                className="w-16 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-slate-800"
                              />
                              <button
                                onClick={() => handleGrade(submission.id, inlineScoreVal)}
                                disabled={gradingId === submission.id || inlineScoreVal === ''}
                                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                              >
                                {gradingId === submission.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Grade'}
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openReviewModal(submission)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] text-white text-xs font-semibold rounded-lg hover:bg-[#0F2647] transition shadow-sm"
                            title="View submitted answer & grade"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review Answer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredSubmissions.length === 0 && (
              <div className="text-center py-16 px-4">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-700">No Submissions Found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {submissions.length === 0
                    ? 'No students have submitted answers for this assignment yet.'
                    : 'No submissions matched your search or status filter.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* DETAILED SUBMISSION & ANSWER REVIEW MODAL */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-[#0A192F] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-sm font-bold">
                  {getInitials(activeSubmission.student_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {activeSubmission.student_name || 'Student Submission'}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 bg-white/20 rounded font-semibold text-white">
                      {activeSubmission.student_code || `ACH2025${String(activeSubmission.student_id).padStart(3, '0')}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {currentAssignmentObj?.title || 'Assignment'} · {currentAssignmentObj?.subject || 'General'} · Submitted {activeSubmission.submitted_at ? new Date(activeSubmission.submitted_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/10 rounded-lg p-0.5 mr-2">
                  <button
                    onClick={() => navigateSubmission(-1)}
                    disabled={currentModalIndex <= 0}
                    className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 transition rounded"
                    title="Previous submission"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-300 px-2 font-mono">
                    {currentModalIndex + 1} / {filteredSubmissions.length}
                  </span>
                  <button
                    onClick={() => navigateSubmission(1)}
                    disabled={currentModalIndex >= filteredSubmissions.length - 1}
                    className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 transition rounded"
                    title="Next submission"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={closeReviewModal}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* Assignment Prompt Context */}
              {currentAssignmentObj?.description && (
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Assignment Question / Prompt
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{currentAssignmentObj.description}</p>
                </div>
              )}

              {/* Student's Answer */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" /> Student's Submitted Answer
                  </h4>
                  {activeSubmission.answer_text && (
                    <span className="text-xs text-slate-400 font-medium">
                      {activeSubmission.answer_text.split(/\s+/).filter(Boolean).length} words
                    </span>
                  )}
                </div>

                {activeSubmission.answer_text ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap select-text">
                    {activeSubmission.answer_text}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-400 italic">No written text was submitted for this assignment.</p>
                  </div>
                )}

                {/* Attached File if any */}
                {activeSubmission.file_url && (
                  <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-xs text-blue-950 font-medium truncate">
                      <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate">Attached Submission File</span>
                    </div>
                    <a
                      href={activeSubmission.file_url.startsWith('http') ? activeSubmission.file_url : `http://localhost:8000${activeSubmission.file_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View / Download
                    </a>
                  </div>
                )}
              </div>

              {/* AI Evaluation */}
              {activeSubmission.ai_feedback && (
                <div className="p-5 bg-gradient-to-br from-indigo-50/80 to-blue-50/60 rounded-xl border border-indigo-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Feedback & Suggested Score
                    </h4>
                    {activeSubmission.ai_score !== null && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-600 text-white shadow-sm">
                        AI Score: {activeSubmission.ai_score}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-indigo-950 leading-relaxed">
                    {activeSubmission.ai_feedback}
                  </p>
                </div>
              )}

              {/* Official Grading Section */}
              <div className="p-5 bg-white rounded-xl border-2 border-emerald-100 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-emerald-600" /> Teacher Assessment & Grade
                </h4>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">Official Score (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={modalGrade}
                      onChange={(e) => setModalGrade(e.target.value)}
                      placeholder="0-100"
                      className="w-24 px-3 py-2 text-base font-bold text-emerald-700 bg-emerald-50/40 border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {activeSubmission.ai_score !== null && (
                      <button
                        type="button"
                        onClick={() => setModalGrade(String(activeSubmission.ai_score))}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
                      >
                        Adopt AI ({activeSubmission.ai_score}%)
                      </button>
                    )}
                    {[100, 90, 85, 80, 75, 70, 60, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setModalGrade(String(preset))}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition ${
                          modalGrade === String(preset)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500">
                {activeSubmission.teacher_score !== null ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Graded: {activeSubmission.teacher_score}%
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Awaiting teacher grade
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={closeReviewModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                >
                  Close
                </button>
                <button
                  onClick={handleModalSaveGrade}
                  disabled={modalSaving || modalGrade === ''}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
                >
                  {modalSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Official Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

