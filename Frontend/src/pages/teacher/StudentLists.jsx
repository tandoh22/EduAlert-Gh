import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Search, Filter, User, Mail, Phone, Calendar, MoreVertical, Plus, Loader2 } from 'lucide-react';
import { fetchStudents } from '../../services/studentService';
import { fetchMyClasses } from '../../services/teacherService';

export default function StudentLists() {
  const [students, setStudents] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [studentsRes, classesRes] = await Promise.all([
        fetchStudents(),
        fetchMyClasses(),
      ]);
      setStudents(studentsRes.data || []);
      setAssignedClasses(classesRes.data || []);
    } catch (err) {
      console.error('Failed to load students list:', err);
      setError('Failed to load student roster for assigned classes.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      (s.full_name && s.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.student_id && s.student_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass = !selectedClass || s.class_name === selectedClass;
    const matchesGender =
      !selectedGender ||
      (s.gender && (
        s.gender.toLowerCase() === selectedGender.toLowerCase() ||
        (selectedGender.toLowerCase() === 'male' && (s.gender.toLowerCase() === 'm' || s.gender.toLowerCase() === 'male')) ||
        (selectedGender.toLowerCase() === 'female' && (s.gender.toLowerCase() === 'f' || s.gender.toLowerCase() === 'female'))
      ));
    return matchesSearch && matchesClass && matchesGender;
  });

  const maleCount = students.filter(
    (s) => s.gender && (s.gender.toUpperCase() === 'M' || s.gender.toLowerCase() === 'male')
  ).length;
  const femaleCount = students.filter(
    (s) => s.gender && (s.gender.toUpperCase() === 'F' || s.gender.toLowerCase() === 'female')
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Student Roster"
        subtitle="View and manage students in your assigned class(es)"
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Total Enrolled</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{students.length}</div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Male</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{maleCount}</div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Female</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{femaleCount}</div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Assigned Classes</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{assignedClasses.length}</div>
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
                placeholder="Search by student name or ID..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Assigned Classes</option>
              {assignedClasses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="edu-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  School
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0A192F] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {s.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div className="font-medium text-slate-900">{s.full_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-600">
                    {s.student_id || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {s.class_name || 'Assigned Class'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {s.gender?.toUpperCase() === 'M' || s.gender?.toLowerCase() === 'male'
                      ? 'Male'
                      : s.gender?.toUpperCase() === 'F' || s.gender?.toLowerCase() === 'female'
                      ? 'Female'
                      : s.gender || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {s.school || 'Achimota Senior High School'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">No students found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
