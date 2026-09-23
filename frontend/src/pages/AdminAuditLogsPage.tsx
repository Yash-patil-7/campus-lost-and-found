import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { apiFetch } from '../api/client';
import { History, Search, ShieldCheck } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [caseFilter, setCaseFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = caseFilter ? `/admin/audit-logs?case_id=${caseFilter}` : '/admin/audit-logs';
      const data = await apiFetch<AuditLog[]>(url);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [caseFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Administrative System Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log record of every administrative event, status change, and handover receipt.
          </p>
        </div>

        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            placeholder="Filter by Case ID (e.g. LF-2026-0001)..."
            className="w-full glass-input text-xs pl-9"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
        </div>
      </div>

      <div className="glass-panel p-5 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800/80">
                <tr>
                  <th className="pb-3 px-2">Timestamp</th>
                  <th className="pb-3 px-2">Actor</th>
                  <th className="pb-3 px-2">Action</th>
                  <th className="pb-3 px-2">Case ID</th>
                  <th className="pb-3 px-2">Transition</th>
                  <th className="pb-3 px-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-100">{log.actor_name || 'System'}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 border border-slate-700 text-[10px] font-mono font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-slate-300">{log.case_id || 'N/A'}</td>
                    <td className="py-3 px-2 text-[11px] text-slate-400">
                      {log.old_status ? (
                        <span>
                          <span className="text-slate-500">{log.old_status}</span> &rarr;{' '}
                          <span className="text-emerald-400 font-medium">{log.new_status}</span>
                        </span>
                      ) : (
                        log.new_status || '-'
                      )}
                    </td>
                    <td className="py-3 px-2 text-slate-400 max-w-xs truncate">{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
