import React, { useState, useEffect, useRef } from 'react';
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

  // Interactive Frutiger Aqua wave & ripple state for the Total Score box
  const [scoreAquaHover, setScoreAquaHover] = useState(false);
  const [scoreAquaMousePos, setScoreAquaMousePos] = useState({ x: 0, y: 0, normX: 0, normY: 0 });
  const [scoreAquaRipples, setScoreAquaRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const scoreAquaBoxRef = useRef<HTMLDivElement>(null);

  const handleScoreAquaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scoreAquaBoxRef.current) return;
    const rect = scoreAquaBoxRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;
    setScoreAquaMousePos({ x, y, normX, normY });
  };

  const handleScoreAquaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scoreAquaBoxRef.current) return;
    const rect = scoreAquaBoxRef.current.getBoundingClientRect();
    const rippleX = e.clientX - rect.left;
    const rippleY = e.clientY - rect.top;
    const id = Date.now();
    setScoreAquaRipples((prev) => [...prev.slice(-3), { id, x: rippleX, y: rippleY }]);
    setTimeout(() => {
      setScoreAquaRipples((prev) => prev.filter((r) => r.id !== id));
    }, 750);
  };

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

  // Circular gauge dial calculations (Radius = 42, Circumference ≈ 263.89)
  const scoreRadius = 42;
  const scoreCircumference = 2 * Math.PI * scoreRadius;
  const scoreStrokeDashoffset = scoreCircumference - (totalScore / 100) * scoreCircumference;

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
      {/* Unified Single Box: Lyric Sheet & Scorecard Combined */}
      <form
        onSubmit={handleSubmit}
        className="aero-glass rounded-3xl p-5 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl border border-white/90"
      >
        {/* Hibiscus Inlay Debossed Watermark */}
        <HibiscusInlay size="xl" position="bottom-right" opacity="opacity-[0.05] sm:opacity-[0.065]" />

        {/* 1. Header of the Unified Box */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100/90 text-pink-700 border border-pink-300/80 text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
              <SummertideFlowerLogo size="xs" />
              <span>Summertide Studio · Judging Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
              {parsedSubmission.songTitle ? `Scoring: ${parsedSubmission.songTitle}` : 'Lyric Contest Judge Scorecard'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 bg-white/90 border border-stone-200/90 rounded-xl text-xs font-semibold text-stone-700 shadow-2xs">
              Judge: <span className="font-bold text-stone-900">{judgeName || defaultJudgeName || 'Judge'}</span>
            </div>
            {onGoToSongEntries && (
              <button
                type="button"
                onClick={onGoToSongEntries}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl aero-btn-secondary text-[#0284c7] text-xs font-bold transition-all cursor-pointer"
              >
                <Music className="w-3.5 h-3.5" />
                <span>Browse All Songs</span>
              </button>
            )}
            {onFlagSong && !activeFlag && !isAlreadySubmitted && (
              <button
                type="button"
                onClick={() => setIsFlagModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl aero-btn-rose text-white text-xs font-bold transition-all cursor-pointer"
                title="Report rule violation or AI generation"
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Report Entry</span>
              </button>
            )}
          </div>
        </div>

        {/* If entry is flagged, show prominent Aborted / Rule Violation Banner */}
        {activeFlag && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl aero-btn-rose text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
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
                className="px-4 py-2 aero-btn-rose text-white font-bold text-xs rounded-xl cursor-pointer whitespace-nowrap shrink-0"
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
              <div className="w-10 h-10 rounded-2xl aero-btn-emerald text-white flex items-center justify-center shrink-0 shadow-2xs">
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
                className="px-4 py-2 aero-btn-emerald text-white font-bold text-xs rounded-xl cursor-pointer whitespace-nowrap shrink-0"
              >
                Score Another Song →
              </button>
            )}
          </div>
        )}

        {/* Upper Main Area: Lyrics on Left, Criteria on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Embedded Lyric Sheet Viewer */}
          <div className="lg:col-span-6 bg-white/70 backdrop-blur-xs rounded-2xl p-3.5 sm:p-4 -mt-1 sm:-mt-2 border border-sky-100/90 shadow-2xs flex flex-col h-full">
            <LyricReaderPanel
              submission={parsedSubmission}
              onClear={handleClearLyrics}
              onQuoteLyric={handleQuoteLyric}
              onFlagSong={onFlagSong && !activeFlag && !isAlreadySubmitted ? () => setIsFlagModalOpen(true) : undefined}
              isFlagged={isFlagged}
              isAlreadySubmitted={isAlreadySubmitted}
              embedded={true}
            />
          </div>

          {/* Right Column: Scoring Criteria (All 4 stacked vertically to fit the space) */}
          <div className="lg:col-span-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2.5 shrink-0">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider">
                Scoring Criteria
              </h3>
            </div>

            <div className="flex flex-col gap-3 flex-1 justify-between">
              {CRITERIA_CONFIG.map((c, idx) => {
                const currentScore = scores[c.key] || 18;
                const tier = getTier(currentScore);

                return (
                  <div
                    key={c.key}
                    className="aero-glass-card p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between border border-white/80 shadow-xs hover:border-sky-300 transition-all flex-1"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                            {idx + 1}. {c.name}
                          </h4>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${tier.bg} ${tier.color}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{tier.label}</span>
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base sm:text-lg font-black text-[#0284c7] tabular-nums">
                            {currentScore}
                          </span>
                          <span className="text-xs text-stone-400 font-semibold"> / 25</span>
                        </div>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-1" title={c.description}>
                        {c.description}
                      </p>
                    </div>

                    {/* Slider & Scale Marks */}
                    <div className="mt-2.5">
                      <input
                        type="range"
                        min="1"
                        max="25"
                        value={currentScore}
                        disabled={isAlreadySubmitted || isFlagged}
                        onChange={(e) => handleScoreChange(c.key, Number(e.target.value))}
                        aria-label={`${c.name} score`}
                        className={`w-full h-2 rounded-lg transition-all aero-slider ${
                          isAlreadySubmitted || isFlagged
                            ? 'opacity-60 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      />
                      <div className="flex justify-between text-[10px] text-stone-400 mt-0.5 font-medium">
                        <span>1 · Poor</span>
                        <span>13 · Competent</span>
                        <span>25 · Exceptional</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Total Score underneath, next to Opinion and Submit Button */}
        <div className="pt-2 border-t border-stone-200/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Total Score Block (lg:col-span-5) with Frutiger Aqua Visuals, Blue Theme & Full Interactivity */}
            <div
              ref={scoreAquaBoxRef}
              onMouseEnter={() => setScoreAquaHover(true)}
              onMouseLeave={() => {
                setScoreAquaHover(false);
                setScoreAquaMousePos({ x: 0, y: 0, normX: 0, normY: 0 });
              }}
              onMouseMove={handleScoreAquaMouseMove}
              onClick={handleScoreAquaClick}
              className="lg:col-span-5 relative overflow-hidden rounded-3xl p-5 sm:p-6 shrink-0 border-2 border-cyan-200/90 shadow-[0_20px_48px_-6px_rgba(2,132,199,0.28),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-4px_10px_rgba(6,182,212,0.25)] flex flex-col justify-center cursor-pointer select-none transition-all duration-300"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(240, 249, 255, 0.88) 42%, rgba(186, 230, 253, 0.92) 100%)',
                transform: scoreAquaHover
                  ? `perspective(800px) rotateX(${-scoreAquaMousePos.normY * 4}deg) rotateY(${scoreAquaMousePos.normX * 4}deg) translateY(-2px)`
                  : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)',
                transition: scoreAquaHover ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
              }}
            >
              {/* Top Curved Glass Specular Highlight (Signature Apple Aqua / Aero Gloss) */}
              <div
                className="pointer-events-none absolute top-0 left-0 right-0 h-1/2 rounded-t-3xl bg-gradient-to-b from-white/90 via-white/30 to-transparent"
                style={{ zIndex: 12 }}
              />

              {/* Dynamic Specular Follow-Mouse Spotlight */}
              {scoreAquaHover && (
                <div
                  className="pointer-events-none absolute inset-0 transition-opacity duration-200"
                  style={{
                    zIndex: 13,
                    background: `radial-gradient(circle 120px at ${scoreAquaMousePos.x}px ${scoreAquaMousePos.y}px, rgba(255,255,255,0.65) 0%, rgba(125,211,252,0.18) 45%, transparent 70%)`,
                  }}
                />
              )}

              {/* Interactive Click Water Ripples */}
              {scoreAquaRipples.map((ripple) => (
                <div
                  key={ripple.id}
                  className="pointer-events-none absolute w-24 h-24 rounded-full border-2 border-cyan-300 bg-cyan-400/20 shadow-[0_0_15px_rgba(56,189,248,0.6)] animate-water-ripple"
                  style={{
                    left: `${ripple.x}px`,
                    top: `${ripple.y}px`,
                    zIndex: 14,
                  }}
                />
              ))}

              {/* Animated Aqua Waves Water Reservoir (Fills lower 52% of the box, reacts to mouse hover) */}
              <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-[52%] overflow-hidden transition-all duration-300"
                style={{
                  zIndex: 5,
                  transform: `translateY(${scoreAquaHover ? -scoreAquaMousePos.normY * 6 : 0}px)`,
                }}
              >
                {/* Liquid Body Gradient with Caustic Water Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0284c7]/50 via-cyan-400/35 to-cyan-200/15 backdrop-blur-[1px]" />
                <div
                  className="absolute inset-0 pointer-events-none opacity-60"
                  style={{
                    background:
                      'radial-gradient(ellipse at 50% 120%, rgba(2, 132, 199, 0.45) 0%, transparent 75%), radial-gradient(circle at 25% 40%, rgba(103, 232, 249, 0.35) 0%, transparent 60%), radial-gradient(circle at 75% 50%, rgba(56, 189, 248, 0.35) 0%, transparent 60%)',
                  }}
                />

                {/* Deep Underwave Layer */}
                <div className="absolute -top-9 left-0 w-[240%] h-16 animate-aqua-wave-slow opacity-60">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id="scoreAquaBackWaveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="#0284c7" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#0369a1" stopOpacity="0.98" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,45 C150,90 350,10 500,50 C650,90 850,10 1000,50 C1150,90 1350,10 1500,50 L1500,120 L0,120 Z"
                      fill="url(#scoreAquaBackWaveGrad)"
                    />
                  </svg>
                </div>

                {/* Front Wave Layer (Vibrant Cyan Wave with Froth Crest) */}
                <div className="absolute -top-6 left-0 w-[240%] h-14 animate-aqua-wave opacity-90">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id="scoreAquaFrontWaveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95" />
                        <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,35 C180,5 320,70 500,30 C680,-5 820,70 1000,30 C1180,-5 1320,70 1500,30 L1500,120 L0,120 Z"
                      fill="url(#scoreAquaFrontWaveGrad)"
                    />
                    {/* Froth highlight crest line */}
                    <path
                      d="M0,35 C180,5 320,70 500,30 C680,-5 820,70 1000,30 C1180,-5 1320,70 1500,30"
                      fill="none"
                      stroke="rgba(255,255,255,0.95)"
                      strokeWidth="3"
                    />
                  </svg>
                </div>

                {/* Ambient Floating 3D Aqua Bubbles with Realistic Specular Highlights */}
                <div
                  className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400/40 via-sky-100/70 to-white/90 border border-white/90 shadow-[0_0_8px_rgba(255,255,255,0.9),inset_0_1px_2px_rgba(255,255,255,1)] animate-aqua-bubble pointer-events-none"
                  style={{ left: '12%', bottom: '4px', animationDelay: '0s', animationDuration: '3.6s' }}
                >
                  <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 left-0.5 shadow-[0_0_2px_#ffffff]" />
                </div>
                <div
                  className="absolute w-3 h-3 rounded-full bg-gradient-to-tr from-cyan-300/30 via-sky-100/70 to-white/90 border border-white/80 shadow-[0_0_6px_rgba(255,255,255,0.8),inset_0_1px_2px_rgba(255,255,255,1)] animate-aqua-bubble pointer-events-none"
                  style={{ left: '38%', bottom: '6px', animationDelay: '1.5s', animationDuration: '4.2s' }}
                >
                  <div className="w-0.5 h-0.5 rounded-full bg-white absolute top-0.5 left-0.5" />
                </div>
                <div
                  className="absolute w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400/50 via-sky-100/80 to-white/95 border border-white shadow-[0_0_10px_rgba(255,255,255,0.9),inset_0_1.5px_2px_rgba(255,255,255,1)] animate-aqua-bubble pointer-events-none"
                  style={{ left: '68%', bottom: '2px', animationDelay: '0.6s', animationDuration: '3.2s' }}
                >
                  <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 left-0.5 shadow-[0_0_2px_#ffffff]" />
                </div>
                <div
                  className="absolute w-3 h-3 rounded-full bg-gradient-to-tr from-sky-400/40 via-sky-100/70 to-white/95 border border-white shadow-[0_0_7px_rgba(255,255,255,0.8),inset_0_1px_2px_rgba(255,255,255,1)] animate-aqua-bubble pointer-events-none"
                  style={{ left: '88%', bottom: '4px', animationDelay: '2.5s', animationDuration: '4.4s' }}
                >
                  <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 left-0.5" />
                </div>
              </div>

              {/* Foreground Content: Circular Gauge Dial and Badges Centered Vertically (Z-Index 20) */}
              <div className="relative z-20 flex flex-col sm:flex-row items-center justify-center gap-5 my-auto w-full">
                {/* 3D Glass Circular Gauge Dial - Centered Vertically */}
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                  {/* Outer Radiant Aura Glow to make circle pop */}
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-cyan-400/40 via-sky-300/35 to-white/90 blur-md pointer-events-none opacity-85" />

                  <svg className="w-32 h-32 -rotate-90 transform drop-shadow-[0_4px_16px_rgba(2,132,199,0.38)] relative z-10" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="scoreCardAeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="48%" stopColor="#0284c7" />
                        <stop offset="52%" stopColor="#0369a1" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                      <linearGradient id="scoreCardTrackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#e0f2fe" />
                        <stop offset="100%" stopColor="#bae6fd" />
                      </linearGradient>
                      <filter id="scoreCardProgressGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.8" />
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.5" />
                      </filter>
                    </defs>
                    {/* Background circle track */}
                    <circle
                      cx="50"
                      cy="50"
                      r={scoreRadius}
                      stroke="url(#scoreCardTrackGrad)"
                      strokeWidth="9"
                      fill="transparent"
                      className="opacity-70"
                    />
                    {/* Animated Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r={scoreRadius}
                      stroke="url(#scoreCardAeroGrad)"
                      filter="url(#scoreCardProgressGlow)"
                      className="transition-all duration-700 ease-out"
                      strokeWidth="9.5"
                      strokeDasharray={scoreCircumference}
                      strokeDashoffset={scoreStrokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-20">
                    <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-b from-white/98 via-sky-50/90 to-sky-100/75 shadow-[inset_0_3px_5px_rgba(255,255,255,1),inset_0_-3px_5px_rgba(2,132,199,0.25),0_6px_18px_rgba(2,132,199,0.25)] border-2 border-white flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Upper specular reflection gloss */}
                      <div className="absolute top-0 left-0 right-0 h-[48%] rounded-t-full bg-gradient-to-b from-white via-white/75 to-transparent pointer-events-none z-10" />
                      {/* Glass bead flare highlight on top-left for 3D orb pop */}
                      <div className="absolute top-1.5 left-2.5 w-5 h-2.5 rounded-full bg-white blur-[0.5px] rotate-[-25deg] pointer-events-none z-20 shadow-[0_0_5px_#ffffff]" />
                      {/* Caustic bounce reflection at bottom */}
                      <div className="absolute bottom-0 left-2 right-2 h-3 rounded-b-full bg-gradient-to-t from-cyan-300/50 via-sky-200/30 to-transparent pointer-events-none z-10" />

                      <span className="text-2xl sm:text-3xl font-black bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#0891b2] bg-clip-text text-transparent tracking-tight tabular-nums relative z-20 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                        {totalScore}
                      </span>
                      <span className="text-[10px] font-extrabold text-sky-800 uppercase tracking-wider relative z-20 -mt-0.5">
                        / 100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Details in High-Contrast Frosted White Aero Glass Capsules */}
                <div className="text-center sm:text-left space-y-2.5 flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#0284c7] bg-white/95 px-3.5 py-1.5 rounded-full border border-sky-200 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_6px_#06b6d4] animate-pulse shrink-0" />
                    <span>Total Judge Score</span>
                  </div>

                  {/* Evaluation Narration */}
                  <div className="flex items-center justify-center sm:justify-start">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-sky-300 shadow-[0_2px_10px_rgba(2,132,199,0.16),inset_0_1px_1px_#ffffff] text-xs font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-[#0284c7] shadow-[0_0_6px_rgba(2,132,199,0.8)] animate-pulse shrink-0" />
                      <span className="font-extrabold text-slate-900 text-xs">
                        {summaryNarration}
                      </span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className="text-[#0284c7] font-bold text-xs">
                        {averageScore.toFixed(2)} avg
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Opinion & Submit Button Block (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              <div>
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
                      : "Share thoughts, critique, or click 'Note / Quote' next to any lyric line above to quote directly into your opinion…"
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7] focus:border-transparent transition-all ${
                    isAlreadySubmitted || isFlagged ? 'bg-stone-50 text-stone-600 cursor-not-allowed opacity-80' : 'bg-white'
                  }`}
                />
                <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                  <span>
                    {isAlreadySubmitted
                      ? 'Score submitted — lyric notes and opinion are locked for integrity.'
                      : 'Quotes and notes taken on the lyric sheet above appear directly in this opinion box.'}
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

              {/* Submission & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {isFlagged ? (
                  <div className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl aero-btn-rose text-white font-bold text-sm shadow-md cursor-default">
                    <ShieldAlert className="w-5 h-5 text-rose-100" />
                    <span>Scoring Aborted · {activeFlag?.reasonLabel}</span>
                  </div>
                ) : isAlreadySubmitted ? (
                  <div className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl aero-btn-emerald text-white font-bold text-sm shadow-md cursor-default">
                    <CheckCircle2 className="w-5 h-5 text-emerald-100" />
                    <span>Score Has Been Submitted ({totalScore}/100)</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || (!parsedSubmission.songTitle && !entrantName)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl aero-btn-primary text-white font-bold text-sm shadow-md transition-all hover:shadow-lg disabled:opacity-60 cursor-pointer"
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
                      className="px-3 py-2 rounded-xl aero-btn-rose text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      title="Flag / Abort entry for rule violations"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Flag / Abort</span>
                    </button>
                  )}

                  {onGoToSongEntries && (
                    <button
                      type="button"
                      onClick={onGoToSongEntries}
                      className="px-3 py-2 rounded-xl aero-btn-secondary text-[#0284c7] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>Other Songs</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleExportText}
                    className="px-3 py-2 rounded-xl aero-btn-secondary text-stone-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    title="Export scorecard (.txt)"
                  >
                    <Download className="w-4 h-4 text-stone-500" />
                    <span className="hidden sm:inline">Export .txt</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-2 rounded-xl aero-btn-secondary text-stone-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    title="Print Scorecard"
                  >
                    <Printer className="w-4 h-4 text-stone-500" />
                    <span className="hidden sm:inline">Print</span>
                  </button>

                  {!isAlreadySubmitted && !isFlagged && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-2 rounded-xl aero-btn-secondary text-stone-600 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      title="Reset scores to default 18"
                    >
                      <RotateCcw className="w-4 h-4 text-stone-400" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

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
