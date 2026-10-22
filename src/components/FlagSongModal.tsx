import React, { useState } from 'react';
import {
  Flag,
  AlertTriangle,
  Bot,
  Ban,
  CopyCheck,
  X,
  ShieldAlert,
} from 'lucide-react';
import { FlagReason } from '../types/contest';

interface FlagSongModalProps {
  isOpen: boolean;
  songTitle: string;
  entrantName?: string;
  judgeName: string;
  onConfirmFlag: (reason: FlagReason, reasonLabel: string, notes: string) => Promise<void>;
  onClose: () => void;
}

const REASONS: {
  key: FlagReason;
  label: string;
  shortLabel: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'ai_generated',
    label: 'Suspicious of AI Generated',
    shortLabel: 'AI Generated',
    hint: 'Unnatural cadence, formulaic rhyming schemes, or bot artifacts.',
    icon: Bot,
  },
  {
    key: 'inappropriate',
    label: 'Inappropriate or Explicit',
    shortLabel: 'Inappropriate',
    hint: 'Offensive, vulgar, hateful, or sexually explicit content.',
    icon: Ban,
  },
  {
    key: 'plagiarism',
    label: 'Potential Plagiarism',
    shortLabel: 'Plagiarism',
    hint: 'Copying published lyrics, uncredited lyrics, or theft.',
    icon: CopyCheck,
  },
  {
    key: 'other',
    label: 'Other Rule Violation',
    shortLabel: 'Other Violation',
    hint: 'Exceeds limits, ineligible language, or general guidelines.',
    icon: Flag,
  },
];

export const FlagSongModal: React.FC<FlagSongModalProps> = ({
  isOpen,
  songTitle,
  entrantName,
  judgeName,
  onConfirmFlag,
  onClose,
}) => {
  const [selectedReason, setSelectedReason] = useState<FlagReason>('ai_generated');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentReasonObj = REASONS.find((r) => r.key === selectedReason) || REASONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmFlag(selectedReason, currentReasonObj.label, notes.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl p-4 sm:p-5 text-stone-900 relative">
        {/* Accent Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-purple-600" />

        {/* Compact Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-tight">
                Flag Entry & Abort Scoring
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Song Info - Compact Single Line */}
        <div className="px-2.5 py-1.5 bg-stone-100 rounded-xl text-xs flex items-center gap-1.5 text-stone-600 mb-3 truncate">
          <span className="text-stone-400 shrink-0">Song:</span>
          <span className="font-bold text-stone-900 truncate">
            {songTitle || entrantName || 'Contest Entry'}
          </span>
          {entrantName && entrantName !== songTitle && (
            <span className="text-stone-400 truncate text-[11px]">({entrantName})</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Reason Selector (Compact 2x2 Grid) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Reason <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {REASONS.map((r) => {
                const IconComponent = r.icon;
                const isSelected = selectedReason === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setSelectedReason(r.key)}
                    className={`px-2.5 py-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-rose-400 bg-rose-50 text-rose-900 font-bold ring-1 ring-rose-300'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <IconComponent
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-rose-600' : 'text-stone-400'
                      }`}
                    />
                    <span className="text-xs truncate">{r.shortLabel}</span>
                  </button>
                );
              })}
            </div>
            {/* 1-line subtle description for active selection */}
            <p className="text-[11px] text-stone-500 mt-1.5 leading-snug truncate">
              {currentReasonObj.hint}
            </p>
          </div>

          {/* Observations Textarea */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
              Notes <span className="text-stone-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Suspicious robotic cadence or specific uncredited lines..."
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all resize-none"
            />
          </div>

          {/* Compact Notice */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-2.5 py-1.5 text-[11px] text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">
              Scoring will abort; entry flagged by <strong>{judgeName || 'Judge'}</strong> for Admin review.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 border border-stone-300 text-xs font-semibold text-stone-700 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Flagging...' : 'Confirm Flag & Abort'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
