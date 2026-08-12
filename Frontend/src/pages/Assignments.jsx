import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Search, ChevronDown, ArrowRight, Upload, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import SubjectTag from '../components/SubjectTag';
import LoadingState, { EmptyState, ErrorState } from '../components/LoadingState';
import { useStudent } from '../context/StudentContext';
import { fetchClassAssignments, fetchMySubmissions, submitAssignment } from '../services/portalService';
import { formatDate, getAssignmentStatus } from '../utils/format';

const statuses = ['All status', 'Pending', 'Submitted', 'Late', 'Graded'];

export default function Assignments() {
  const { classId, loading: profileLoading } = useStudent();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All subjects');
  const [statusFilter, setStatusFilter] = useState('All status');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profileLoading) return;
    if (!classId) { setLoading(false); return; }
    Promise.all([fetchClassAssignments(classId), fetchMySubmissions()])
      .then(([assignmentRes, submissionRes]) => {
        const byAssignment = Object.fromEntries(submissionRes.data.map((item) => [item.assignment_id, item]));
        setAssignments(assignmentRes.data.map((item) => ({ ...item, submission: byAssignment[item.id], status: getAssignmentStatus(item, byAssignment[item.id]) })));
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load assignments.'))
      .finally(() => setLoading(false));
  }, [classId, profileLoading]);

  const subjects = useMemo(() => ['All subjects', ...new Set(assignments.map((item) => item.subject))], [assignments]);
  const filtered = useMemo(() => assignments.filter((item) => (
    (!search || item.title.toLowerCase().includes(search.toLowerCase()) || item.subject.toLowerCase().includes(search.toLowerCase())) &&
    (subjectFilter === 'All subjects' || item.subject === subjectFilter) &&
    (statusFilter === 'All status' || item.status === statusFilter)
  )), [assignments, search, subjectFilter, statusFilter]);
  const pending = assignments.filter((item) => item.status === 'Pending').length;
  const late = assignments.filter((item) => item.status === 'Late').length;

  const handleOpenAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionText(assignment.submission?.answer_text || '');
    setSubmissionFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.type)) {
        setSubmissionFile(file);
      } else {
        setError('Only PDF and Word documents are allowed');
      }
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assignment_id', selectedAssignment.id);
      formData.append('answer_text', submissionText);
      if (submissionFile) {
        formData.append('file', submissionFile);
      }
      
      await submitAssignment(formData);
      setSelectedAssignment(null);
      setSubmissionText('');
      setSubmissionFile(null);
      // Refresh assignments
      Promise.all([fetchClassAssignments(classId), fetchMySubmissions()])
        .then(([assignmentRes, submissionRes]) => {
          const byAssignment = Object.fromEntries(submissionRes.data.map((item) => [item.assignment_id, item]));
          setAssignments(assignmentRes.data.map((item) => ({ ...item, submission: byAssignment[item.id], status: getAssignmentStatus(item, byAssignment[item.id]) })));
        });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (profileLoading || loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!classId) return <EmptyState message="No class enrollment found for your account." />;

  return <div>
    <PageHeader title="My assignments" subtitle={`${assignments.length} total · ${pending} pending · ${late} late`} />
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assignments" className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white" /></div>
      <div className="relative"><select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-white min-w-[150px]">{subjects.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
      <div className="relative"><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-white min-w-[140px]">{statuses.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
    </div>
    {assignments.length === 0 ? <EmptyState message="No assignments have been posted for your class yet." /> : <div className="edu-card divide-y divide-slate-100">{filtered.map((assignment) => { const score = assignment.submission?.teacher_score ?? assignment.submission?.ai_score; return <div key={assignment.id} onClick={() => handleOpenAssignment(assignment)} className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-semibold text-slate-900">{assignment.title}</p><SubjectTag subject={assignment.subject} /></div><p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />Due {formatDate(assignment.due_date)}</p></div><div className="flex items-center gap-3 shrink-0 ml-4">{score != null && <span className="text-sm font-semibold text-emerald-600">{score}%</span>}<StatusBadge status={assignment.status} /><ArrowRight className="w-4 h-4 text-slate-400" /></div></div>; })}{filtered.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No assignments match your filters.</p>}</div>}
    
    {/* Assignment Submission Modal */}
    {selectedAssignment && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{selectedAssignment.title}</h2>
              <button onClick={() => setSelectedAssignment(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-sm text-slate-500 mt-1">{selectedAssignment.description}</p>
          </div>
          <form onSubmit={handleSubmitAssignment} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Answer</label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Type your answer here..."
                rows={6}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload File (Optional)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    {submissionFile ? submissionFile.name : 'Click to upload PDF or Word document'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX (Max 10MB)</p>
                </label>
                {submissionFile && (
                  <button
                    type="button"
                    onClick={() => setSubmissionFile(null)}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto"
                  >
                    <X className="w-3 h-3" /> Remove file
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedAssignment.submission}
                className="px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : selectedAssignment.submission ? 'Already Submitted' : 'Submit Assignment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>;
}
