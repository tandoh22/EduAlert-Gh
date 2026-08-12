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
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/LoadingState';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeClasses: 0,
    assignments: 0,
    quizzes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In production, fetch real stats from API
    setLoading(false);
  }, []);

  const quickActions = [
    { label: 'Upload Assignment', icon: Upload, path: '/teacher/assignment-upload' },
    { label: 'Create Quiz', icon: Plus, path: '/teacher/quiz-generation' },
    { label: 'Post Notice', icon: Megaphone, path: '/teacher/post-notice' },
    { label: 'Generate Lesson Notes', icon: BookOpen, path: '/teacher/lesson-note-generator' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Teacher Dashboard" subtitle="Welcome back" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Students', value: stats.totalStudents || 0, icon: Users, color: 'bg-blue-500' },
          { label: 'Active Classes', value: stats.activeClasses || 0, icon: Calendar, color: 'bg-emerald-500' },
          { label: 'Assignments', value: stats.assignments || 0, icon: FileText, color: 'bg-purple-500' },
          { label: 'Quizzes', value: stats.quizzes || 0, icon: ClipboardCheck, color: 'bg-orange-500' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="edu-card p-5">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

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
                  className="edu-card p-5 flex items-center gap-4 hover:shadow-lg transition-shadow text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0A192F] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{action.label}</div>
                    <div className="text-sm text-slate-500">Click to proceed</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Tasks</h2>
          <div className="edu-card">
            <EmptyState message="No upcoming tasks" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
        <div className="edu-card">
          <EmptyState message="No recent activity" />
        </div>
      </div>
    </div>
  );
}
