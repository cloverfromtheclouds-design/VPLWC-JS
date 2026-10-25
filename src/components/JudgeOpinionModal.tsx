import React, { useState } from 'react';
import { MessageSquare, Copy, Check, X, User, Sliders, Calendar, Quote } from 'lucide-react';
import { SummertideFlowerLogo } from './SummertideFlowerLogo';
import { HibiscusInlay } from './HibiscusInlay';

export interface JudgeOpinionModalData {
  judgeName: string;
  entrantName: string;
  songTitle?: string;
  totalScore?: number;
  comments: string;
  timestamp?: string;
  scores?: {
    writing?: number;
    originality?: number;
    emotion?: number;
    structure?: number;
  };
}

interface JudgeOpinionModalProps {
  data: JudgeOpinionModalData | null;
  onClose: () => void;
}

export const JudgeOpinionModal: React.FC<JudgeOpinionModalProps> = ({
  data,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(data.comments);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedDate = data.timestamp
    ? new Date(data.timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-gradient-to-b from-white/95 via-white/90 to-white/85 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_25px_65px_rgba(255,20,147,0.22),0_1px_2px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60 p-5 sm:p-7 text-stone-900 relative overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
      >
        {/* Top iOS Specular Edge Highlight & Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-cyan-500 shadow-sm" />

        {/* Hibiscus Inlay Debossed Watermark */}
        <HibiscusInlay size="lg" position="bottom-right" opacity="opacity-[0.05] sm:opacity-[0.065]" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                <MessageSquare className="w-3 h-3 text-pink-600" />
                <span>Judge Evaluation & Opinion</span>
              </span>
              {data.totalScore !== undefined && (
                <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  {data.totalScore} / 100 pts
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
              {data.songTitle || data.entrantName}
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-stone-600">
              <span className="inline-flex items-center gap-1 font-semibold text-stone-900">
                <User className="w-3.5 h-3.5 text-pink-600" />
                <span>Judge: {data.judgeName}</span>
              </span>
              {data.songTitle && data.songTitle !== data.entrantName && (
                <span className="text-stone-500">
                  Entrant: <strong className="text-stone-700">{data.entrantName}</strong>
                </span>
              )}
              {formattedDate && (
                <span className="inline-flex items-center gap-1 text-stone-400 font-mono text-[11px]">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  <span>{formattedDate}</span>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Criteria Score Breakdown Strip */}
        {data.scores && (
          <div className="mt-3.5 grid grid-cols-4 gap-2 bg-stone-50/90 p-2.5 rounded-2xl border border-stone-200/80 text-center text-xs">
            <div>
              <span className="text-stone-400 text-[10px] block uppercase font-bold">Writing</span>
              <strong className="text-stone-900 font-extrabold text-sm">{data.scores.writing ?? '—'}</strong>
              <span className="text-[10px] text-stone-400"> / 25</span>
            </div>
            <div>
              <span className="text-stone-400 text-[10px] block uppercase font-bold">Originality</span>
              <strong className="text-stone-900 font-extrabold text-sm">{data.scores.originality ?? '—'}</strong>
              <span className="text-[10px] text-stone-400"> / 25</span>
            </div>
            <div>
              <span className="text-stone-400 text-[10px] block uppercase font-bold">Emotion</span>
              <strong className="text-stone-900 font-extrabold text-sm">{data.scores.emotion ?? '—'}</strong>
              <span className="text-[10px] text-stone-400"> / 25</span>
            </div>
            <div>
              <span className="text-stone-400 text-[10px] block uppercase font-bold">Structure</span>
              <strong className="text-stone-900 font-extrabold text-sm">{data.scores.structure ?? '—'}</strong>
              <span className="text-[10px] text-stone-400"> / 25</span>
            </div>
          </div>
        )}

        {/* Main Opinion Body in Spacious Scrollable Pop-up Reader */}
        <div className="flex-1 overflow-y-auto my-3.5 pr-1 space-y-3">
          <div className="bg-white/90 p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-inner select-text">
            <div className="font-serif text-sm sm:text-base text-stone-900 leading-relaxed whitespace-pre-wrap">
              {data.comments}
            </div>
          </div>
        </div>

        {/* Modal Footer with Quick Actions */}
        <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <SummertideFlowerLogo size="xs" />
            <span className="hidden sm:inline">Official Contest Scorecard Evaluation</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-300'
              }`}
              title="Copy opinion to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied Opinion!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  <span>Copy Opinion</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-[#0284c7] to-[#0891b2] hover:from-[#0369a1] hover:to-[#0e7490] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
