import React, { useState, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  HelpCircle,
  Music,
  Flag,
  ShieldAlert,
  Quote,
} from 'lucide-react';
import { SummertideFlowerLogo } from './SummertideFlowerLogo';
import { HibiscusInlay } from './HibiscusInlay';
import {
  CRITERIA_CONFIG,
  TIER_DESCRIPTIONS,
  getTier,
  getSummaryNarration,
  JudgeScoreSubmission,
  ContestSongEntry,
  SongFlag,
  FlagReason,
} from '../types/contest';
import { LyricReaderPanel } from './LyricReaderPanel';
import { ParsedLyricSubmission } from '../utils/lyricParser';
import { FlagSongModal } from './FlagSongModal';

interface ScorecardViewProps {
  initialEntrantName?: string;
  defaultJudgeName?: string;
  onSubmitScore: (score: JudgeScoreSubmission) => Promise<boolean>;
  isSubmitting?: boolean;
  knownJudges: string[];
  knownEntrants: string[];
  existingScores?: JudgeScoreSubmission[];
  contestSongs?: ContestSongEntry[];
  flags?: SongFlag[];
  onFlagSong?: (
    songId: string,
    songTitle: string,
    entrantName: string,
    reason: FlagReason,
    reasonLabel: string,
    notes: string
  ) => Promise<void>;
  isAdmin?: boolean;
  onGoToSongEntries?: () => void;
  onTriggerDuplicateModal?: (song: ContestSongEntry, filename?: string) => void;
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({
  initialEntrantName = '',
  defaultJudgeName = '',
  onSubmitScore,
  isSubmitting = false,
  knownJudges,
  knownEntrants,
  existingScores = [],
  contestSongs = [],
  flags = [],
  onFlagSong,
  isAdmin = false,
  onGoToSongEntries,
  onTriggerDuplicateModal,
}) => {
  const [judgeName, setJudgeName] = useState(defaultJudgeName || '');
  const [entrantName, setEntrantName] = useState(initialEntrantName || '');
  const [comments, setComments] = useState('');
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);

  // Split-Screen Lyrics Panel State (always visible side-by-side)
  const [parsedSubmission, setParsedSubmission] = useState<ParsedLyricSubmission>({
    songTitle: '',
    alias: '',
    discordUsername: '',
    storyConcept: '',
    lyrics: '',
    formattedEntrantName: '',
  });

  // 4 Criteria scores (default to 18 like in the original scorecard)
  const [scores, setScores] = useState<{ [key: string]: number }>({
    writing: 18,
    originality: 18,
    emotion: 18,
    structure: 18,
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Sync judge name if defaultJudgeName prop updates
  useEffect(() => {
    if (defaultJudgeName && defaultJudgeName !== judgeName) {
      setJudgeName(defaultJudgeName);
    }
  }, [defaultJudgeName]);

  // Sync with initial entrant or pre-loaded song
  useEffect(() => {
    if (initialEntrantName) {
      setEntrantName(initialEntrantName);

      // Check contestSongs first
      const songMatch = contestSongs.find(
        (s) =>
          s.songTitle.trim().toLowerCase() === initialEntrantName.trim().toLowerCase() ||
          s.formattedEntrantName.trim().toLowerCase() === initialEntrantName.trim().toLowerCase()
      );

      if (songMatch) {
        setParsedSubmission({
          songTitle: songMatch.songTitle,
          alias: songMatch.alias || '',
          discordUsername: songMatch.discordUsername || '',
          storyConcept: songMatch.storyConcept || '',
          lyrics: songMatch.lyrics || '',
          formattedEntrantName: songMatch.formattedEntrantName || songMatch.songTitle,
        });
      } else {
        // Fallback to check if existing scores have lyrics
        const matched = existingScores.find(
          (s) => s.entrantName.trim().toLowerCase() === initialEntrantName.trim().toLowerCase()
        );
        if (matched && matched.lyrics) {
          setParsedSubmission({
            songTitle: matched.songTitle || initialEntrantName,
            alias: matched.alias || '',
            discordUsername: matched.discordUsername || '',
            storyConcept: matched.storyConcept || '',
            lyrics: matched.lyrics || '',
            formattedEntrantName: initialEntrantName,
          });
        }
      }
    }
  }, [initialEntrantName, contestSongs, existingScores]);

  // Check if current judge has already submitted a score for this song
  const alreadySubmittedScore = React.useMemo(() => {
    const j = (judgeName || defaultJudgeName).trim().toLowerCase();
    const song = (parsedSubmission.songTitle || entrantName).trim().toLowerCase();
    const entrant = entrantName.trim().toLowerCase();

    if (!j || (!song && !entrant)) return null;

    return existingScores.find((s) => {
      const matchJudge = s.judgeName.trim().toLowerCase() === j;
      if (!matchJudge) return false;

      const sSong = (s.songTitle || '').trim().toLowerCase();
      const sEntrant = s.entrantName.trim().toLowerCase();

      return (
        (song && sSong === song) ||
        (entrant && sEntrant === entrant) ||
        (song && sEntrant === song) ||
        (entrant && sSong === entrant)
      );
    });
  }, [existingScores, judgeName, defaultJudgeName, parsedSubmission.songTitle, entrantName]);

  const isAlreadySubmitted = !!alreadySubmittedScore;

  // Check if current song is flagged / aborted by any judge or producer
  const activeFlag = React.useMemo(() => {
    const currentSongTitle = (parsedSubmission.songTitle || entrantName).trim().toLowerCase();
    const currentEntrant = entrantName.trim().toLowerCase();
    if (!currentSongTitle && !currentEntrant) return null;

    return flags.find((f) => {
      const fSong = (f.songTitle || '').trim().toLowerCase();
      const fEntrant = (f.entrantName || '').trim().toLowerCase();
      return (
        (currentSongTitle && fSong === currentSongTitle) ||
        (currentEntrant && fEntrant === currentEntrant) ||
        (currentSongTitle && fEntrant === currentSongTitle)
      );
    });
  }, [flags, parsedSubmission.songTitle, entrantName]);

  const isFlagged = !!activeFlag;

  // Pre-fill score if already submitted
  useEffect(() => {
    if (alreadySubmittedScore) {
      setScores({
        writing: alreadySubmittedScore.writing,
        originality: alreadySubmittedScore.originality,
        emotion: alreadySubmittedScore.emotion,
        structure: alreadySubmittedScore.structure,
      });
      if (alreadySubmittedScore.comments) {
        setComments(alreadySubmittedScore.comments);
      }
    }
  }, [alreadySubmittedScore]);

  const handleConfirmFlagModal = async (reason: FlagReason, reasonLabel: string, notes: string) => {
    if (!onFlagSong) return;

    const activeJudge = (judgeName || defaultJudgeName).trim();
    const activeEntrant = (entrantName || parsedSubmission.formattedEntrantName || parsedSubmission.songTitle).trim();
    const activeTitle = (parsedSubmission.songTitle || activeEntrant).trim();

    // Look for song ID if available
    const songMatch = contestSongs.find(
      (s) =>
        s.songTitle.trim().toLowerCase() === activeTitle.toLowerCase() ||
        s.formattedEntrantName.trim().toLowerCase() === activeEntrant.toLowerCase()
    );
    const songId = songMatch?.id || `song-${Date.now()}`;

    await onFlagSong(songId, activeTitle, activeEntrant, reason, reasonLabel, notes);
    setIsFlagModalOpen(false);

    setStatusMessage({
      type: 'info',
      text: `Song "${activeTitle}" has been flagged for ${reasonLabel}. Scoring for this entry is aborted.`,
    });
  };

  const totalScore =
    scores.writing + scores.originality + scores.emotion + scores.structure;
  const averageScore = totalScore / 4;
  const meterFillPercent = Math.min(100, Math.round(totalScore));
  const summaryNarration = getSummaryNarration(totalScore);

  const handleScoreChange = (key: string, val: number) => {
    if (isAlreadySubmitted || isFlagged) return;
    const clamped = Math.max(1, Math.min(25, val));
    setScores((prev) => ({
      ...prev,
      [key]: clamped,
    }));
  };

  const handleReset = () => {
    if (isAlreadySubmitted || isFlagged) return;
    setScores({
      writing: 18,
      originality: 18,
      emotion: 18,
      structure: 18,
    });
    setStatusMessage({ type: 'info', text: 'All criteria reset to default 18.' });
  };

  const handleClearLyrics = () => {
    setParsedSubmission({
      songTitle: '',
      alias: '',
      discordUsername: '',
      storyConcept: '',
      lyrics: '',
      formattedEntrantName: '',
    });
  };

  // Direct Lyric Quoting handler: appends quoted lyrics & note into the judge's personal opinion
  const handleQuoteLyric = (quoteText: string, judgeNote?: string) => {
    const cleanQuote = quoteText.trim();
    if (!cleanQuote) return;

    const formattedBlock = judgeNote && judgeNote.trim()
      ? `> "${cleanQuote}"\n— ${judgeNote.trim()}`
      : `> "${cleanQuote}"`;

    setComments((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return formattedBlock + '\n\n';
      }
      return `${trimmed}\n\n${formattedBlock}\n\n`;
    });

    setStatusMessage({
      type: 'info',
      text: `Quoted "${cleanQuote.slice(0, 36)}${cleanQuote.length > 36 ? '...' : ''}" to your opinion.`,
    });
    setTimeout(() => {
      setStatusMessage((current) => (current?.type === 'info' ? null : current));
    }, 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAlreadySubmitted) {
      setStatusMessage({
        type: 'error',
        text: 'This scorecard has already been submitted. Resubmissions are not permitted.',
      });
      return;
    }

    if (isFlagged) {
      setStatusMessage({
        type: 'error',
        text: 'Scoring for this entry has been aborted due to a reported rule violation.',
      });
      return;
    }

    const activeJudge = (judgeName || defaultJudgeName).trim();
    if (!activeJudge) {
      setStatusMessage({ type: 'error', text: 'Please set your Judge or Producer name before scoring.' });
      return;
    }

    const activeEntrant = (entrantName || parsedSubmission.formattedEntrantName || parsedSubmission.songTitle).trim();
    if (!activeEntrant) {
      setStatusMessage({ type: 'error', text: 'Please select a contest song to evaluate.' });
      return;
    }

    const payload: JudgeScoreSubmission = {
      timestamp: new Date().toISOString(),
      judgeName: activeJudge,
      entrantName: activeEntrant,
      songTitle: parsedSubmission.songTitle || activeEntrant,
      alias: parsedSubmission.alias || undefined,
      discordUsername: parsedSubmission.discordUsername || undefined,
      storyConcept: parsedSubmission.storyConcept || undefined,
      lyrics: parsedSubmission.lyrics || undefined,
      comments: comments.trim(),
      writing: scores.writing,
      originality: scores.originality,
      emotion: scores.emotion,
      structure: scores.structure,
      totalScore,
      averageScore,
    };

    const success = await onSubmitScore(payload);
    if (success) {
      setStatusMessage({
        type: 'success',
        text: `Score of ${totalScore}/100 recorded for "${payload.songTitle}". Submission is now officially submitted and locked.`,
      });
    }
  };

  const handleExportText = () => {
    const lines = [
      '==================================================',
      'SUMMERTIDE STUDIO — LYRIC CONTEST JUDGE SCORECARD',
      `Date & Time: ${new Date().toLocaleString()}`,
      `Judge / Producer: ${judgeName.trim() || 'Not provided'}`,
      `Entrant / Submission: ${entrantName.trim() || 'Not provided'}`,
      parsedSubmission.alias ? `Artist / Alias: ${parsedSubmission.alias}` : '',
      parsedSubmission.discordUsername ? `Discord: @${parsedSubmission.discordUsername}` : '',
      parsedSubmission.storyConcept ? `Story / Concept: ${parsedSubmission.storyConcept}` : '',
      '',
      `1. Writing Quality: ${scores.writing}/25 (${getTier(scores.writing).label})`,
      `2. Originality & Creativity: ${scores.originality}/25 (${getTier(scores.originality).label})`,
      `3. Emotional Impact & Storytelling: ${scores.emotion}/25 (${getTier(scores.emotion).label})`,
      `4. Structure & Cohesion: ${scores.structure}/25 (${getTier(scores.structure).label})`,
      '',
      `TOTAL JUDGE SCORE: ${totalScore}/100`,
      `AVERAGE PER CRITERION: ${averageScore.toFixed(2)}/25`,
      `EVALUATION: ${summaryNarration}`,
      '',
      "Personal Opinion / Judge's Comments:",
      comments.trim() || 'None provided',
      '',
      parsedSubmission.lyrics ? '--- LYRICS ---\n' + parsedSubmission.lyrics : '',
    ].filter(Boolean);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summertide-scorecard-${(entrantName || 'submission')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'info', text: 'Scorecard text file exported.' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto py-2 sm:py-6 animate-in fade-in duration-200">
      {/* Header Info Banner - Translucent Frosted Glass with iOS Edge Highlight */}
      <div className="relative overflow-hidden rounded-3xl bg-white/65 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(255,20,147,0.1),0_1px_1px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60 p-5 sm:p-6 mb-6">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-gradient-to-br from-pink-300/25 to-sky-200/20 rounded-full blur-2xl pointer-events-none" />
        
        {/* Hibiscus Inlay Debossed Watermark */}
        <HibiscusInlay size="xl" position="bottom-right" opacity="opacity-[0.055] sm:opacity-[0.07]" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100/90 text-pink-700 border border-pink-300/80 text-xs font-bold uppercase tracking-wider mb-2.5 shadow-2xs">
              <SummertideFlowerLogo size="xs" />
              <span>Summertide Studio · Judging Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
              {parsedSubmission.songTitle ? `Scoring: ${parsedSubmission.songTitle}` : 'Lyric Contest Judge Scorecard'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-700 font-medium mt-1.5 max-w-3xl leading-relaxed">
              Score each eligible submission across four criteria (1 to 25 pts each, max 100). Take notes directly next to the lyrics on the left to quote lines straight into your personal opinion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 bg-white/90 border border-stone-200/90 rounded-xl text-xs font-semibold text-stone-700 shadow-2xs">
              Judge: <span className="font-bold text-stone-900">{judgeName || defaultJudgeName || 'Judge'}</span>
            </div>
            {onGoToSongEntries && (
              <button
                type="button"
                onClick={onGoToSongEntries}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-[#0284c7] text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <Music className="w-3.5 h-3.5" />
                <span>Browse All Songs</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left side lyrics with line notes, Right side scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Lyric Reader Panel */}
        <div className="lg:sticky lg:top-24">
          <LyricReaderPanel
            submission={parsedSubmission}
            onClear={handleClearLyrics}
            onQuoteLyric={handleQuoteLyric}
            onFlagSong={onFlagSong && !activeFlag && !isAlreadySubmitted ? () => setIsFlagModalOpen(true) : undefined}
            isFlagged={isFlagged}
            isAlreadySubmitted={isAlreadySubmitted}
          />
        </div>

        {/* Right Column: Scorecard Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_60px_rgba(255,20,147,0.1),0_1px_1px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60 p-5 sm:p-8 space-y-6 relative overflow-hidden"
        >
          {/* Hibiscus Inlay Debossed Watermark */}
          <HibiscusInlay size="xl" position="bottom-right" opacity="opacity-[0.05] sm:opacity-[0.065]" />

          {/* If entry is flagged, show prominent Aborted / Rule Violation Banner */}
          {activeFlag && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-black text-rose-950 flex flex-wrap items-center gap-2">
                    <span>Scoring Aborted · Rule Violation Reported</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                      {activeFlag.reasonLabel}
                    </span>
                  </div>
                  <div className="text-xs text-rose-800 mt-1 leading-relaxed">
                    This submission was reported by <strong>{activeFlag.flaggedBy}</strong> on{' '}
                    {new Date(activeFlag.flaggedAt).toLocaleDateString()}. Status:{' '}
                    <strong className="uppercase">
                      {activeFlag.status === 'disqualified'
                        ? 'Disqualified by Contest Producer'
                        : 'Scoring Aborted (Pending Producer Review)'}
                    </strong>
                    .
                  </div>
                  {activeFlag.notes && (
                    <div className="mt-2 text-xs bg-white/80 p-2.5 rounded-xl border border-rose-200 text-rose-900 italic">
                      “{activeFlag.notes}”
                    </div>
                  )}
                </div>
              </div>

              {onGoToSongEntries && (
                <button
                  type="button"
                  onClick={onGoToSongEntries}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Select Another Song →
                </button>
              )}
            </div>
          )}

          {/* If already submitted, display clear submission status banner */}
          {isAlreadySubmitted && alreadySubmittedScore && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-black text-emerald-950 flex items-center gap-2">
                    <span>Score Already Submitted</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                      Locked
                    </span>
                  </div>
                  <div className="text-xs text-emerald-800 mt-0.5">
                    You have already submitted an official score of <strong>{alreadySubmittedScore.totalScore}/100</strong> for this song
                    {alreadySubmittedScore.timestamp ? ` on ${new Date(alreadySubmittedScore.timestamp).toLocaleDateString()}` : ''}. Resubmissions are not permitted.
                  </div>
                </div>
              </div>

              {onGoToSongEntries && (
                <button
                  type="button"
                  onClick={onGoToSongEntries}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Score Another Song →
                </button>
              )}
            </div>
          )}

          {/* QUICK SCALE REFERENCE */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Quick Scale Reference</span>
              </h4>
              <span className="text-[11px] text-[#0284c7] font-semibold bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                1–25 Allowed (25 Max)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {TIER_DESCRIPTIONS.map((t) => (
                <div key={t.range} className="p-2.5 rounded-xl border border-sky-100 bg-sky-50/50">
                  <div className="font-extrabold text-[#0284c7]">{t.range}</div>
                  <div className="text-stone-700 font-semibold text-[11px] mt-0.5">{t.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-sky-900 bg-sky-50 border border-sky-200/80 rounded-xl p-2.5">
              <strong>Scoring standard:</strong> Each criterion is evaluated from 1 to 25, allowing a full potential total score of 100 points.
            </div>
          </div>

          {/* Section Heading: Scoring Criteria */}
          <div className="pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Scoring Criteria
              </h3>
              <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                Awardable range: 1–25 each
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Adjust sliders to score the lyric submission across each area.
            </p>
          </div>

          {/* The 4 Criteria Sliders */}
          <div className="space-y-6 divide-y divide-stone-100">
            {CRITERIA_CONFIG.map((c, idx) => {
              const currentScore = scores[c.key] || 18;
              const tier = getTier(currentScore);

              return (
                <div key={c.key} className={idx > 0 ? 'pt-5' : ''}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">
                        {idx + 1}. {c.name}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">{c.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-[#0284c7] tabular-nums">
                        {currentScore}
                      </span>
                      <span className="text-xs text-stone-400 font-semibold"> / 25</span>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="mt-4">
                    <input
                      type="range"
                      min="1"
                      max="25"
                      value={currentScore}
                      disabled={isAlreadySubmitted || isFlagged}
                      onChange={(e) => handleScoreChange(c.key, Number(e.target.value))}
                      aria-label={`${c.name} score`}
                      className={`w-full h-2 rounded-lg appearance-none transition-all accent-[#0284c7] ${
                        isAlreadySubmitted || isFlagged
                          ? 'bg-stone-300 opacity-60 cursor-not-allowed'
                          : 'bg-stone-200 cursor-pointer'
                      }`}
                    />
                    <div className="flex justify-between text-[11px] text-stone-400 mt-1 font-medium">
                      <span>1 · Poor</span>
                      <span>13 · Competent</span>
                      <span>25 · Exceptional</span>
                    </div>
                  </div>

                  {/* Tier Badge */}
                  <div className="mt-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${tier.bg} ${tier.color}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{tier.label}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Score Summary Banner: Vibrant Sea Blue Theme */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#075985] text-white shadow-xl border border-sky-400/30">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold text-sky-200 tracking-wider uppercase">
                  Total Judge Score
                </div>
                <div className="text-3xl sm:text-5xl font-black tracking-tight mt-1 text-white tabular-nums drop-shadow-xs">
                  {totalScore}
                  <span className="text-lg sm:text-2xl text-sky-200 font-bold ml-1.5">
                    / 100
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs text-sky-200">Average per criterion</div>
                <div className="text-lg sm:text-xl font-bold text-white mt-0.5 tabular-nums">
                  {averageScore.toFixed(2)} / 25
                </div>
              </div>
            </div>

            {/* Progress Bar Meter */}
            <div className="w-full h-2.5 bg-black/25 rounded-full overflow-hidden mt-4 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-sky-300 to-cyan-200 transition-all duration-200 rounded-full shadow-xs"
                style={{ width: `${meterFillPercent}%` }}
              />
            </div>

            <div className="mt-3 text-xs sm:text-sm text-sky-100 font-medium">
              {summaryNarration}
            </div>
          </div>

          {/* PERSONAL OPINION / JUDGE'S COMMENTS with Direct Lyric Quoting */}
          <div className="pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Personal Opinion / Judge's Comments{' '}
                <span className="text-stone-400 font-normal lowercase">
                  {isFlagged ? '(aborted)' : isAlreadySubmitted ? '(submitted)' : '(optional)'}
                </span>
              </label>
              {comments && !isAlreadySubmitted && !isFlagged && (
                <button
                  type="button"
                  onClick={() => setComments('')}
                  className="text-[11px] text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear Notes
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={comments}
              disabled={isAlreadySubmitted || isFlagged}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                isAlreadySubmitted
                  ? 'Official scorecard and opinion submitted. Comments and notes are locked.'
                  : isFlagged
                  ? 'Scoring has been aborted due to a reported rule violation.'
                  : "Share thoughts, critique, or click 'Note / Quote' next to any lyric line on the left to quote directly with your note…"
              }
              className={`w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7] focus:border-transparent transition-all ${
                isAlreadySubmitted || isFlagged ? 'bg-stone-50 text-stone-600 cursor-not-allowed opacity-80' : ''
              }`}
            />
            <p className="text-[11px] text-stone-500 mt-1.5 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
              <span>
                {isAlreadySubmitted
                  ? 'Score submitted — lyric notes and opinion are locked for integrity.'
                  : 'Quotes and notes taken on the lyric sheet appear directly in this opinion box.'}
              </span>
            </p>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-stone-100 text-stone-800 border border-stone-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <SummertideFlowerLogo size="xs" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Submission & Action Buttons in Sea Blue */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            {isFlagged ? (
              <div className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm shadow-md">
                <ShieldAlert className="w-5 h-5 text-rose-200" />
                <span>Scoring Aborted · {activeFlag?.reasonLabel}</span>
              </div>
            ) : isAlreadySubmitted ? (
              <div className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>Score Has Been Submitted ({totalScore}/100)</span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || (!parsedSubmission.songTitle && !entrantName)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-md transition-all hover:shadow-lg disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Saving Scorecard...'
                    : 'Record Official Scorecard'}
                </span>
              </button>
            )}

            <div className="flex items-center gap-2">
              {onFlagSong && !activeFlag && !isAlreadySubmitted && (
                <button
                  type="button"
                  onClick={() => setIsFlagModalOpen(true)}
                  className="p-2.5 rounded-xl border border-rose-300 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Flag / Abort entry for rule violations"
                >
                  <Flag className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Flag / Abort</span>
                </button>
              )}

              {onGoToSongEntries && (
                <button
                  type="button"
                  onClick={onGoToSongEntries}
                  className="p-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-[#0284c7] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Other Songs</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportText}
                className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export scorecard (.txt)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export .txt</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Print Scorecard"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>

              {!isAlreadySubmitted && !isFlagged && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset scores to default 18"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Flag & Abort Entry Modal */}
      <FlagSongModal
        isOpen={isFlagModalOpen}
        songTitle={parsedSubmission.songTitle || entrantName}
        entrantName={entrantName}
        judgeName={judgeName || defaultJudgeName || 'Judge'}
        onConfirmFlag={handleConfirmFlagModal}
        onClose={() => setIsFlagModalOpen(false)}
      />
    </div>
  );
};
