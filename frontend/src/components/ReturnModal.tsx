import React, { useState } from 'react';
import { LostItem, FoundItem, User } from '../types';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api/client';

interface ReturnModalProps {
  lostItem: LostItem | null;
  foundItem: FoundItem | null;
  recipientUser: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  lostItem,
  foundItem,
  recipientUser,
  onClose,
  onSuccess,
}) => {
  if (!lostItem || !foundItem) return null;

  const [verificationMethod, setVerificationMethod] = useState(
    'College Student ID Card + Verified Ownership Question'
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiFetch('/returns', {
        method: 'POST',
        body: JSON.stringify({
          lost_item_id: lostItem.id,
          found_item_id: foundItem.id,
          recipient_id: recipientUser?.id || lostItem.reporter_id,
          verification_method: verificationMethod,
          notes,
        }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete item return.');
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
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Complete Physical Item Return & Close Case
            </h3>
            <p className="text-xs text-slate-400">
              Return {lostItem.title} to verified claimant
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
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
            <div className="text-slate-400">
              Lost Case ID: <span className="font-mono text-slate-200">{lostItem.case_id}</span>
            </div>
            <div className="text-slate-400">
              Found Case ID: <span className="font-mono text-slate-200">{foundItem.case_id}</span>
            </div>
            <div className="text-slate-400">
              Recipient Owner: <span className="font-semibold text-emerald-400">{recipientUser?.full_name || lostItem.reporter_name}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Verification Method Used <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value)}
              placeholder="e.g. Student ID Card + Ownership verification question"
              className="w-full glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Return Handover Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes on physical handover, date/time, or signature..."
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
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Mark Item Returned & Close Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
