import React, { useState } from 'react';
import { FoundItem } from '../types';
import { X, PackageCheck, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api/client';

interface HandoverModalProps {
  item: FoundItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({ item, onClose, onSuccess }) => {
  if (!item) return null;

  const [storageLocation, setStorageLocation] = useState('Locker B-12');
  const [condition, setCondition] = useState('Good working condition');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiFetch('/admin/handovers', {
        method: 'POST',
        body: JSON.stringify({
          found_item_id: item.id,
          condition,
          storage_location: storageLocation,
          notes,
        }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record physical item receipt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-indigo-400" />
              Confirm Physical Item Receipt
            </h3>
            <p className="text-xs text-slate-400">
              Case ID: <span className="font-mono text-slate-200">{item.case_id}</span> - {item.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Physical Storage / Cabinet Location <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder="e.g. Locker B-12, Cabinet 4"
              className="w-full glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Physical Condition Notes <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g. Minor scratch on screen, fully functional"
              className="w-full glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Handover Administrative Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional verification or handoff details..."
              className="w-full glass-input text-xs resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Confirm Item Handover'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
