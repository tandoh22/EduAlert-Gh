import React from 'react';
import { Search, Bell } from 'lucide-react';
import { getInitials, getStoredUser } from '../services/authService';

export default function Header() {
  const user = getStoredUser();

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100/70 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 text-slate-700 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 rounded-full bg-[#0A192F] text-white font-semibold text-xs flex items-center justify-center shadow-sm">
          {getInitials(user?.full_name)}
        </div>
      </div>
    </header>
  );
}
