import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import {
  Users,
  GraduationCap,
  AlertTriangle,
  TrendingUp,
  FileText,
  Megaphone,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingState, { EmptyState } from '../../components/LoadingState';
import { fetchPendingUsers, fetchOverview } from '../../services/headmasterService';
import { getStoredUser } from '../../services/authService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const RISK_COLORS = { low: '#22c55e', medium: '#eab308', high: '#ef4444' };

export default function HeadmasterDashboard() {
  const [overview, setOverview] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getStoredUser();

  useEffect(() => {
    Promise.all([fetchOverview(), fetchPendingUsers()])
      .then(([overviewRes, pendingRes]) => {
        setOverview(overviewRes.data);
        setPendingCount(pendingRes.data.length);
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard stats.'))
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    { label: 'Review Pending Accounts', icon: UserCheck, path: '/headmaster/pending-accounts', badge: pendingCount },
    { label: 'View At-Risk Students', icon: AlertTriangle, path: '/headmaster/at-risk-students' },
    { label: 'Class Management', icon: Users, path: '/headmaster/class-management' },
    { label: 'Generate Report Cards', icon: FileText, path: '/headmaster/bulk-report-cards' },
    { label: 'Post Announcement', icon: Megaphone, path: '/headmaster/announcements' },
  ];

  if (loading) return <LoadingState />;

  const statCards = [
    {
      label: 'Total Students',
      value: overview?.total_students ?? 0,
      subtext: overview ? `+${overview.new_students_recent} recently` : '',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Teachers',
      value: overview?.total_teachers ?? 0,
      subtext: overview ? `${overview.new_teachers_recent} new` : '',
      icon: GraduationCap,
      color: 'bg-emerald-500',
    },
    {
      label: 'Avg pass rate',
      value: `${overview?.avg_pass_rate ?? 0}%`,
      subtext: 'current term',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'At-risk',
      value: overview?.at_risk_count ?? 0,
      subtext: `${overview?.at_risk_percent ?? 0}% of learners`,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ];

  const riskChartData = [
    { name: 'Low risk', value: overview?.risk_breakdown?.low || 0, color: RISK_COLORS.low },
    { name: 'Medium risk', value: overview?.risk_breakdown?.medium || 0, color: RISK_COLORS.medium },
    { name: 'High risk', value: overview?.risk_breakdown?.high || 0, color: RISK_COLORS.high },
  ].filter((d) => d.value > 0);

  const teacherRoster = overview?.teacher_roster || [];

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.full_name || 'Admin'}`} subtitle="School-wide performance overview for this semester" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="edu-card p-5">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
              {stat.subtext && <div className="text-xs text-slate-400 mt-1">{stat.subtext}</div>}
            </div>
          );
        })}
      </div>

      {/* Risk breakdown + Subject pass-rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="edu-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Risk breakdown</h2>
          {riskChartData.length === 0 ? (
            <EmptyState message="No risk assessments yet." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={riskChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {riskChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-5 mt-2">
                {riskChartData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="edu-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Teachers & assignments</h2>
          {teacherRoster.length === 0 ? (
            <EmptyState message="No teachers assigned to classes yet." />
          ) : (
            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              {teacherRoster.map((t) => (
                <div key={t.teacher_id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <p className="text-sm font-semibold text-slate-900">{t.teacher_name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {t.assignments.map((a, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600"
                      >
                        {a.class_name} · {a.subject}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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

      {/* Recent Notices */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Notices</h2>
        <div className="edu-card">
          <EmptyState message="No recent notices" />
        </div>
      </div>
    </div>
  );
}