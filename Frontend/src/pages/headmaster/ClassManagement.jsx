import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import LoadingState, { EmptyState } from '../../components/LoadingState';
import { Search, Filter, Users, GraduationCap, Plus, Edit, Trash2, X } from 'lucide-react';
import { fetchClasses, createClass, updateClass, deleteClass } from '../../services/headmasterService';
import { getStoredUser } from '../../services/authService';

const LEVELS = ['JHS', 'SHS'];

const COURSES = [
  'Science 1', 'Science 2', 'Science 3',
  'Arts 1', 'Arts 2', 'Arts 3',
  'Visual Arts 1', 'Visual Arts 2',
  'Business 1', 'Business 2',
  'Home Economics',
];

const emptyForm = (school) => ({
  name: '',
  level: 'SHS',
  course: COURSES[0],
  year: new Date().getFullYear(),
  school: school || '',
});

export default function ClassManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalMode, setModalMode] = useState(null); // null | 'add' | 'edit'
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const school = getStoredUser()?.school || '';

  const load = () => {
    setLoading(true);
    fetchClasses()
      .then((res) => setClasses(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load classes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filteredClasses = classes.filter(
    (classItem) =>
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedLevel === '' || classItem.level === selectedLevel)
  );

  const openAddModal = () => {
    setModalMode('add');
    setEditingClass(null);
    setForm(emptyForm(school));
    setFormError('');
  };

  const openEditModal = (classItem) => {
    setModalMode('edit');
    setEditingClass(classItem);
    setForm({
      name: classItem.name,
      level: classItem.level,
      course: classItem.course || COURSES[0],
      year: classItem.year,
      school: classItem.school || '',
    });
    setFormError('');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingClass(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Class name is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (modalMode === 'edit') {
        // name/level/course can be changed; year/school cannot
        await updateClass(editingClass.id, { name: form.name.trim(), level: form.level, course: form.course });
      } else {
        await createClass({
          name: form.name.trim(),
          level: form.level,
          course: form.course,
          year: Number(form.year),
          school: form.school.trim() || null,
        });
      }
      closeModal();
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Could not save this class. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (classItem) => {
    if (!window.confirm(`Delete "${classItem.name}"? This cannot be undone.`)) return;
    setDeletingId(classItem.id);
    setError(null);
    try {
      await deleteClass(classItem.id);
      setClasses((prev) => prev.filter((c) => c.id !== classItem.id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete this class.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingState />;

  const levelsPresent = [...new Set(classes.map((c) => c.level))];

  return (
    <div>
      <PageHeader title="Class Management" subtitle="Manage classes, teachers, and student assignments" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Total Classes</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{classes.length}</div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Levels in use</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{levelsPresent.length}</div>
        </div>
      </div>

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
                placeholder="Search by class name..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Levels</option>
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>

            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="edu-card">
          <EmptyState message="No classes found. Create a class to get started." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <div key={classItem.id} className="edu-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0A192F] flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-1">{classItem.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{classItem.level}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Course</span>
                  <span className="text-sm font-semibold text-slate-900">{classItem.course || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Subjects</span>
                  <span className="text-sm font-semibold text-slate-900">{classItem.subjects?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Year</span>
                  <span className="text-sm font-semibold text-slate-900">{classItem.year}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">School</span>
                  <span className="text-sm font-semibold text-slate-900 truncate max-w-[160px]" title={classItem.school}>
                    {classItem.school || '—'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => openEditModal(classItem)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#0A192F] hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(classItem)}
                  disabled={deletingId === classItem.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === classItem.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                {modalMode === 'edit' ? 'Edit class' : 'Add a new class'}
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Class name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Form 1 Science A"
                  required
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
                <select
                  value={form.course}
                  onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {COURSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1.5">Determines which subjects are available for this class.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Year {modalMode === 'edit' && <span className="text-slate-400 font-normal">(can't be changed)</span>}
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  disabled={modalMode === 'edit'}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  School {modalMode === 'edit' && <span className="text-slate-400 font-normal">(can't be changed)</span>}
                </label>
                <input
                  value={form.school}
                  onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                  placeholder="e.g. Achimota Senior High School"
                  disabled={modalMode === 'edit'}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#0A192F] text-white text-sm font-semibold rounded-xl hover:bg-[#0F2647] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : modalMode === 'edit' ? 'Save changes' : 'Create class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}