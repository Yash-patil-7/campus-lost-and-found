import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, ShieldCheck, User as UserIcon, Search, PlusCircle } from 'lucide-react';
import { apiFetch } from '../api/client';
import { Notification } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      apiFetch<Notification[]>('/notifications')
        .then((notifs) => setUnreadCount(notifs.filter((n) => !n.is_read).length))
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
              Campus Lost & Found
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
              System of Record
            </span>
          </div>
        </Link>
      </div>

      {user && (
        <div className="flex items-center gap-3 lg:gap-5">
          <Link
            to="/search"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-xl transition"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Search Items</span>
          </Link>

          {user.role === 'STUDENT' && (
            <div className="flex items-center gap-2">
              <Link
                to="/report-lost"
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-2 rounded-xl transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Report Lost</span>
              </Link>
              <Link
                to="/report-found"
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 rounded-xl transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Report Found</span>
              </Link>
            </div>
          )}

          <Link
            to="/notifications"
            className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full animate-bounce">
                {unreadCount}
              </span>
            )}
          </Link>

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-200">{user.full_name}</div>
              <div className="text-[10px] font-medium text-slate-400 flex items-center justify-end gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    user.role === 'ADMIN' ? 'bg-amber-400' : 'bg-sky-400'
                  }`}
                ></span>
                {user.role}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
