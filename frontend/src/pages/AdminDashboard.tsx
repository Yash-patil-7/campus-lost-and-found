import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnalyticsData, FoundItem, Match, Verification } from '../types';
import { apiFetch } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { HandoverModal } from '../components/HandoverModal';
import { MatchBreakdownModal } from '../components/MatchBreakdownModal';
import { VerificationModal } from '../components/VerificationModal';
import { AnnouncementModal } from '../components/AnnouncementModal';
import {
  ShieldAlert,
  PackageCheck,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  FileQuestion,
  FileCheck2,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [pendingHandovers, setPendingHandovers] = useState<FoundItem[]>([]);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedHandoverItem, setSelectedHandoverItem] = useState<FoundItem | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [announcementCaseId, setAnnouncementCaseId] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [anData, fData, mData, vData] = await Promise.all([
        apiFetch<AnalyticsData>('/admin/analytics'),
        apiFetch<FoundItem[]>('/found-items?status_filter=HANDOVER_PENDING'),
        apiFetch<Match[]>('/matches?status_filter=PENDING'),
        apiFetch<Verification[]>('/verifications'),
      ]);
      setAnalytics(anData);
      setPendingHandovers(fData);
      setPendingMatches(mData);
      setPendingVerifications(vData.filter((v) => v.status === 'SUBMITTED' || v.status === 'PENDING'));
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRunMatching = async () => {
    try {
      await apiFetch('/matches/run', { method: 'POST' });
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to run matching engine.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-6 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            Administrator Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage physical handovers, review explainable matches, verify claimants, and track audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunMatching}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-4 h-4 text-sky-400" /> Run AI Match Engine
          </button>
        </div>
      </div>

      {/* Analytics KPI Stat Grid */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400 flex justify-between">
              Total Lost Reported <FileQuestion className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.total_lost}</div>
          </div>

          <div className="glass-card p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400 flex justify-between">
              Pending Handovers <PackageCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{analytics.pending_handovers}</div>
          </div>

          <div className="glass-card p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400 flex justify-between">
              Physically Received <FileCheck2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.items_received}</div>
          </div>

          <div className="glass-card p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400 flex justify-between">
              Recovery Rate <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{analytics.recovery_rate_percent}%</div>
          </div>
        </div>
      )}

      {/* "Needs Attention" Priority Section */}
      <div className="glass-panel p-5 space-y-4">
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Needs Attention Priority Queue
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Box 1: Pending Handovers */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-amber-400" /> Pending Physical Handovers
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">{pendingHandovers.length}</span>
            </div>

            {pendingHandovers.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">No pending physical handovers.</div>
            ) : (
              <div className="space-y-2.5">
                {pendingHandovers.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-emerald-400">{item.case_id}</span>
                      <span className="text-slate-400">{item.location}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-100">{item.title}</div>
                    <button
                      onClick={() => setSelectedHandoverItem(item)}
                      className="w-full py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition"
                    >
                      Confirm Physical Receipt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Box 2: Pending Matches */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-purple-400" /> Pending Candidate Matches
              </span>
              <span className="text-xs font-mono font-bold text-purple-400">{pendingMatches.length}</span>
            </div>

            {pendingMatches.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">No pending matches to review.</div>
            ) : (
              <div className="space-y-2.5">
                {pendingMatches.slice(0, 3).map((match) => (
                  <div key={match.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-sky-400">Score: {Math.round(match.score * 100)}%</span>
                      <span className="text-slate-400">LF-{match.lost_item?.case_id}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-100">{match.lost_item?.title}</div>
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className="w-full py-1.5 rounded-lg text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition"
                    >
                      Review Match Signals
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Box 3: Pending Ownership Verifications */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-rose-400" /> Verifications Needing Review
              </span>
              <span className="text-xs font-mono font-bold text-rose-400">{pendingVerifications.length}</span>
            </div>

            {pendingVerifications.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">No pending student verification answers.</div>
            ) : (
              <div className="space-y-2.5">
                {pendingVerifications.slice(0, 3).map((verif) => (
                  <div key={verif.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <StatusBadge status={verif.status} />
                      <span className="text-slate-400">Match ID #{verif.match_id}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-100 line-clamp-1">{verif.question}</div>
                    <button
                      onClick={() => setSelectedVerification(verif)}
                      className="w-full py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition"
                    >
                      Review Student Answer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick College Communication Tool */}
      <div className="glass-panel p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-sky-400" /> College Communication Group Message Generator
          </h3>
          <p className="text-xs text-slate-400">
            Generate approved structured announcements to copy into the official administrator-controlled group.
          </p>
        </div>
        <button
          onClick={() => setAnnouncementCaseId('LF-2026-0001')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition shrink-0"
        >
          Generate Message Sample
        </button>
      </div>

      {/* Modals */}
      <HandoverModal
        item={selectedHandoverItem}
        onClose={() => setSelectedHandoverItem(null)}
        onSuccess={loadAdminData}
      />

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
          loadAdminData();
        }}
        onReject={async (matchId) => {
          try {
            await apiFetch(`/matches/${matchId}/reject`, { method: 'POST' });
          } catch (err: any) {
            alert(err.message || 'Failed to reject match.');
          }
          setSelectedMatch(null);
          loadAdminData();
        }}
      />

      <VerificationModal
        verification={selectedVerification}
        mode="ADMIN_REVIEW"
        onClose={() => setSelectedVerification(null)}
        onSuccess={loadAdminData}
      />

      <AnnouncementModal
        caseId={announcementCaseId}
        onClose={() => setAnnouncementCaseId(null)}
      />
    </div>
  );
};
