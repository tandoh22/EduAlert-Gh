import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { Search, AlertTriangle, Mail, RefreshCw } from 'lucide-react';
import LoadingState, { EmptyState } from '../../components/LoadingState';
import { fetchAtRiskStudents, runSchoolWidePredictions } from '../../services/headmasterService';

export default function AtRiskStudents() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);

  const load = () => {
    setLoading(true);
    fetchAtRiskStudents()
      .then((res) => setAtRiskStudents(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load at-risk students.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleRunAssessment = async () => {
    setRunning(true);
    setError(null);
    try {
      await runSchoolWidePredictions();
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not run risk assessment.');
    } finally {
      setRunning(false);
    }
  };

  const classes = [...new Set(atRiskStudents.map((s) => s.class_name))];

  const filteredStudents = atRiskStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedRiskLevel === '' || student.risk_level === selectedRiskLevel) &&
      (selectedClass === '' || student.class_name === selectedClass)
  );

  if (loading) return <LoadingState />;

  const getRiskBadge = (level) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getAttendanceColor = (attendance) => {
    if (attendance == null) return 'text-slate-400';
    if (attendance < 60) return 'text-red-600';
    if (attendance < 75) return 'text-yellow-600';
    return 'text-emerald-600';
  };

  return (
    <div>
      <PageHeader title="Overall At-Risk Students" subtitle="School-wide class performance overview evaluating student risk across all subjects" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="edu-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Total At-Risk</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{atRiskStudents.length}</div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">High Risk</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {atRiskStudents.filter((s) => s.risk_level === 'high').length}
          </div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Medium Risk</span>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {atRiskStudents.filter((s) => s.risk_level === 'medium').length}
          </div>
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
                placeholder="Search by student name..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value)}
              className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
            </select>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunAssessment}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running...' : 'Run risk assessment'}
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="edu-card overflow-hidden">
        {filteredStudents.length === 0 ? (
          <EmptyState message="No at-risk students found yet. Click 'Run risk assessment' to evaluate enrolled students." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Factors</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => navigate(`/headmaster/students/${student.id}/performance`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0A192F] text-white flex items-center justify-center text-xs font-semibold">
                          {student.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500">{student.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{student.class_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRiskBadge(student.risk_level)}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {student.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${getAttendanceColor(student.attendance)}`}>
                        {student.attendance != null ? `${student.attendance}%` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">
                        {student.average_score != null ? `${student.average_score}%` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {student.factors.map((factor, index) => (
                          <span key={index} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.email ? (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Mail className="w-3 h-3" />
                          {student.email}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}