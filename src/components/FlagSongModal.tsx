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
import { SummertideFlowerLogo } from './SummertideFlowerLogo';
import { HibiscusInlay } from './HibiscusInlay';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-md animate-in fade-in duration-100">
      <div className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-white/90 via-white/80 to-white/70 backdrop-blur-2xl rounded-3xl border border-white/95 shadow-[0_20px_50px_rgba(255,20,147,0.16),0_1px_2px_rgba(255,255,255,0.95)_inset] p-4 sm:p-5 text-stone-900 relative ring-1 ring-white/60 overflow-hidden">
        {/* Accent Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 shadow-sm" />

        {/* Hibiscus Inlay Debossed Watermark */}
        <HibiscusInlay size="md" position="bottom-right" opacity="opacity-[0.06] sm:opacity-[0.075]" />

        {/* Compact Header with Summertide Flower Logo */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-100/90 to-rose-100/90 border border-pink-200/90 flex items-center justify-center shrink-0 shadow-xs">
              <SummertideFlowerLogo size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-pink-600">
                <ShieldAlert className="w-3 h-3 text-rose-500" />
                <span>Integrity Rule Flag</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-stone-900 leading-tight">
                Flag Entry & Abort Scoring
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Song Info - Compact Single Line with iOS glass style */}
        <div className="px-3 py-1.5 bg-white/75 backdrop-blur-md border border-white/90 rounded-xl text-xs flex items-center gap-1.5 text-stone-600 mb-3 truncate shadow-2xs">
          <span className="text-stone-400 shrink-0 font-medium">Song:</span>
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
                        ? 'border-pink-400 bg-pink-50/90 text-pink-900 font-bold ring-2 ring-pink-300/60 shadow-xs'
                        : 'border-white/80 bg-white/70 hover:bg-white text-stone-700 shadow-2xs'
                    }`}
                  >
                    <IconComponent
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-pink-600' : 'text-stone-400'
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
              className="w-full px-3 py-1.5 rounded-xl border border-stone-300/80 bg-white/80 backdrop-blur-md text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500 transition-all resize-none shadow-inner"
            />
          </div>

          {/* Compact Notice */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl px-2.5 py-1.5 text-[11px] text-amber-900 flex items-center gap-1.5 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">
              Scoring will abort; entry flagged by <strong>{judgeName || 'Judge'}</strong> for review.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-white/70 hover:bg-white border border-stone-200 text-xs font-bold text-stone-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(225,29,72,0.3)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
