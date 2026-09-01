import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import LoadingState, { EmptyState } from '../../components/LoadingState';
import {
  Search,
  Users,
  GraduationCap,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import {
  fetchTeachers,
  addTeacherAssignment,
  removeTeacherAssignment,
  fetchClasses,
} from '../../services/headmasterService';

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTeacher, setExpandedTeacher] = useState(null);

  // Assignment form state
  const [assigningTeacherId, setAssigningTeacherId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([fetchTeachers(), fetchClasses()])
      .then(([teachersRes, classesRes]) => {
        setTeachers(teachersRes.data);
        setClasses(classesRes.data);
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTeachers = teachers.filter(
    (t) =>
      t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClass = classes.find((c) => c.id === Number(selectedClassId));
  const availableSubjects = selectedClass?.subjects || [];

  const openAssignForm = (teacherId) => {
    setAssigningTeacherId(teacherId);
    setSelectedClassId('');
    setSelectedSubject('');
    setFormError('');
    setSuccess('');
  };

  const handleAddAssignment = async () => {
    if (!selectedClassId) {
      setFormError('Please select a class.');
      return;
    }
    if (!selectedSubject) {
      setFormError('Please select a subject.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const res = await addTeacherAssignment(assigningTeacherId, Number(selectedClassId), selectedSubject);
      setSuccess(res.data.message);
      setAssigningTeacherId(null);
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to add assignment.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    setRemovingId(assignmentId);
    try {
      const res = await removeTeacherAssignment(assignmentId);
      setSuccess(res.data.message);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove assignment.');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Manage Teachers"
        subtitle="Assign or reassign teachers to classes and subjects"
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 font-bold">×</button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teachers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <div className="text-sm text-slate-500">
          {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <EmptyState message="No teachers found." />
      ) : (
        <div className="space-y-3">
          {filteredTeachers.map((teacher) => {
            const isExpanded = expandedTeacher === teacher.id;
            const isAssigning = assigningTeacherId === teacher.id;

            return (
              <div key={teacher.id} className="edu-card overflow-hidden">
                {/* Teacher header row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedTeacher(isExpanded ? null : teacher.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      {teacher.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{teacher.full_name}</p>
                      <p className="text-xs text-slate-500">{teacher.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                      {teacher.assignments.length} class{teacher.assignments.length !== 1 ? 'es' : ''}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded section: assignments */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 pb-4">
                    {/* Current assignments */}
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Current Assignments
                      </p>
                      {teacher.assignments.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No class assignments yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {teacher.assignments.map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm text-slate-800 font-medium">
                                  {a.class_name}
                                </span>
                                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                                  {a.subject}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAssignment(a.id);
                                }}
                                disabled={removingId === a.id}
                                className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 disabled:opacity-50"
                                title="Remove assignment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add assignment form */}
                    {isAssigning ? (
                      <div className="mt-4 bg-white border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-slate-800">
                            Add New Assignment
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssigningTeacherId(null);
                            }}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Class
                            </label>
                            <select
                              value={selectedClassId}
                              onChange={(e) => {
                                setSelectedClassId(e.target.value);
                                setSelectedSubject('');
                                setFormError('');
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">Select a class...</option>
                              {classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Subject
                            </label>
                            <select
                              value={selectedSubject}
                              onChange={(e) => {
                                setSelectedSubject(e.target.value);
                                setFormError('');
                              }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={!selectedClassId}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-slate-100"
                            >
                              <option value="">
                                {selectedClassId ? 'Select a subject...' : 'Choose class first'}
                              </option>
                              {availableSubjects.map((subj) => (
                                <option key={subj} value={subj}>
                                  {subj}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {formError && (
                          <p className="text-xs text-red-600 mt-2">{formError}</p>
                        )}

                        <div className="flex justify-end mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddAssignment();
                            }}
                            disabled={saving}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {saving ? 'Assigning...' : 'Assign'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAssignForm(teacher.id);
                        }}
                        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Assign to another class
                      </button>
                    )}
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
