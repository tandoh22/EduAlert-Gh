import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Upload, FileText, Calendar, X, Loader2, Trash2 } from 'lucide-react';
import { createAssignment, getAssignments, deleteAssignment } from '../../services/assignmentsService';

export default function AssignmentUpload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subject, setSubject] = useState('');
  const [classSection, setClassSection] = useState('');
  const [classId, setClassId] = useState('1');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchAssignmentsList();
  }, []);

  const fetchAssignmentsList = async () => {
    try {
      const data = await getAssignments();
      setAssignmentsList(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  };

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDelete = async (assignmentId) => {
    try {
      setDeleting(assignmentId);
      await deleteAssignment(assignmentId);
      setAssignmentsList(assignmentsList.filter(a => a.id !== assignmentId));
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

    try {
      const assignment = await createAssignment({
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
      setSubject('');
      setClassSection('');
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
      <PageHeader title="Upload Assignment" subtitle="Create and distribute assignments to your students" />

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
              <div key={assignment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-sm font-medium text-slate-900">{assignment.title}</span>
                    <span className="text-xs text-slate-500 ml-2 capitalize">{assignment.subject}</span>
                    {assignment.due_date && (
                      <span className="text-xs text-slate-400 ml-2 flex items-center gap-1">
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
                  {deleting === assignment.id ? (
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-500" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="edu-card p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assignment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter assignment title"
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter assignment description"
                rows={4}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                required
              />
            </div>

            {/* Subject and Class */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="">Select subject</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="english">English</option>
                  <option value="science">Science</option>
                  <option value="social-studies">Social Studies</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Class ID
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Class Section
              </label>
              <input
                type="text"
                value={classSection}
                onChange={(e) => setClassSection(e.target.value)}
                placeholder="e.g., JHS 1A"
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Due Date
              </label>
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

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Attach Files
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-sm text-slate-600 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  PDF, DOC, DOCX up to 10MB
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A192F] text-white text-sm font-medium rounded-lg hover:bg-[#0F2440] transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Choose Files
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-700">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Creating...
                  </>
                ) : (
                  'Upload Assignment'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
