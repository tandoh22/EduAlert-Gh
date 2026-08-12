import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import {
  Users,
  GraduationCap,
  AlertTriangle,
  Calendar,
  FileText,
  Megaphone,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/LoadingState';
import { fetchPendingUsers } from '../../services/headmasterService';

export default function HeadmasterDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    atRiskStudents: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingUsers()
      .then((res) => setPendingCount(res.data.length))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    { label: 'Review Pending Accounts', icon: UserCheck, path: '/headmaster/pending-accounts', badge: pendingCount },
    { label: 'View At-Risk Students', icon: AlertTriangle, path: '/headmaster/at-risk-students' },
    { label: 'Class Management', icon: Users, path: '/headmaster/class-management' },
    { label: 'Generate Report Cards', icon: FileText, path: '/headmaster/bulk-report-cards' },
    { label: 'Post Announcement', icon: Megaphone, path: '/headmaster/announcements' },
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
      <PageHeader title="Headmaster Dashboard" subtitle="Welcome back" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Students', value: stats.totalStudents || 0, icon: Users, color: 'bg-blue-500' },
          { label: 'Total Teachers', value: stats.totalTeachers || 0, icon: GraduationCap, color: 'bg-emerald-500' },
          { label: 'At-Risk Students', value: stats.atRiskStudents || 0, icon: AlertTriangle, color: 'bg-red-500' },
          { label: 'Attendance Rate', value: `${stats.attendanceRate || 0}%`, icon: Calendar, color: 'bg-purple-500' },
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
                  className="edu-card p-5 flex items-center gap-4 hover:shadow-lg transition-shadow text-left relative"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0A192F] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      {action.label}
                      {!!action.badge && (
                        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">Click to proceed</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Events</h2>
          <div className="edu-card">
            <EmptyState message="No upcoming events" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notices */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Notices</h2>
          <div className="edu-card">
            <EmptyState message="No recent notices" />
          </div>
        </div>

        {/* School Performance Overview */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">School Performance</h2>
          <div className="edu-card p-5">
            <EmptyState message="No performance data available" />
          </div>
        </div>
      </div>
    </div>
  );
}