import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import {
  Users,
  FileText,
  ClipboardCheck,
  Calendar,
  Plus,
  Upload,
  Megaphone,
  BookOpen,
  Loader2,
  AlertTriangle,
  Award,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/LoadingState';
import { fetchTeacherDashboard } from '../../services/teacherService';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetchTeacherDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load teacher dashboard:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'Upload Assignment', icon: Upload, path: '/teacher/assignment-upload' },
    { label: 'Create Quiz', icon: Plus, path: '/teacher/quiz-generation' },
    { label: 'Post Notice', icon: Megaphone, path: '/teacher/post-notice' },
    { label: 'Generate Lesson Notes', icon: BookOpen, path: '/teacher/lesson-note-generator' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <p className="text-red-700 font-medium mb-3">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const assignedClasses = data?.assigned_classes || [];
  const assignedSubjects = data?.assigned_subjects || [];
  const students = data?.students || [];

  const filteredStudents = selectedClassId === 'all'
    ? students
    : students.filter((s) => {
        const cls = assignedClasses.find((c) => c.id === parseInt(selectedClassId));
        return cls ? s.class_name === cls.name : true;
      });

  const getRiskBadge = (level) => {
    switch (level) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${data?.teacher_name || 'Teacher'}`}
        subtitle="Real-time performance overview for your assigned classes and students for this semester"
      />

      {/* Assigned Classes Banner */}
      <div className="edu-card p-5 mb-6 bg-gradient-to-r from-slate-900 to-[#0A192F] text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">
              Assigned Classes & Subjects
            </span>
            <h2 className="text-xl font-bold mt-1">
              {assignedClasses.length > 0
                ? assignedClasses.map((c) => c.name).join(', ')
                : 'No Class Assigned'}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Subjects:{' '}
              {assignedSubjects.length > 0
                ? assignedSubjects.join(', ')
                : data?.subject || 'All Subjects'}
            </p>
          </div>

          {assignedClasses.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300 font-medium">Filter View:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Assigned Classes</option>
                {assignedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Enrolled Students',
            value: filteredStudents.length,
            icon: Users,
            color: 'bg-blue-500',
            sub: 'In assigned classes',
          },
          {
            label: 'Active Classes',
            value: data?.active_classes || 0,
            icon: Calendar,
            color: 'bg-emerald-500',
            sub: `${assignedClasses.length} assigned`,
          },
          {
            label: 'Pending Grading',
            value: data?.pending_grading || 0,
            icon: ClipboardCheck,
            color: 'bg-amber-500',
            sub: 'Submissions to score',
          },
          {
            label: 'Quizzes & Assignments',
            value: (data?.assignments_count || 0) + (data?.quizzes_count || 0),
            icon: FileText,
            color: 'bg-purple-500',
            sub: `${data?.assignments_count || 0} assignments, ${data?.quizzes_count || 0} quizzes`,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="edu-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-slate-400 font-medium">{stat.sub}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & AI Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.path}
                  className="edu-card p-5 flex items-center gap-4 hover:shadow-lg transition-all border border-slate-200/80 hover:border-emerald-500/50"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0A192F] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{action.label}</div>
                    <div className="text-xs text-slate-500">Click to launch</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* AI Early Warning & Risk Breakdown */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Class Risk Breakdown
          </h2>
          <div className="edu-card p-5 space-y-4">
            <div className="flex items-center justify-between text-sm py-1 border-b border-slate-100">
              <span className="text-slate-600 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                Low Risk
              </span>
              <span className="font-bold text-slate-900">{data?.risk_counts?.Low || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1 border-b border-slate-100">
              <span className="text-slate-600 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                Medium Risk
              </span>
              <span className="font-bold text-slate-900">{data?.risk_counts?.Medium || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-600 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                High Risk
              </span>
              <span className="font-bold text-slate-900">{data?.risk_counts?.High || 0}</span>
            </div>
            
            <Link
              to="/teacher/predictions"
              className="block text-center w-full mt-2 py-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-lg transition-colors"
            >
              Run AI Risk Assessment →
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time Student List for Assigned Classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Real-time Roster — Enrolled Students
          </h2>
          <Link
            to="/teacher/students"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            View Full Roster & Filter →
          </Link>
        </div>

        <div className="edu-card overflow-hidden">
          {filteredStudents.length > 0 ? (
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
                      Avg Score
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Attendance Rate
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{s.full_name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">
                        {s.student_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {s.class_name || 'Assigned Class'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        {s.avg_score}%
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {s.attendance_rate}%
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskBadge(
                            s.risk_level
                          )}`}
                        >
                          {s.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No students found for the assigned class(es)" />
          )}
        </div>
      </div>
    </div>
  );
}
