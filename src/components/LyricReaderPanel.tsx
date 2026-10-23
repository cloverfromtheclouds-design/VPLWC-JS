import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  User,
  MessageCircle,
  BookOpen,
  X,
} from 'lucide-react';
import { ParsedLyricSubmission } from '../utils/lyricParser';

interface LyricReaderPanelProps {
  submission: ParsedLyricSubmission;
  onClear?: () => void;
}

export const LyricReaderPanel: React.FC<LyricReaderPanelProps> = ({
  submission,
  onClear,
}) => {
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isCopied, setIsCopied] = useState(false);

  const hasContent = !!(
    submission.songTitle ||
    submission.alias ||
    submission.lyrics ||
    submission.storyConcept
  );

  const handleCopyLyrics = () => {
    if (!submission.lyrics) return;
    navigator.clipboard.writeText(submission.lyrics);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Render stylized lyrics with colored badges for section tags
  const renderFormattedLyrics = () => {
    if (!submission.lyrics) {
      return (
        <div className="text-stone-400 italic text-sm text-center py-8">
          No lyric text provided for this entry.
        </div>
      );
    }

    const lines = submission.lyrics.split(/\r?\n/);

    return (
      <div className="space-y-1">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          const isSectionHeader = /^\[[^\]]+\]/i.test(trimmed);

          if (isSectionHeader) {
            return (
              <div key={idx} className="pt-4 pb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 text-[#0284c7] font-extrabold text-xs uppercase tracking-wider shadow-2xs border border-sky-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                  {trimmed}
                </span>
              </div>
            );
          }

          if (!trimmed) {
            return <div key={idx} className="h-3" />;
          }

          return (
            <div
              key={idx}
              className={`leading-relaxed text-stone-800 font-serif tracking-normal ${
                fontSize === 'sm'
                  ? 'text-xs'
                  : fontSize === 'lg'
                  ? 'text-base sm:text-lg'
                  : 'text-sm sm:text-base'
              }`}
            >
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  const wordCount = submission.lyrics
    ? submission.lyrics.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const lineCount = submission.lyrics
    ? submission.lyrics.split(/\r?\n/).filter((l) => l.trim()).length
    : 0;

  return (
    <div className="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(255,20,147,0.08),0_1px_1px_rgba(255,255,255,0.95)_inset] p-5 sm:p-7 flex flex-col h-full ring-1 ring-white/60 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              Lyric Sheet Viewer
            </span>
            {hasContent && (
              <span className="text-[11px] text-stone-400">
                {wordCount} words · {lineCount} lines
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-1 leading-tight">
            {submission.songTitle || 'No Song Selected'}
          </h3>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasContent && (
            <>
              {/* Font Size Selector */}
              <div className="hidden sm:flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200 text-xs">
                <button
                  type="button"
                  onClick={() => setFontSize('sm')}
                  className={`px-2 py-1 rounded font-bold ${
                    fontSize === 'sm' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="Small text"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('base')}
                  className={`px-2 py-1 rounded font-bold ${
                    fontSize === 'base' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="Default text"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('lg')}
                  className={`px-2 py-1 rounded font-bold ${
                    fontSize === 'lg' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="Large text"
                >
                  A+
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyLyrics}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer"
                title="Copy raw lyrics"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  className="p-2 rounded-xl border border-stone-200 hover:bg-rose-50 hover:text-rose-600 text-stone-400 transition-colors cursor-pointer"
                  title="Clear lyric view"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      {hasContent ? (
        <div className="flex-1 overflow-y-auto space-y-5 pt-4 pr-1">
          {/* Metadata Badges (Alias & Discord) */}
          <div className="flex flex-wrap items-center gap-2">
            {submission.alias && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-800">
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-stone-400 font-normal">Artist / Alias:</span>
                <span className="font-bold text-stone-900">{submission.alias}</span>
              </div>
            )}

            {submission.discordUsername && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-xs font-semibold text-[#5865F2]">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="font-mono">@{submission.discordUsername}</span>
              </div>
            )}
          </div>

          {/* Optional Story / Concept Callout */}
          {submission.storyConcept && (
            <div className="p-4 rounded-2xl bg-amber-50/70 backdrop-blur-xs border border-amber-200/80 shadow-2xs text-stone-800 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#91621f]">
                <BookOpen className="w-3.5 h-3.5" />
                Story & Concept Inspiration
              </div>
              <p className="text-xs sm:text-sm italic leading-relaxed text-[#5e4a2f]">
                “{submission.storyConcept}”
              </p>
            </div>
          )}

          {/* Formatted Lyrics Body */}
          <div className="pt-2">{renderFormattedLyrics()}</div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-sky-50 text-[#0284c7] flex items-center justify-center shadow-xs">
            <FileText className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-bold text-stone-900">
              No Contest Song Selected
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mt-1 leading-relaxed">
              Select an entry from the song picker or click 'Grade This Song' in the Song Entries tab to view lyrics and submit your evaluation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
