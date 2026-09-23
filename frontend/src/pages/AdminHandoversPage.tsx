import React, { useState, useEffect } from 'react';
import { FoundItem } from '../types';
import { apiFetch } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { HandoverModal } from '../components/HandoverModal';
import { PackageCheck, Search, Filter } from 'lucide-react';

export const AdminHandoversPage: React.FC = () => {
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FoundItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchHandovers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<FoundItem[]>('/found-items');
      setItems(data);
    } catch (err) {
      console.error('Failed to load found items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
  }, []);

  const filteredItems = items.filter((item) => {
    if (filterStatus === 'PENDING') return item.status === 'HANDOVER_PENDING';
    if (filterStatus === 'RECEIVED') return item.status === 'RECEIVED_BY_ADMIN' || item.status === 'POSSIBLE_MATCH';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-indigo-400" />
            Physical Item Handover Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track student physical item handovers, record storage cabinet locations, and update system state.
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            All Reports ({items.length})
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
            }`}
          >
            Pending Handover ({items.filter((i) => i.status === 'HANDOVER_PENDING').length})
          </button>
          <button
            onClick={() => setFilterStatus('RECEIVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'RECEIVED' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400'
            }`}
          >
            Physically Received
          </button>
        </div>
      </div>

      <div className="glass-panel p-5 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading handover cases...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No items match the selected handover filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800/80">
                <tr>
                  <th className="pb-3 px-2">Case ID</th>
                  <th className="pb-3 px-2">Item Title</th>
                  <th className="pb-3 px-2">Finder Student</th>
                  <th className="pb-3 px-2">Location Found</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Storage Cabinet</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-2 font-mono font-bold text-emerald-400">{item.case_id}</td>
                    <td className="py-3 px-2 font-semibold text-slate-100">{item.title}</td>
                    <td className="py-3 px-2">{item.finder_name || 'Student'}</td>
                    <td className="py-3 px-2">{item.location}</td>
                    <td className="py-3 px-2">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-2 font-mono text-slate-400">
                      {item.physical_location || 'Not Received Yet'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {item.status === 'HANDOVER_PENDING' ? (
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition"
                        >
                          Confirm Physical Receipt
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-semibold">Receipt Recorded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <HandoverModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSuccess={fetchHandovers}
      />
    </div>
  );
};
