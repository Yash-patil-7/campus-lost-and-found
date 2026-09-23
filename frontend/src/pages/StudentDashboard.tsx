import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LostItem, FoundItem, Match, Verification } from '../types';
import { apiFetch } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { MatchBreakdownModal } from '../components/MatchBreakdownModal';
import { VerificationModal } from '../components/VerificationModal';
import {
  FileQuestion,
  FileCheck2,
  GitCompare,
  PlusCircle,
  HelpCircle,
  ChevronRight,
  Eye,
  CheckCircle2
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lRes, fRes, mRes, vRes] = await Promise.all([
        apiFetch<LostItem[]>('/lost-items?my_reports=true'),
        apiFetch<FoundItem[]>('/found-items?my_reports=true'),
        apiFetch<Match[]>('/matches'),
        apiFetch<Verification[]>('/verifications'),
      ]);
      setLostItems(lRes);
      setFoundItems(fRes);
      setMatches(mRes);
      setVerifications(vRes);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingVerification = verifications.find((v) => v.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 p-6 rounded-2xl border border-sky-500/20">
        <div>
          <h1 className="text-xl font-extrabold text-white">Student Lost & Found Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your lost items, report found items, and respond to ownership verifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/report-lost"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4 text-rose-400" /> Report Lost Item
          </Link>
          <Link
            to="/report-found"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" /> Report Found Item
          </Link>
        </div>
      </div>

      {/* Actionable Verification Callout if Pending */}
      {pendingVerification && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-rose-300">Action Required: Ownership Verification Request</div>
              <div className="text-xs text-rose-200/80">{pendingVerification.question}</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedVerification(pendingVerification)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition shrink-0"
          >
            Answer Question
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">My Active Lost Cases</span>
            <FileQuestion className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white">{lostItems.filter((i) => i.status !== 'RETURNED' && i.status !== 'CLOSED').length}</div>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">My Found Reports</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{foundItems.length}</div>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Candidate Matches</span>
            <GitCompare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{matches.length}</div>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Items Recovered</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white">{lostItems.filter((i) => i.status === 'RETURNED' || i.status === 'CLOSED').length}</div>
        </div>
      </div>

      {/* My Lost Reports Table */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-rose-400" /> My Reported Lost Items
          </h2>
          <span className="text-xs text-slate-500">{lostItems.length} total reports</span>
        </div>

        {lostItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <div>No lost items reported yet.</div>
            <Link to="/report-lost" className="text-sky-400 hover:underline font-semibold">
              Click here to report a lost item
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800/80">
                <tr>
                  <th className="pb-3 px-2">Case ID</th>
                  <th className="pb-3 px-2">Item Title</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Location</th>
                  <th className="pb-3 px-2">Date Lost</th>
                  <th className="pb-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {lostItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-2 font-mono font-bold text-sky-400">{item.case_id}</td>
                    <td className="py-3 px-2 font-semibold text-slate-100">{item.title}</td>
                    <td className="py-3 px-2">{item.category}</td>
                    <td className="py-3 px-2">{item.location}</td>
                    <td className="py-3 px-2 text-slate-400">{item.date_lost}</td>
                    <td className="py-3 px-2">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Found Reports Table */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" /> My Reported Found Items
          </h2>
          <span className="text-xs text-slate-500">{foundItems.length} total reports</span>
        </div>

        {foundItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <div>No found items reported yet.</div>
            <Link to="/report-found" className="text-emerald-400 hover:underline font-semibold">
              Click here to report a found item
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800/80">
                <tr>
                  <th className="pb-3 px-2">Case ID</th>
                  <th className="pb-3 px-2">Item Title</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Location Found</th>
                  <th className="pb-3 px-2">Date Found</th>
                  <th className="pb-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {foundItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-2 font-mono font-bold text-emerald-400">{item.case_id}</td>
                    <td className="py-3 px-2 font-semibold text-slate-100">{item.title}</td>
                    <td className="py-3 px-2">{item.category}</td>
                    <td className="py-3 px-2">{item.location}</td>
                    <td className="py-3 px-2 text-slate-400">{item.date_found}</td>
                    <td className="py-3 px-2">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Matches Section */}
      {matches.length > 0 && (
        <div className="glass-panel p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-purple-400" /> Possible Matches Detected for Your Reports
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match) => (
              <div key={match.id} className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-sky-400 font-mono">
                    Score: {Math.round(match.score * 100)}% Match
                  </div>
                  <StatusBadge status={match.status} />
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>Lost: <span className="font-semibold text-slate-100">{match.lost_item?.title}</span> ({match.lost_item?.case_id})</div>
                  <div>Found: <span className="font-semibold text-slate-100">{match.found_item?.title}</span> ({match.found_item?.case_id})</div>
                </div>
                <button
                  onClick={() => setSelectedMatch(match)}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 flex items-center justify-center gap-1 transition"
                >
                  <Eye className="w-3.5 h-3.5" /> View Score Signals Breakdown
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <MatchBreakdownModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />

      <VerificationModal
        verification={selectedVerification}
        mode="STUDENT_ANSWER"
        onClose={() => setSelectedVerification(null)}
        onSuccess={fetchData}
      />
    </div>
  );
};
