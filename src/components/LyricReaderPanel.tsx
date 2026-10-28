import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Copy,
  Check,
  User,
  MessageCircle,
  BookOpen,
  X,
  Quote,
  MessageSquare,
  CornerDownRight,
  Flag,
} from 'lucide-react';
import { ParsedLyricSubmission } from '../utils/lyricParser';
import { DiscordHandleReveal } from './DiscordHandleReveal';

interface LyricReaderPanelProps {
  submission: ParsedLyricSubmission;
  onClear?: () => void;
  onQuoteLyric?: (quoteText: string, judgeNote?: string) => void;
  onFlagSong?: () => void;
  isFlagged?: boolean;
  isAlreadySubmitted?: boolean;
  embedded?: boolean;
}

export const LyricReaderPanel: React.FC<LyricReaderPanelProps> = ({
  submission,
  onClear,
  onQuoteLyric,
  onFlagSong,
  isFlagged = false,
  isAlreadySubmitted = false,
  embedded = false,
}) => {
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isCopied, setIsCopied] = useState(false);

  // Inline Note Editor State per line
  const [activeNoteLineIndex, setActiveNoteLineIndex] = useState<number | null>(null);
  const [lineNoteText, setLineNoteText] = useState('');
  const [recentlyQuotedIndex, setRecentlyQuotedIndex] = useState<number | null>(null);

  // Section Quote Box State (e.g. [Verse], [Chorus])
  const [activeSectionHeaderIndex, setActiveSectionHeaderIndex] = useState<number | null>(null);
  const [sectionNoteText, setSectionNoteText] = useState('');
  const [recentlyQuotedSectionIndex, setRecentlyQuotedSectionIndex] = useState<number | null>(null);

  // Floating text selection state
  const [selectedText, setSelectedText] = useState('');
  const [selectionPos, setSelectionPos] = useState<{ top: number; left: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const hasContent = !!(
    submission.songTitle ||
    submission.alias ||
    submission.lyrics ||
    submission.storyConcept
  );

  // Quoting and line noting is only permitted before submission
  const canQuote = !!onQuoteLyric && !isAlreadySubmitted && !isFlagged;

  const handleCopyLyrics = () => {
    if (!submission.lyrics) return;
    navigator.clipboard.writeText(submission.lyrics);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Helper to extract all lyric lines belonging to a section header
  const getSectionLines = (headerIdx: number, allLines: string[]): string[] => {
    const secLines: string[] = [];
    for (let i = headerIdx + 1; i < allLines.length; i++) {
      const lineStr = allLines[i];
      if (/^\[[^\]]+\]/i.test(lineStr.trim())) {
        break;
      }
      secLines.push(lineStr);
    }
    // Trim leading/trailing blank lines
    while (secLines.length > 0 && !secLines[0].trim()) {
      secLines.shift();
    }
    while (secLines.length > 0 && !secLines[secLines.length - 1].trim()) {
      secLines.pop();
    }
    return secLines;
  };

  // Handle section quote submission
  const handleSendSectionQuote = (sectionHeader: string, secLines: string[], note?: string) => {
    if (!canQuote) return;
    const cleanLines = secLines.filter((l) => l.trim());
    if (cleanLines.length === 0) return;

    const fullSectionText = `${sectionHeader}\n${cleanLines.join('\n')}`;
    onQuoteLyric(fullSectionText, note);
    setRecentlyQuotedSectionIndex(activeSectionHeaderIndex);
    setActiveSectionHeaderIndex(null);
    setSectionNoteText('');

    setTimeout(() => {
      setRecentlyQuotedSectionIndex(null);
    }, 2500);
  };

  // Handle line quote submission
  const handleSendLineQuote = (lineText: string, note?: string) => {
    if (!canQuote) return;
    const cleanLine = lineText.trim();
    if (!cleanLine) return;

    onQuoteLyric(cleanLine, note);
    setRecentlyQuotedIndex(activeNoteLineIndex);
    setActiveNoteLineIndex(null);
    setLineNoteText('');

    setTimeout(() => {
      setRecentlyQuotedIndex(null);
    }, 2500);
  };

  // Handle floating selection quote
  const handleQuoteSelection = () => {
    if (!canQuote || !selectedText) return;
    onQuoteLyric(selectedText);
    setSelectedText('');
    setSelectionPos(null);
    window.getSelection()?.removeAllRanges();
  };

  // Track text selection within panel
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectedText('');
      setSelectionPos(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length > 2 && panelRef.current && panelRef.current.contains(sel.anchorNode)) {
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const panelRect = panelRef.current.getBoundingClientRect();

        setSelectedText(text);
        setSelectionPos({
          top: rect.top - panelRect.top - 38,
          left: Math.max(10, rect.left - panelRect.left + rect.width / 2 - 80),
        });
      } catch (e) {
        setSelectedText('');
        setSelectionPos(null);
      }
    } else {
      setSelectedText('');
      setSelectionPos(null);
    }
  };

  // Render stylized lyrics with colored badges for section tags and inline quote/note actions
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
            const sectionLines = getSectionLines(idx, lines);
            const hasSectionLines = sectionLines.length > 0;
            const isSectionOpen = activeSectionHeaderIndex === idx;
            const wasSectionJustQuoted = recentlyQuotedSectionIndex === idx;

            return (
              <div key={idx} className="pt-4 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={!canQuote}
                    onClick={() => {
                      if (!canQuote) return;
                      if (isSectionOpen) {
                        setActiveSectionHeaderIndex(null);
                      } else {
                        setActiveSectionHeaderIndex(idx);
                        setActiveNoteLineIndex(null);
                        setSectionNoteText('');
                      }
                    }}
                    className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 shadow-2xs border ${
                      isSectionOpen
                        ? 'bg-gradient-to-r from-[#0284c7] to-[#0891b2] text-white border-[#0284c7] shadow-sm ring-2 ring-[#0284c7]/20'
                        : canQuote
                        ? 'bg-sky-50/90 hover:bg-sky-100 text-[#0284c7] border-sky-200/80 hover:border-sky-300 cursor-pointer group'
                        : 'bg-sky-50 text-[#0284c7] border-sky-200/60 cursor-default'
                    }`}
                    title={
                      canQuote
                        ? isSectionOpen
                          ? `Close quote box for ${trimmed}`
                          : `Click to quote the entire ${trimmed} (${sectionLines.length} lines) to your opinion`
                        : trimmed
                    }
                  >
                    <span>{trimmed}</span>
                    {canQuote && hasSectionLines && (
                      <span
                        className={`overflow-hidden transition-all duration-200 ease-out inline-flex items-center ${
                          isSectionOpen
                            ? 'max-w-28 opacity-100 ml-1.5'
                            : 'max-w-0 opacity-0 group-hover:max-w-28 group-hover:opacity-100 group-hover:ml-1.5'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold lowercase px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap ${
                            isSectionOpen
                              ? 'bg-white/20 text-white'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          <Quote className="w-2.5 h-2.5 shrink-0" />
                          <span>{isSectionOpen ? 'close' : 'quote section'}</span>
                        </span>
                      </span>
                    )}
                  </button>

                  {wasSectionJustQuoted && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-in fade-in duration-150">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Quoted Entire Section!</span>
                    </span>
                  )}
                </div>

                {/* Expandable Section Quote Box */}
                {canQuote && isSectionOpen && (
                  <div className="mt-2.5 mb-3 p-4 bg-gradient-to-r from-sky-50 via-white to-pink-50/60 rounded-2xl border-2 border-sky-200 shadow-md space-y-3 font-sans animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-sky-900 border-b border-sky-100 pb-2">
                      <span className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#0284c7]">
                        <Quote className="w-4 h-4 text-[#0284c7]" />
                        <span>Quote Entire {trimmed} ({sectionLines.length} lines) to Opinion</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveSectionHeaderIndex(null)}
                        className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preview of the entire section */}
                    <div className="bg-white p-3 rounded-xl border border-sky-100 border-l-4 border-l-[#0284c7] font-serif text-xs sm:text-sm text-stone-800 leading-relaxed space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      <div className="text-[11px] font-sans font-bold text-[#0284c7] uppercase tracking-wider mb-1">
                        {trimmed} Content ({sectionLines.length} lines):
                      </div>
                      {sectionLines.map((sLine, sIdx) => (
                        <div key={sIdx} className={sLine.trim() ? '' : 'h-2'}>
                          {sLine}
                        </div>
                      ))}
                    </div>

                    {/* Note input and actions */}
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={sectionNoteText}
                        onChange={(e) => setSectionNoteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendSectionQuote(trimmed, sectionLines, sectionNoteText);
                          }
                        }}
                        placeholder={`Write your opinion or critique on this entire ${trimmed}...`}
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7] shadow-2xs"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSendSectionQuote(trimmed, sectionLines, '')}
                          className="px-3 py-1.5 aero-btn-secondary text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
                          title="Quote this section without extra commentary"
                        >
                          Quote Section Only
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendSectionQuote(trimmed, sectionLines, sectionNoteText)}
                          className="px-4 py-1.5 aero-btn-primary text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          <span>Insert Section & Note into Opinion</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (!trimmed) {
            return <div key={idx} className="h-3" />;
          }

          const isEditorOpen = activeNoteLineIndex === idx;
          const wasJustQuoted = recentlyQuotedIndex === idx;

          return (
            <div key={idx} className="group relative rounded-xl px-2 py-1 transition-colors hover:bg-sky-50/50">
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`leading-relaxed text-stone-800 font-serif tracking-normal flex-1 select-text ${
                    fontSize === 'sm'
                      ? 'text-xs'
                      : fontSize === 'lg'
                      ? 'text-base sm:text-lg'
                      : 'text-sm sm:text-base'
                  }`}
                >
                  {line}
                </div>

                {/* Inline Quote / Note Trigger - only available before submission */}
                {canQuote && (
                  <div className="shrink-0 flex items-center gap-1">
                    {wasJustQuoted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 animate-in fade-in duration-150">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Quoted!
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditorOpen) {
                            setActiveNoteLineIndex(null);
                          } else {
                            setActiveNoteLineIndex(idx);
                            setLineNoteText('');
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer font-sans shadow-2xs ${
                          isEditorOpen
                            ? 'bg-gradient-to-r from-[#0284c7] to-[#0891b2] text-white opacity-100'
                            : 'opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-sky-100 text-[#0284c7] border border-sky-200/70'
                        }`}
                        title="Add note next to this lyric and quote to your opinion"
                      >
                        <Quote className="w-3 h-3" />
                        <span className="hidden sm:inline">Note / Quote</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Expandable Inline Note Box - only available before submission */}
              {canQuote && isEditorOpen && (
                <div className="mt-2.5 mb-3 p-3 bg-gradient-to-r from-sky-50/90 via-white to-pink-50/60 rounded-xl border border-sky-200/90 shadow-sm space-y-2.5 font-sans animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-900">
                    <span className="flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-[#0284c7]" />
                      Quote to Judge's Opinion
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveNoteLineIndex(null)}
                      className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs italic text-stone-700 bg-white/90 p-2.5 rounded-lg border border-sky-100 border-l-2 border-l-[#0284c7] font-serif">
                    “{trimmed}”
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={lineNoteText}
                      onChange={(e) => setLineNoteText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendLineQuote(trimmed, lineNoteText);
                        }
                      }}
                      placeholder="Write your note or feedback on this line..."
                      className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7] shadow-2xs"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendLineQuote(trimmed, '')}
                        className="px-2.5 py-1.5 aero-btn-secondary text-stone-700 text-xs font-bold rounded-lg cursor-pointer"
                        title="Quote lyric line without extra commentary"
                      >
                        Quote Line Only
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendLineQuote(trimmed, lineNoteText)}
                        className="px-3.5 py-1.5 aero-btn-primary text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Insert into Opinion</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
    <div
      ref={panelRef}
      onMouseUp={handleMouseUp}
      className={
        embedded
          ? 'flex flex-col w-full h-full relative'
          : 'aero-glass rounded-3xl p-5 sm:p-7 flex flex-col h-full relative animate-in fade-in duration-200'
      }
    >
      {/* Floating Selection Tooltip - only available before submission */}
      {canQuote && selectedText && selectionPos && (
        <div
          style={{ top: `${selectionPos.top}px`, left: `${selectionPos.left}px` }}
          className="absolute z-30 transform -translate-y-full animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            onClick={handleQuoteSelection}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full aero-btn-primary text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <Quote className="w-3 h-3 text-cyan-200" />
            <span>Quote Selection to Opinion</span>
          </button>
        </div>
      )}

      {/* Top Header - only rendered in standalone view, removed in embedded scorecard view */}
      {!embedded && (
        <div className="flex items-start justify-between pb-4 border-b border-stone-200 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                Lyric Sheet Viewer
              </span>
              {hasContent && (
                <span className="text-[11px] text-stone-500 font-medium">
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
                  className="p-2 rounded-xl aero-btn-secondary text-stone-700 cursor-pointer"
                  title="Copy raw lyrics"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
                </button>

                {onFlagSong && !isFlagged && !isAlreadySubmitted && (
                  <button
                    type="button"
                    onClick={onFlagSong}
                    className="p-2 rounded-xl aero-btn-rose text-white cursor-pointer"
                    title="Flag / Abort entry for rule violations"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}

                {onClear && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="p-2 rounded-xl aero-btn-secondary text-stone-400 hover:text-rose-600 cursor-pointer"
                    title="Clear lyric view"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content Body */}
      {hasContent ? (
        <div className={`flex-1 overflow-y-auto overflow-x-hidden space-y-3 ${embedded ? 'pt-0' : 'pt-4'} pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}>
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
              <DiscordHandleReveal username={submission.discordUsername} size="sm" />
            )}

            {!embedded && isAlreadySubmitted && (
              <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hidden sm:inline-flex items-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-600" />
                Score Submitted · Lyric Notes & Quotes Locked
              </span>
            )}
          </div>

          {/* Optional Story / Concept Callout */}
          {submission.storyConcept && (
            <div className="p-4 rounded-2xl aero-glass border border-amber-300/80 shadow-2xs text-stone-800 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#91621f]">
                <BookOpen className="w-3.5 h-3.5" />
                Story & Concept Inspiration
              </div>
              <p className="text-xs sm:text-sm italic leading-relaxed text-[#5e4a2f]">
                “{submission.storyConcept}”
              </p>
            </div>
          )}

          {/* Formatted Lyrics Body with Vertical Scrollbar */}
          <div
            className={`pt-1 ${
              embedded ? 'max-h-[420px] sm:max-h-[480px]' : 'max-h-[480px] sm:max-h-[560px]'
            } overflow-y-auto pr-2 sm:pr-3 [scrollbar-width:thin] [scrollbar-color:#0284c7_rgba(224,242,254,0.7)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-sky-100/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-sky-300 [&::-webkit-scrollbar-thumb]:via-[#0284c7] [&::-webkit-scrollbar-thumb]:to-[#0369a1] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-white/90`}
          >
            {renderFormattedLyrics()}
          </div>
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
              Select an entry in the Song Entries tab by clicking 'Grade This Song' to view lyrics and submit your evaluation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
