import React from 'react';
import { Match } from '../types';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface MatchBreakdownModalProps {
  match: Match | null;
  onClose: () => void;
  onApprove?: (matchId: number) => void;
  onReject?: (matchId: number) => void;
  isAdmin?: boolean;
}

export const MatchBreakdownModal: React.FC<MatchBreakdownModalProps> = ({
  match,
  onClose,
  onApprove,
  onReject,
  isAdmin = false
}) => {
  if (!match) return null;

  const signals = match.signals_json;

  const signalItems = [
    { label: 'Description Text Similarity', score: signals.description, weight: '20%' },
    { label: 'Category Exact Match', score: signals.category, weight: '25%' },
    { label: 'Brand Similarity', score: signals.brand, weight: '15%' },
    { label: 'Color Similarity', score: signals.color, weight: '10%' },
    { label: 'Location Proximity', score: signals.location, weight: '20%' },
    { label: 'Date/Time Proximity', score: signals.date, weight: '10%' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="text-sky-400">Match Signal Analysis</span>
              <StatusBadge status={match.status} />
            </h3>
            <p className="text-xs text-slate-400">
              Explainable AI match score breakdown for Case LF-{match.lost_item?.case_id} & FF-{match.found_item?.case_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Score Header */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900 border border-sky-500/20 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Overall Calculated Score</div>
            <div className="text-3xl font-extrabold text-sky-400">
              {Math.round(match.score * 100)}%
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 max-w-xs">
            {match.score >= 0.7 ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-4 h-4" /> High Confidence Match
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1 justify-end">
                <AlertTriangle className="w-4 h-4" /> Moderate Confidence Match
              </span>
            )}
            Requires admin verification before item return.
          </div>
        </div>

        {/* Item Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Lost Item Report</div>
            <div className="font-bold text-slate-200 text-sm">{match.lost_item?.title}</div>
            <div className="text-slate-400">Case ID: <span className="text-slate-200 font-mono">{match.lost_item?.case_id}</span></div>
            <div className="text-slate-400">Category: {match.lost_item?.category}</div>
            <div className="text-slate-400">Location: {match.lost_item?.location}</div>
            <div className="text-slate-400">Brand/Color: {match.lost_item?.brand || 'N/A'} / {match.lost_item?.color || 'N/A'}</div>
            <div className="text-slate-400">Date: {match.lost_item?.date_lost}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Found Item Report</div>
            <div className="font-bold text-slate-200 text-sm">{match.found_item?.title}</div>
            <div className="text-slate-400">Case ID: <span className="text-slate-200 font-mono">{match.found_item?.case_id}</span></div>
            <div className="text-slate-400">Category: {match.found_item?.category}</div>
            <div className="text-slate-400">Location: {match.found_item?.location}</div>
            <div className="text-slate-400">Brand/Color: {match.found_item?.brand || 'N/A'} / {match.found_item?.color || 'N/A'}</div>
            <div className="text-slate-400">Date: {match.found_item?.date_found}</div>
          </div>
        </div>

        {/* Signal Bars */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Decomposed Signal Weights</h4>
          {signalItems.map((sig) => (
            <div key={sig.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{sig.label}</span>
                <span className="text-slate-400 font-mono">{Math.round(sig.score * 100)}% (Weight {sig.weight})</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    sig.score >= 0.8
                      ? 'bg-emerald-500'
                      : sig.score >= 0.5
                      ? 'bg-sky-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.round(sig.score * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {isAdmin && match.status === 'PENDING' && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => onReject && onReject(match.id)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition"
            >
              Reject Match
            </button>
            <button
              onClick={() => onApprove && onApprove(match.id)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-500/20 transition"
            >
              Approve Match for Verification
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
