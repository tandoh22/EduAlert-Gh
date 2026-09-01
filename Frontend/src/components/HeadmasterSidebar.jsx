import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  AlertTriangle,
  FileText,
  Users,
  Megaphone,
  GraduationCap,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { getStoredUser, logout } from '../services/authService';
import logoIconLight from '../assets/edualert_logo_icon_light.svg';

const headmasterNavItems = [
  { name: 'Dashboard', path: '/headmaster/dashboard', icon: LayoutGrid },
  { name: 'Pending Accounts', path: '/headmaster/pending-accounts', icon: UserCheck },
  { name: 'At-Risk Students', path: '/headmaster/at-risk-students', icon: AlertTriangle },
  { name: 'Bulk Report Cards', path: '/headmaster/bulk-report-cards', icon: FileText },
  { name: 'Class Management', path: '/headmaster/class-management', icon: Users },
  { name: 'Manage Teachers', path: '/headmaster/teachers', icon: GraduationCap },
  { name: 'Announcements', path: '/headmaster/announcements', icon: Megaphone },
];

export default function HeadmasterSidebar() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-[#0A192F] text-slate-300 flex flex-col justify-between min-h-screen shrink-0 border-r border-slate-800/60 font-sans">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src={logoIconLight} alt="EduAlert GH" className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight tracking-tight">EduAlert GH</h1>
            <p className="text-xs text-slate-400">Headmaster portal</p>
          </div>
        </div>

        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
          MENU
        </div>
        <nav className="space-y-1">
          {headmasterNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 m-3 bg-[#0F2440] rounded-2xl border border-slate-800">
        <div className="mb-2">
          <p className="text-white text-sm font-semibold leading-tight">{user?.full_name || 'Headmaster'}</p>
          <p className="text-xs text-slate-400 truncate mt-0.5">{user?.school || 'School'}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors mt-3 pt-2 border-t border-slate-800 w-full text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
