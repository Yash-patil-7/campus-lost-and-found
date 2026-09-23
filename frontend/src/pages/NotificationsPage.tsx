import React, { useState, useEffect } from 'react';
import { Notification } from '../types';
import { apiFetch } from '../api/client';
import { Bell, Check, CheckCheck, Info } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Notification[]>('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      fetchNotifs();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
      fetchNotifs();
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-400" />
            System Alert Notifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">Updates on matches, physical handovers, and verification requests.</p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 flex items-center gap-1.5 transition"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      <div className="glass-panel p-5 space-y-3">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No notifications found.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                n.is_read
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                  : 'bg-slate-900/80 border-sky-500/30 shadow-md shadow-sky-500/5'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-100">{n.title}</span>
                  {n.case_id && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                      {n.case_id}
                    </span>
                  )}
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                <div className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleString()}</div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  title="Mark as Read"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
