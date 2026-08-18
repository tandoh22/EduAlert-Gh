import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Upload, FileText, Calendar, X, Loader2, Trash2 } from 'lucide-react';
import { createAssignment, getAssignments, deleteAssignment } from '../../services/assignmentsService';
import { fetchMyClasses } from '../../services/teacherService';

export default function AssignmentUpload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subject, setSubject] = useState('');
  const [classId, setClassId] = useState('');
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchAssignmentsList();
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await fetchMyClasses();
      const classes = res.data || [];
      setAssignedClasses(classes);
      if (classes.length > 0) {
        setClassId(classes[0].id.toString());
        setAvailableSubjects(classes[0].subjects || []);
        if (classes[0].subjects?.length > 0) {
          setSubject(classes[0].subjects[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load assigned classes:', err);
    }
  };

  const handleClassChange = (selectedId) => {
    setClassId(selectedId);
    const cls = assignedClasses.find((c) => c.id.toString() === selectedId.toString());
    const subjects = cls?.subjects || [];
    setAvailableSubjects(subjects);
    if (subjects.length > 0) {
      setSubject(subjects[0]);
    } else {
      setSubject('');
    }
  };

  const fetchAssignmentsList = async () => {
    try {
      const data = await getAssignments();
      setAssignmentsList(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  };

  const handleDelete = async (assignmentId) => {
    try {
      setDeleting(assignmentId);
      await deleteAssignment(assignmentId);
      setAssignmentsList(assignmentsList.filter((a) => a.id !== assignmentId));
    } catch (err) {
      setError('Failed to delete assignment');
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!classId) {
      setError('Please select an assigned class');
      setLoading(false);
      return;
    }

    if (!subject) {
      setError('Please select an assigned subject');
      setLoading(false);
      return;
    }

    try {
      await createAssignment({
        title,
        description,
        subject,
        class_id: parseInt(classId),
        due_date: dueDate,
      });
      setSuccess(true);
      setTitle('');
      setDescription('');
      setDueDate('');
      setFiles([]);
      fetchAssignmentsList();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Upload Assignment"
        subtitle="Create and distribute assignments to students in your assigned classes"
      />

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm font-medium text-emerald-800">Assignment created successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Assignments List */}
      {assignmentsList.length > 0 && (
        <div className="edu-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Assignments</h3>
          <div className="space-y-3">
            {assignmentsList.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-sm font-medium text-slate-900">{assignment.title}</span>
                    <span className="text-xs text-slate-500 ml-2 capitalize font-semibold">
                      {assignment.subject}
                    </span>
                    {assignment.due_date && (
                      <span className="text-xs text-slate-400 ml-2 flex items-center gap-1 inline-flex">
                        <Calendar className="w-3 h-3" />
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(assignment.id)}
                  disabled={deleting === assignment.id}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60"
                  title="Delete assignment"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Assignment Form */}
      <div className="edu-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Create New Assignment</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assigned Class & Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assigned Class <span className="text-red-500">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {assignedClasses.length === 0 && (
                  <option value="">No classes assigned</option>
                )}
                {assignedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.course || 'Core'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assigned Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {availableSubjects.length === 0 ? (
                  <option value="">No subjects assigned for this class</option>
                ) : (
                  availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assignment Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Photosynthesis & Plant Respiration Assignment"
              className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description / Instructions <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed instructions for students for this semester..."
              rows={4}
              className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
            <div className="relative">
              <Calendar className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setDescription('');
                setDueDate('');
              }}
              className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
