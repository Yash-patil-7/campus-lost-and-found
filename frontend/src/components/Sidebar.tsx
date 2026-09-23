import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileQuestion,
  FileCheck2,
  GitCompare,
  PackageCheck,
  ShieldAlert,
  BarChart3,
  History,
  Search,
  Bell
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const navItems = isAdmin
    ? [
        { to: '/admin/dashboard', label: 'Admin Overview', icon: LayoutDashboard },
        { to: '/admin/handovers', label: 'Physical Handovers', icon: PackageCheck },
        { to: '/admin/matches', label: 'Match Controller', icon: GitCompare },
        { to: '/admin/analytics', label: 'Recovery Analytics', icon: BarChart3 },
        { to: '/admin/audit-logs', label: 'Audit Log Trail', icon: History },
        { to: '/search', label: 'Search Index', icon: Search },
        { to: '/notifications', label: 'System Alerts', icon: Bell },
      ]
    : [
        { to: '/student/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { to: '/report-lost', label: 'Report Lost Item', icon: FileQuestion },
        { to: '/report-found', label: 'Report Found Item', icon: FileCheck2 },
        { to: '/search', label: 'Search Public Items', icon: Search },
        { to: '/notifications', label: 'Notifications', icon: Bell },
      ];

  return (
    <aside className="w-64 bg-slate-950/60 backdrop-blur-md border-r border-slate-800/80 p-4 hidden md:flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div className="px-3 py-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            {isAdmin ? 'Administrative Portal' : 'Student Workspace'}
          </p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-md shadow-sky-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 bg-slate-900/60 border border-slate-800/60 rounded-xl space-y-1 text-[11px] text-slate-400">
        <div className="font-bold text-slate-300">Campus Policy Guard</div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Physical item receipt by Admin is required before ownership verification.
        </p>
      </div>
    </aside>
  );
};
