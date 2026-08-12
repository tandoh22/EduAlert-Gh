import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Search, Filter, AlertTriangle, TrendingDown, Mail, Phone, MoreVertical, Download, Loader2 } from 'lucide-react';
import EmptyState from '../../components/LoadingState';

export default function AtRiskStudents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch real at-risk students from API
    setLoading(false);
  }, []);

  const filteredStudents = atRiskStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedRiskLevel === '' || student.riskLevel === selectedRiskLevel) &&
      (selectedClass === '' || student.class === selectedClass)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const getRiskBadge = (level) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getAttendanceColor = (attendance) => {
    const value = parseInt(attendance);
    if (value < 60) return 'text-red-600';
    if (value < 75) return 'text-yellow-600';
    return 'text-emerald-600';
  };

  return (
    <div>
      <PageHeader title="At-Risk Students" subtitle="Monitor and support students who need intervention" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="edu-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Total At-Risk</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{atRiskStudents.length || 0}</div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">High Risk</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {atRiskStudents.filter(s => s.riskLevel === 'high').length || 0}
          </div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Medium Risk</span>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {atRiskStudents.filter(s => s.riskLevel === 'medium').length || 0}
          </div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Low Risk</span>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {atRiskStudents.filter(s => s.riskLevel === 'low').length || 0}
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
              <option value="low">Low Risk</option>
            </select>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Classes</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0A192F] hover:bg-slate-100 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="edu-card overflow-hidden">
        {filteredStudents.length === 0 ? (
          <EmptyState message="No at-risk students found. Data will appear once students are enrolled and performance is tracked." />
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
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0A192F] text-white flex items-center justify-center text-xs font-semibold">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500">{student.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{student.class}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRiskBadge(student.riskLevel)}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {student.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${getAttendanceColor(student.attendance)}`}>
                          {student.attendance}
                        </span>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">{student.averageScore}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {student.factors.map((factor, index) => (
                          <span key={index} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Mail className="w-3 h-3" />
                          {student.email}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Phone className="w-3 h-3" />
                          {student.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
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
