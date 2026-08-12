import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  FileText,
  BookOpen,
  Megaphone,
  ClipboardCheck,
  Sparkles,
  Upload,
  GraduationCap,
  Users,
  FileCheck,
  LogOut,
} from 'lucide-react';
import { getStoredUser, logout } from '../services/authService';

const teacherNavItems = [
  { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutGrid },
  { name: 'Assignment Upload', path: '/teacher/assignment-upload', icon: Upload },
  { name: 'Lesson Note Generator', path: '/teacher/lesson-note-generator', icon: BookOpen },
  { name: 'Post Notice', path: '/teacher/post-notice', icon: Megaphone },
  { name: 'Quiz Generation', path: '/teacher/quiz-generation', icon: ClipboardCheck },
  { name: 'Quiz Results', path: '/teacher/quiz-results', icon: FileCheck },
  { name: 'Report Card Generator', path: '/teacher/report-card-generator', icon: Sparkles },
  { name: 'Resources Upload', path: '/teacher/resources-upload', icon: Upload },
  { name: 'Student Lists', path: '/teacher/student-lists', icon: Users },
  { name: 'Submissions', path: '/teacher/submissions', icon: FileText },
];

export default function TeacherSidebar() {
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
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 shrink-0">
            <GraduationCap className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight tracking-tight">EduAlert GH</h1>
            <p className="text-xs text-slate-400">Teacher portal</p>
          </div>
        </div>

        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
          MENU
        </div>
        <nav className="space-y-1">
          {teacherNavItems.map((item) => {
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
          <p className="text-white text-sm font-semibold leading-tight">{user?.full_name || 'Teacher'}</p>
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
