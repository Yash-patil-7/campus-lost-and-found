import React, { useState, useEffect } from 'react';
import { Match, Verification } from '../types';
import { apiFetch } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { MatchBreakdownModal } from '../components/MatchBreakdownModal';
import { VerificationModal } from '../components/VerificationModal';
import { ReturnModal } from '../components/ReturnModal';
import { GitCompare, RefreshCw, Eye, CheckCircle2, HelpCircle, PackageCheck } from 'lucide-react';

export const AdminMatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [verifMatch, setVerifMatch] = useState<Match | null>(null);
  const [returnMatch, setReturnMatch] = useState<Match | null>(null);

  const fetchMatchesData = async () => {
    setLoading(true);
    try {
      const [mRes, vRes] = await Promise.all([
        apiFetch<Match[]>('/matches'),
        apiFetch<Verification[]>('/verifications'),
      ]);
      setMatches(mRes);
      setVerifications(vRes);
    } catch (err) {
      console.error('Failed to fetch matches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchesData();
  }, []);

  const handleRunMatching = async () => {
    try {
      await apiFetch('/matches/run', { method: 'POST' });
      fetchMatchesData();
    } catch (err: any) {
      alert(err.message || 'Failed to execute matching service.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-purple-400" />
            Matching Engine & Verification Controller
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review similarity signals, trigger ownership verification questions, and complete item returns.
          </p>
        </div>

        <button
          onClick={handleRunMatching}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-4 h-4 text-white" /> Re-Run Match Engine
        </button>
      </div>

      <div className="glass-panel p-5 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading matches database...</div>
        ) : matches.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No matches detected yet. Click "Re-Run Match Engine" to compare active lost and received found reports.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800/80">
                <tr>
                  <th className="pb-3 px-2">Score</th>
                  <th className="pb-3 px-2">Lost Report</th>
                  <th className="pb-3 px-2">Found Report</th>
                  <th className="pb-3 px-2">Match Status</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {matches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-2 font-mono font-bold text-sky-400 text-sm">
                      {Math.round(m.score * 100)}%
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-100">
                      <div>{m.lost_item?.title}</div>
                      <div className="text-[10px] font-mono text-slate-400">LF-{m.lost_item?.case_id}</div>
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-100">
                      <div>{m.found_item?.title}</div>
                      <div className="text-[10px] font-mono text-slate-400">FF-{m.found_item?.case_id}</div>
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-3 px-2 text-right space-x-2">
                      <button
                        onClick={() => setSelectedMatch(m)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" /> Signals
                      </button>

                      {m.status === 'APPROVED' && (
                        <button
                          onClick={() => setVerifMatch(m)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition"
                        >
                          <HelpCircle className="w-3.5 h-3.5 inline mr-1" /> Request Verification
                        </button>
                      )}

                      {m.status === 'APPROVED' && (
                        <button
                          onClick={() => setReturnMatch(m)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Complete Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <MatchBreakdownModal
        match={selectedMatch}
        isAdmin={true}
        onClose={() => setSelectedMatch(null)}
        onApprove={async (matchId) => {
          try {
            await apiFetch(`/matches/${matchId}/approve`, { method: 'POST' });
          } catch (err: any) {
            alert(err.message || 'Failed to approve match.');
          }
          setSelectedMatch(null);
          fetchMatchesData();
        }}
        onReject={async (matchId) => {
          try {
            await apiFetch(`/matches/${matchId}/reject`, { method: 'POST' });
          } catch (err: any) {
            alert(err.message || 'Failed to reject match.');
          }
          setSelectedMatch(null);
          fetchMatchesData();
        }}
      />

      <VerificationModal
        match={verifMatch}
        mode="CREATE"
        onClose={() => setVerifMatch(null)}
        onSuccess={fetchMatchesData}
      />

      {returnMatch && (
        <ReturnModal
          lostItem={returnMatch.lost_item || null}
          foundItem={returnMatch.found_item || null}
          recipientUser={null}
          onClose={() => setReturnMatch(null)}
          onSuccess={fetchMatchesData}
        />
      )}
    </div>
  );
};
