import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Search, Filter, Users, GraduationCap, Plus, Edit, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import EmptyState from '../../components/LoadingState';

export default function ClassManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch real classes from API
    setLoading(false);
  }, []);

  const filteredClasses = classes.filter(
    (classItem) =>
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedLevel === '' || classItem.level === selectedLevel)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Class Management" subtitle="Manage classes, teachers, and student assignments" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Total Classes</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{classes.length || 0}</div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Total Students</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {classes.reduce((acc, c) => acc + (c.students || 0), 0) || 0}
          </div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Teachers</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{classes.length || 0}</div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Levels</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">0</div>
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
            </select>

            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <EmptyState message="No classes found. Create classes to get started." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <div key={classItem.id} className="edu-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0A192F] flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-1">{classItem.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{classItem.level}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Students</span>
                  <span className="text-sm font-semibold text-slate-900">{classItem.students}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Teacher</span>
                  <span className="text-sm font-semibold text-slate-900">{classItem.teacher}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Subjects</span>
                  <span className="text-sm font-semibold text-slate-900">{classItem.subjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Room</span>
                  <span className="text-sm font-semibold text-slate-900">{classItem.room}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#0A192F] hover:bg-slate-100 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
