import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare } from 'lucide-react';
import { apiFetch } from '../api/client';

interface AnnouncementModalProps {
  caseId: string | null;
  onClose: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ caseId, onClose }) => {
  if (!caseId) return null;

  const [announcementText, setAnnouncementText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (caseId) {
      setLoading(true);
      apiFetch<{ formatted_announcement: string }>(`/admin/generate-announcement?case_id=${caseId}`, {
        method: 'POST',
      })
        .then((res) => setAnnouncementText(res.formatted_announcement))
        .catch(() => setAnnouncementText('Failed to generate announcement.'))
        .finally(() => setLoading(false));
    }
  }, [caseId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(announcementText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-400" />
              College Communication Message Generator
            </h3>
            <p className="text-xs text-slate-400">
              Approved formatted summary for Case ID: <span className="font-mono text-slate-200">{caseId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
            Formatting official announcement message...
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              readOnly
              rows={10}
              value={announcementText}
              className="w-full glass-input text-xs font-mono resize-none leading-relaxed"
            />

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
              <span className="font-bold text-slate-300">College Workflow Policy: </span>
              Copy and post this structured summary to the official administrator-controlled communication group.
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Announcement Text'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
