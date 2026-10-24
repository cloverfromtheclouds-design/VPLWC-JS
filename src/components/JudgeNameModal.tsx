import React, { useState, useEffect, useMemo } from 'react';
import { User, X, Check, ArrowRight, ShieldCheck, RefreshCw, UserCheck } from 'lucide-react';
import { SummertideFlowerLogo } from './SummertideFlowerLogo';
import { HibiscusInlay } from './HibiscusInlay';
import { RegisteredJudge, JudgeScoreSubmission } from '../types/contest';

interface JudgeNameModalProps {
  isOpen: boolean;
  currentName: string;
  isInitialRequired?: boolean;
  registeredJudges?: RegisteredJudge[];
  scores?: JudgeScoreSubmission[];
  totalSongsCount?: number;
  onSave: (name: string, isExistingLogin?: boolean) => void;
  onClose?: () => void;
}

export const JudgeNameModal: React.FC<JudgeNameModalProps> = ({
  isOpen,
  currentName,
  isInitialRequired = false,
  registeredJudges = [],
  scores = [],
  totalSongsCount = 0,
  onSave,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  // Existing Judge Confirmation Step
  const [matchedExistingJudge, setMatchedExistingJudge] = useState<{
    canonicalName: string;
    scoresCount: number;
    lastActive?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNameInput(currentName);
      setError(null);
      setMatchedExistingJudge(null);
    }
  }, [isOpen, currentName]);

  // List of all existing distinct judge names across registrations and scores
  const existingJudgesSummary = useMemo(() => {
    const map = new Map<string, { canonicalName: string; scoresCount: number; lastActive?: string }>();

    registeredJudges.forEach((j) => {
      if (j.name && j.name.trim()) {
        const lower = j.name.trim().toLowerCase();
        map.set(lower, {
          canonicalName: j.name.trim(),
          scoresCount: 0,
          lastActive: j.lastActiveAt || j.registeredAt,
        });
      }
    });

    scores.forEach((s) => {
      if (s.judgeName && s.judgeName.trim()) {
        const lower = s.judgeName.trim().toLowerCase();
        const existing = map.get(lower);
        if (existing) {
          existing.scoresCount += 1;
          if (s.timestamp && (!existing.lastActive || new Date(s.timestamp) > new Date(existing.lastActive))) {
            existing.lastActive = s.timestamp;
          }
        } else {
          map.set(lower, {
            canonicalName: s.judgeName.trim(),
            scoresCount: 1,
            lastActive: s.timestamp,
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.scoresCount - a.scoresCount);
  }, [registeredJudges, scores]);

  // Live suggestions as judge types their name
  const liveSuggestedJudges = useMemo(() => {
    const trimmed = nameInput.trim().toLowerCase();
    if (!trimmed || trimmed.length < 1) return [];

    return existingJudgesSummary
      .filter((j) => {
        const lower = j.canonicalName.toLowerCase();
        return lower.includes(trimmed) || trimmed.includes(lower);
      })
      .slice(0, 3);
  }, [nameInput, existingJudgesSummary]);

  if (!isOpen) return null;

  // Check if entered name corresponds to an existing judge (exact, prefix, or substring)
  const checkForExistingJudge = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const lower = trimmed.toLowerCase();
    // 1. Exact match (case-insensitive)
    const exact = existingJudgesSummary.find(
      (j) => j.canonicalName.toLowerCase() === lower
    );
    if (exact) return exact;

    // 2. Starts-with or contains match if at least 2 characters
    if (lower.length >= 2) {
      const match = existingJudgesSummary.find((j) => {
        const jLower = j.canonicalName.toLowerCase();
        return jLower.startsWith(lower) || jLower.includes(lower) || lower.includes(jLower);
      });
      if (match) return match;
    }

    return null;
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError('Please enter your judge name or alias to proceed.');
      return;
    }
    if (trimmed.length > 50) {
      setError('Judge name cannot exceed 50 characters.');
      return;
    }

    setError(null);

    // If this judge name matches an existing profile and is different from currently active session
    const existing = checkForExistingJudge(trimmed);
    if (existing && (!currentName || currentName.trim().toLowerCase() !== existing.canonicalName.toLowerCase())) {
      setMatchedExistingJudge(existing);
      return;
    }

    // New judge or editing own current name
    onSave(trimmed, false);
  };

  const handleConfirmExistingJudgeLogin = () => {
    if (matchedExistingJudge) {
      onSave(matchedExistingJudge.canonicalName, true);
    }
  };

  const handleRejectExistingJudgeLogin = () => {
    setMatchedExistingJudge(null);
    setError('Please enter a distinct name or handle to create a new profile.');
  };

  const handleQuickSelectExisting = (judge: { canonicalName: string; scoresCount: number }) => {
    setNameInput(judge.canonicalName);
    setMatchedExistingJudge(judge);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-b from-white/85 via-white/75 to-white/65 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(255,20,147,0.16),0_1px_2px_rgba(255,255,255,0.95)_inset] p-5 sm:p-7 text-stone-900 relative overflow-hidden ring-1 ring-white/60">
        {/* Top iOS Specular Edge Highlight & Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 shadow-sm" />

        {/* Hibiscus Inlay Debossed Watermark */}
        <HibiscusInlay size="lg" position="bottom-right" opacity="opacity-[0.065] sm:opacity-[0.08]" />

        {/* Existing Judge Multi-Device Confirmation View */}
        {matchedExistingJudge ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100/90 to-rose-100/90 border border-pink-200/90 shadow-[0_4px_12px_rgba(255,20,147,0.18)] flex items-center justify-center shrink-0">
                  <SummertideFlowerLogo size="lg" glow />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-pink-600 uppercase tracking-wider">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Existing Judge Profile</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight leading-tight">
                    Log In on This Device?
                  </h3>
                </div>
              </div>

              {!isInitialRequired && onClose && (
                <button
                  onClick={onClose}
                  className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Explanation & Cloud Sync Card */}
            <div className="p-4 bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-md rounded-2xl border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_1px_rgba(255,255,255,0.9)_inset] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Judge Account</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-pink-100 text-pink-800 border border-pink-200">
                  Cloud Synced
                </span>
              </div>
              <div className="text-xl font-black text-stone-900 flex items-center gap-2">
                <span>{matchedExistingJudge.canonicalName}</span>
              </div>

              <div className="text-xs text-stone-600 space-y-1 pt-1 border-t border-stone-100">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-stone-500">Completed Scorecards:</span>
                  <span className="text-pink-600 font-bold">
                    {matchedExistingJudge.scoresCount}
                    {totalSongsCount > 0 ? ` of ${totalSongsCount} songs` : ' scorecards'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>Cross-Device Cloud State:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Available Instantly
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you <strong>{matchedExistingJudge.canonicalName}</strong> connecting from a new or different device?
              Logging in will immediately restore all your submitted scorecards, ratings, and comments here.
            </p>

            {/* Decision Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmExistingJudgeLogin}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-[0_8px_20px_rgba(255,20,147,0.3)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-pink-400/30"
              >
                <Check className="w-4 h-4" />
                <span>Yes, Log In as {matchedExistingJudge.canonicalName}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                type="button"
                onClick={handleRejectExistingJudgeLogin}
                className="w-full py-2.5 px-4 bg-white/70 hover:bg-white border border-stone-200/90 text-stone-600 hover:text-stone-900 font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-xs"
              >
                No, that&apos;s a different person (Enter another name)
              </button>
            </div>
          </div>
        ) : (
          /* Standard Name Entry Form */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-pink-100/90 to-rose-100/90 border border-pink-200/90 shadow-[0_4px_14px_rgba(255,20,147,0.22)] flex items-center justify-center shrink-0 animate-flower-popup">
                  <SummertideFlowerLogo size="xl" glow />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-pink-600 uppercase tracking-wider">
                    <SummertideFlowerLogo size="xs" />
                    <span>Summertide Studio</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight leading-tight mt-0.5">
                    {isInitialRequired ? 'Judge Identification' : 'Edit Your Judge Name'}
                  </h3>
                </div>
              </div>

              {!isInitialRequired && onClose && (
                <button
                  onClick={onClose}
                  className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Explanation */}
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {isInitialRequired ? (
                <>
                  Enter your <strong>Judge Name</strong> or alias. If you already judged from another device, enter the same name to access and view all your previous evaluations!
                </>
              ) : (
                <>
                  Update your active judge name. All scorecards you submit will be credited under this profile.
                </>
              )}
            </p>

            {/* Returning Judges Quick Select (if any registered judges exist) */}
            {isInitialRequired && existingJudgesSummary.length > 0 && (
              <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 shadow-xs space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-pink-500" />
                  <span>Returning from another device? Pick your name:</span>
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {existingJudgesSummary.slice(0, 6).map((j) => (
                    <button
                      key={j.canonicalName}
                      type="button"
                      onClick={() => handleQuickSelectExisting(j)}
                      className="px-2.5 py-1 rounded-xl bg-white/90 hover:bg-pink-50 border border-stone-200 hover:border-pink-300 text-stone-700 hover:text-pink-900 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>{j.canonicalName}</span>
                      {j.scoresCount > 0 && (
                        <span className="text-[10px] text-pink-600 bg-pink-100/80 px-1 rounded-sm">
                          {j.scoresCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleInitialSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="judge-name-input"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                >
                  Judge Name / Alias <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="judge-name-input"
                    type="text"
                    autoFocus
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g. Judge Mel, Tosho Han, Aria"
                    className="w-full py-3 px-4 text-sm sm:text-base font-bold text-stone-900 bg-white/80 backdrop-blur-md border border-stone-300/80 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-hidden transition-all shadow-inner"
                  />
                </div>
                {error && (
                  <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in duration-100">
                    {error}
                  </p>
                )}

                {/* Live Suggestion Prompt: Suggest whether they are that existing judge */}
                {liveSuggestedJudges.length > 0 && (
                  <div className="mt-2.5 p-3 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-pink-500/5 backdrop-blur-md rounded-2xl border border-pink-300/70 shadow-[0_4px_16px_rgba(255,20,147,0.08)] space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-pink-700">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                        <span>Are you this judge from another device?</span>
                      </span>
                      <span className="text-[10px] text-pink-700 bg-pink-100/90 px-2 py-0.5 rounded-full border border-pink-200 shrink-0">
                        Found on Cloud
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {liveSuggestedJudges.map((j) => (
                        <button
                          key={j.canonicalName}
                          type="button"
                          onClick={() => {
                            setNameInput(j.canonicalName);
                            setMatchedExistingJudge(j);
                            setError(null);
                          }}
                          className="w-full p-2.5 rounded-xl bg-white/90 hover:bg-white border border-pink-200/90 hover:border-pink-400 text-stone-900 transition-all shadow-2xs flex items-center justify-between text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 font-black text-xs flex items-center justify-center shrink-0">
                              {j.canonicalName[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-black text-stone-900 group-hover:text-pink-600 transition-colors truncate">
                                {j.canonicalName}
                              </div>
                              <div className="text-[10px] text-stone-500 truncate">
                                {j.scoresCount > 0
                                  ? `${j.scoresCount} scorecard${j.scoresCount === 1 ? '' : 's'} ready to restore`
                                  : 'Registered judge profile'}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-pink-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0 ml-2">
                            <span>Yes, that&apos;s me</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-stone-400 mt-1.5">
                  Saved locally & synced to the cloud. You can change this at any time.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                {!isInitialRequired && onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-white/70 hover:bg-white border border-stone-200 text-stone-600 hover:text-stone-900 font-bold text-xs rounded-2xl transition-colors cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!nameInput.trim()}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-[0_6px_20px_rgba(255,20,147,0.28)] hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-pink-400/30"
                >
                  <Check className="w-4 h-4" />
                  <span>{isInitialRequired ? 'Continue to Judging' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Subtext */}
        <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between text-[11px] text-stone-400 font-medium">
          <span className="flex items-center gap-1">
            <SummertideFlowerLogo size="xs" />
            <span>Summertide Lyric Contest</span>
          </span>
          <span className="text-pink-600 font-bold">Producer Panel</span>
        </div>
      </div>
    </div>
  );
};
