import React, { useState } from 'react';
import { Match, Verification } from '../types';
import { X, HelpCircle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api/client';

interface VerificationModalProps {
  match?: Match | null;
  verification?: Verification | null;
  mode: 'CREATE' | 'STUDENT_ANSWER' | 'ADMIN_REVIEW';
  onClose: () => void;
  onSuccess: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  match,
  verification,
  mode,
  onClose,
  onSuccess,
}) => {
  // Guard: render nothing when there is no data to display
  if (!match && !verification) return null;

  const [question, setQuestion] = useState(
    'Describe one identifying mark, serial number, or specific sticker on the item.'
  );
  const [answer, setAnswer] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    setLoading(true);
    setError(null);

    try {
      await apiFetch('/verifications', {
        method: 'POST',
        body: JSON.stringify({ match_id: match.id, question }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send verification question.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verification) return;
    setLoading(true);
    setError(null);

    try {
      await apiFetch(`/verifications/${verification.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (passed: boolean) => {
    if (!verification) return;
    setLoading(true);
    setError(null);

    try {
      await apiFetch(`/verifications/${verification.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ passed, notes }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to review verification.');
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
              <HelpCircle className="w-5 h-5 text-rose-400" />
              {mode === 'CREATE' && 'Request Ownership Verification'}
              {mode === 'STUDENT_ANSWER' && 'Respond to Ownership Verification'}
              {mode === 'ADMIN_REVIEW' && 'Review Ownership Response'}
            </h3>
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

        {/* Mode 1: Admin Create Question */}
        {mode === 'CREATE' && (
          <form onSubmit={handleCreateQuestion} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Verification Question for Claimant
              </label>
              <textarea
                rows={3}
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Formulate a specific question about identifying marks..."
                className="w-full glass-input text-xs resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The student will receive a notification to answer this question to prove ownership.
              </p>
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
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20 transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Verification Request'}
              </button>
            </div>
          </form>
        )}

        {/* Mode 2: Student Submit Answer */}
        {mode === 'STUDENT_ANSWER' && verification && (
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Question from Administrator</div>
              <div className="text-xs font-semibold text-slate-200">{verification.question}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Answer <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Provide specific details to prove ownership..."
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
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Verification Answer'}
              </button>
            </div>
          </form>
        )}

        {/* Mode 3: Admin Review Answer */}
        {mode === 'ADMIN_REVIEW' && verification && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold">Question: </span>
                <span className="text-slate-200">{verification.question}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-slate-400 font-semibold">Student Answer: </span>
                <span className="text-sky-300 font-medium">{verification.answer || 'No answer submitted yet.'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Reviewer Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reasoning or physical check details..."
                className="w-full glass-input text-xs"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => handleReview(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject Answer
              </button>
              <button
                type="button"
                onClick={() => handleReview(true)}
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Ownership
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
