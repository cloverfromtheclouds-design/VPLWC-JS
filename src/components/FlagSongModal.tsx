import React, { useState } from 'react';
import {
  Flag,
  AlertTriangle,
  Bot,
  Ban,
  CopyCheck,
  X,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { FlagReason, SongFlag } from '../types/contest';

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
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
}[] = [
  {
    key: 'ai_generated',
    label: 'Suspicious of AI Generated',
    description:
      'Unnatural cadence, formulaic rhyming schemes, robotic artifacts, or unauthorized generative AI tool usage.',
    icon: Bot,
    color: 'text-purple-600',
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  {
    key: 'inappropriate',
    label: 'Inappropriate or Explicit',
    description:
      'Contains offensive, sexually explicit, hateful, or excessively vulgar content violating community standards.',
    icon: Ban,
    color: 'text-rose-600',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-700',
  },
  {
    key: 'plagiarism',
    label: 'Potential Plagiarism',
    description:
      'Uncredited copying of existing published lyrics, copyrighted song reproduction, or intellectual property theft.',
    icon: CopyCheck,
    color: 'text-amber-600',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  {
    key: 'other',
    label: 'Other Rule Violation',
    description:
      'Violates contest submission terms, word count limits, ineligible language, or other specific guidelines.',
    icon: Flag,
    color: 'text-stone-600',
    badgeBg: 'bg-stone-50 border-stone-200 text-stone-700',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-6 sm:p-7 text-stone-900 relative overflow-hidden">
        {/* Accent Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-purple-600" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Rule Enforcement</span>
              </div>
              <h3 className="text-xl font-black text-stone-900 tracking-tight leading-snug">
                Flag Entry & Abort Scoring
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Song Info */}
        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 mb-4 text-xs">
          <span className="text-stone-500">Flagging submission: </span>
          <strong className="text-stone-900 text-sm block mt-0.5 font-bold">
            {songTitle || entrantName || 'Contest Entry'}
          </strong>
          {entrantName && entrantName !== songTitle && (
            <span className="text-stone-500 block text-[11px] truncate mt-0.5">
              Entrant: {entrantName}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Select Violation Reason <span className="text-rose-600">*</span>
            </label>
            <div className="space-y-2">
              {REASONS.map((r) => {
                const IconComponent = r.icon;
                const isSelected = selectedReason === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setSelectedReason(r.key)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-rose-400 bg-rose-50/80 shadow-xs ring-2 ring-rose-300/60'
                        : 'border-stone-200 hover:bg-stone-50 bg-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900">{r.label}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Observations / Evidence{' '}
              <span className="text-stone-400 font-normal lowercase">(recommended)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lines 4-8 match an existing 2019 pop ballad, or lyrics display obvious repetitive GPT cadence..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 leading-relaxed">
            <strong>What happens next:</strong> Scoring for this song will be aborted and marked as{' '}
            <span className="font-bold text-rose-700">Flagged</span> under your name (
            <em>{judgeName || 'Judge'}</em>). Contest producers will review the lyrics in the Admin
            Control Center to determine formal disqualification or clearance.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-stone-300 text-xs font-bold text-stone-700 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Logging Flag...' : 'Confirm Flag & Abort'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
