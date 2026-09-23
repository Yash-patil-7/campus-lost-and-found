import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = (st: string) => {
    switch (st) {
      case 'SUBMITTED':
      case 'ACTIVE_SEARCH':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'HANDOVER_PENDING':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/40 animate-pulse';
      case 'RECEIVED_BY_ADMIN':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/40';
      case 'POSSIBLE_MATCH':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/40';
      case 'OWNER_IDENTIFIED':
        return 'bg-teal-500/15 text-teal-400 border-teal-500/40';
      case 'VERIFICATION':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/40';
      case 'RETURNED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
      case 'CLOSED':
        return 'bg-slate-700/30 text-slate-400 border-slate-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatText = (st: string) => {
    return st.replace(/_/g, ' ');
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold tracking-wide rounded-full border inline-flex items-center gap-1.5 ${getBadgeStyle(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {formatText(status)}
    </span>
  );
};
