import React, { useState } from 'react';
import {
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Shield,
  Music,
  Users,
  FileSpreadsheet,
  Lock,
  Unlock,
  ArrowRight,
  Check,
  Download,
  Upload,
  Flag,
  ShieldAlert,
  Ban,
  Activity,
  KeyRound,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import {
  JudgeScoreSubmission,
  EntrantRanking,
  ContestSongEntry,
  SongFlag,
  RegisteredJudge,
  FirebaseStatus,
} from '../types/contest';
import { JudgeMonitoringBoard } from './JudgeMonitoringBoard';

interface AdminDashboardProps {
  scores: JudgeScoreSubmission[];
  rankings: EntrantRanking[];
  songs?: ContestSongEntry[];
  flags?: SongFlag[];
  registeredJudges?: RegisteredJudge[];
  firebaseStatus?: FirebaseStatus | null;
  onDeleteScore: (scoreId: string) => void;
  onDeleteEntrant: (entrantName: string) => void;
  onDeleteSong?: (songId: string, songTitle: string, formattedEntrantName?: string) => void;
  onRenameEntrant: (oldName: string, newName: string) => void;
  onExportExcel?: () => void;
  adminPin: string;
  portalPin?: string;
  portalSessionVersion?: number;
  onLockPortal?: () => Promise<void>;
  onUpdateAdminPin: (newPin: string) => void;
  onUpdatePortalPin?: (newPin: string) => void;
  onUpdateFlagStatus?: (flagId: string, status: 'disqualified' | 'cleared') => Promise<void>;
  onDeleteFlag?: (flagId: string) => Promise<void>;
  onAddJudge?: (name: string) => Promise<void>;
  onDeleteJudge?: (name: string) => void | Promise<void>;
  onSwitchToJudgeMode: () => void;
  onUploadSongTxt?: (file: File) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  scores,
  rankings,
  songs = [],
  flags = [],
  registeredJudges = [],
  firebaseStatus,
  onDeleteScore,
  onDeleteEntrant,
  onDeleteSong,
  onRenameEntrant,
  onExportExcel,
  adminPin,
  portalPin = '4274',
  portalSessionVersion = 1,
  onLockPortal,
  onUpdateAdminPin,
  onUpdatePortalPin,
  onUpdateFlagStatus,
  onDeleteFlag,
  onAddJudge,
  onDeleteJudge,
  onSwitchToJudgeMode,
  onUploadSongTxt,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'monitoring' | 'scores' | 'entrants' | 'flags' | 'settings'
  >('monitoring');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJudge, setSelectedJudge] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPortalPin, setCopiedPortalPin] = useState(false);

  // Rename modal state
  const [renamingTarget, setRenamingTarget] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // PIN settings state
  const [newAdminPinInput, setNewAdminPinInput] = useState('');
  const [adminPinChangeSuccess, setAdminPinChangeSuccess] = useState(false);

  const [newPortalPinInput, setNewPortalPinInput] = useState('');
  const [portalPinChangeSuccess, setPortalPinChangeSuccess] = useState(false);

  // Portal Lock state
  const [isLockingPortal, setIsLockingPortal] = useState(false);
  const [lockConfirmedSuccess, setLockConfirmedSuccess] = useState(false);
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);

  // Distinct judges
  const distinctJudges = Array.from(
    new Set([
      ...scores.map((s) => s.judgeName),
      ...registeredJudges.map((j) => j.name),
    ])
  ).filter(Boolean);

  const pendingFlagsCount = flags.filter((f) => f.status === 'pending_review').length;
  const activeFlagsCount = flags.filter((f) => f.status !== 'cleared').length;

  const filteredScores = scores.filter((s) => {
    const matchesSearch =
      s.entrantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.judgeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.comments && s.comments.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesJudge = selectedJudge === 'all' || s.judgeName === selectedJudge;
    return matchesSearch && matchesJudge;
  });

  const filteredSongs = songs.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.songTitle.toLowerCase().includes(q) ||
      (s.alias && s.alias.toLowerCase().includes(q)) ||
      (s.discordUsername && s.discordUsername.toLowerCase().includes(q)) ||
      (s.storyConcept && s.storyConcept.toLowerCase().includes(q))
    );
  });

  const filteredRankings = rankings.filter((r) =>
    r.entrantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyJudgeLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('role', 'judge');
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleStartRename = (currentName: string) => {
    setRenamingTarget(currentName);
    setNewTitle(currentName);
  };

  const handleConfirmRename = () => {
    if (renamingTarget && newTitle.trim() && newTitle.trim() !== renamingTarget) {
      onRenameEntrant(renamingTarget, newTitle.trim());
      setRenamingTarget(null);
      setNewTitle('');
    }
  };

  const handleSaveAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPinInput.trim().length >= 4) {
      onUpdateAdminPin(newAdminPinInput.trim());
      setNewAdminPinInput('');
      setAdminPinChangeSuccess(true);
      setTimeout(() => setAdminPinChangeSuccess(false), 3000);
    }
  };

  const handleSavePortalPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePortalPin && newPortalPinInput.trim().length >= 4) {
      onUpdatePortalPin(newPortalPinInput.trim());
      setNewPortalPinInput('');
      setPortalPinChangeSuccess(true);
      setTimeout(() => setPortalPinChangeSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1c242b] to-[#202b31] rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9ec6b9] bg-stone-800/90 px-2.5 py-0.5 rounded-full mb-1">
            <Shield className="w-3 h-3" />
            Contest Administration & Supervision
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Contest Control Center
          </h2>
          <p className="text-xs text-stone-300 mt-0.5 max-w-2xl leading-relaxed">
            Monitor judge progress, review rule violations and flagged entries, update portal and admin PINs,
            and export official contest standings to Excel.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onLockPortal && (
            <button
              onClick={() => setShowLockConfirmModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Lock judging portal immediately and require PIN re-entry"
            >
              <Lock className="w-3.5 h-3.5 text-rose-200" />
              <span>Lock Portal</span>
            </button>
          )}

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Download full contest results in Excel (.xlsx) format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export to Excel (.xlsx)</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin KPI Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveAdminTab('monitoring')}
          className="bg-white/60 backdrop-blur-2xl p-3.5 sm:p-4 rounded-2xl border border-white/90 shadow-[0_10px_30px_rgba(255,20,147,0.06),0_1px_1px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60 cursor-pointer hover:border-pink-400/60 transition-all"
        >
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#0284c7]" />
            Judge Panel
          </div>
          <div className="text-2xl font-black text-stone-900 mt-0.5">
            {distinctJudges.length}
          </div>
          <div className="text-[11px] text-stone-500 font-medium">
            {scores.length} scorecards recorded
          </div>
        </div>

        <div
          onClick={() => setActiveAdminTab('entrants')}
          className="bg-white/60 backdrop-blur-2xl p-3.5 sm:p-4 rounded-2xl border border-white/90 shadow-[0_10px_30px_rgba(255,20,147,0.06),0_1px_1px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60 cursor-pointer hover:border-pink-400/60 transition-all"
        >
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-[#0284c7]" />
            Contest Songs
          </div>
          <div className="text-2xl font-black text-stone-900 mt-0.5">
            {songs.length || rankings.length}
          </div>
          <div className="text-[11px] text-stone-500 font-medium">Active songs in queue</div>
        </div>

        <div
          onClick={() => setActiveAdminTab('flags')}
          className={`backdrop-blur-2xl p-3.5 sm:p-4 rounded-2xl border shadow-[0_10px_30px_rgba(255,20,147,0.06),0_1px_1px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60 cursor-pointer transition-all ${
            activeFlagsCount > 0
              ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
              : 'bg-white/60 border-white/90 hover:border-pink-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 text-rose-700">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Rule Violations
          </div>
          <div className="text-2xl font-black text-stone-900 mt-0.5">
            {activeFlagsCount}
          </div>
          <div className="text-[11px] text-rose-700 font-bold">
            {pendingFlagsCount > 0
              ? `${pendingFlagsCount} pending review`
              : 'No active reports'}
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-2xl p-3.5 sm:p-4 rounded-2xl border border-white/90 shadow-[0_10px_30px_rgba(255,20,147,0.06),0_1px_1px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel Report
            </div>
            <div className="text-xs font-bold text-stone-800 mt-0.5">
              Multi-Sheet .xlsx Formatted
            </div>
          </div>
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="mt-2 inline-flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition-colors cursor-pointer w-full"
            >
              <Download className="w-3 h-3" />
              <span>Download Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex border-b border-stone-200 space-x-2 sm:space-x-4 overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => setActiveAdminTab('monitoring')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeAdminTab === 'monitoring'
              ? 'border-[#0284c7] text-[#0284c7]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Judge Monitoring Board ({distinctJudges.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('flags')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeAdminTab === 'flags'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Rule Violations & Flags</span>
          {activeFlagsCount > 0 && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-rose-600 text-white">
              {activeFlagsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('scores')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'scores'
              ? 'border-[#0284c7] text-[#0284c7]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          All Recorded Scores ({scores.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('entrants')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'entrants'
              ? 'border-[#0284c7] text-[#0284c7]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Contest Songs ({songs.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeAdminTab === 'settings'
              ? 'border-[#0284c7] text-[#0284c7]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security & PINs</span>
        </button>
      </div>

      {/* Tab: Judge Monitoring Board */}
      {activeAdminTab === 'monitoring' && (
        <JudgeMonitoringBoard
          scores={scores}
          songs={songs}
          registeredJudges={registeredJudges}
          onDeleteJudge={onDeleteJudge || (async () => {})}
          onViewJudgeScores={(judgeName) => {
            setSelectedJudge(judgeName);
            setActiveAdminTab('scores');
          }}
        />
      )}

      {/* Tab: Flags & Rule Violations Management */}
      {activeAdminTab === 'flags' && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-md overflow-hidden space-y-4">
          <div className="p-4 border-b border-stone-200/80 bg-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Contest Integrity & Enforcement</span>
              </div>
              <h3 className="font-bold text-stone-900 text-base">
                Flagged Entries & Rule Violations
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Review submissions that judges flagged for suspicious AI generation, inappropriate/explicit
                lyrics, or potential plagiarism.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 self-start sm:self-auto shrink-0">
              {flags.length} Total {flags.length === 1 ? 'Report' : 'Reports'}
            </span>
          </div>

          {flags.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs sm:text-sm">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-400" />
              <p className="font-semibold text-stone-600">No rule violations reported yet.</p>
              <p className="text-xs text-stone-400 mt-1">
                Judges can click "Flag / Abort" while scoring any entry if they detect AI generation,
                plagiarism, or inappropriate content.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {flags.map((flag) => {
                const isDisqualified = flag.status === 'disqualified';
                const isCleared = flag.status === 'cleared';

                return (
                  <div
                    key={flag.id}
                    className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                      isDisqualified
                        ? 'bg-rose-50/50'
                        : isCleared
                        ? 'bg-emerald-50/30'
                        : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {isDisqualified ? (
                          <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-300 inline-flex items-center gap-1">
                            <Ban className="w-3.5 h-3.5" />
                            <span>Officially Disqualified</span>
                          </span>
                        ) : isCleared ? (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Flag Cleared / Restored</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Pending Producer Review</span>
                          </span>
                        )}

                        <span className="text-xs font-extrabold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                          {flag.reasonLabel}
                        </span>

                        <h4 className="font-bold text-stone-900 text-base">
                          {flag.songTitle}
                        </h4>
                      </div>

                      <div className="text-xs text-stone-500 flex flex-wrap items-center gap-3">
                        <span>
                          Reported by: <strong>{flag.flaggedBy}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Date: {new Date(flag.flaggedAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {flag.reviewedBy && (
                          <>
                            <span>•</span>
                            <span>Reviewed by: {flag.reviewedBy}</span>
                          </>
                        )}
                      </div>

                      {flag.notes && (
                        <div className="text-xs bg-white/90 p-2.5 rounded-xl border border-stone-200 text-stone-800 italic max-w-2xl">
                          Judge's Observation: “{flag.notes}”
                        </div>
                      )}
                    </div>

                    {/* Admin Actions for Flag */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
                      {!isDisqualified && onUpdateFlagStatus && (
                        <button
                          onClick={() => onUpdateFlagStatus(flag.id, 'disqualified')}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          title="Officially disqualify this submission from standings"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Disqualify Entry</span>
                        </button>
                      )}

                      {!isCleared && onUpdateFlagStatus && (
                        <button
                          onClick={() => onUpdateFlagStatus(flag.id, 'cleared')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          title="Dismiss report as false alarm and restore entry for judging"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Clear / Restore Entry</span>
                        </button>
                      )}

                      {onDeleteFlag && (
                        <button
                          onClick={() => onDeleteFlag(flag.id)}
                          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                          title="Delete this violation report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Scores Management */}
      {activeAdminTab === 'scores' && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-md overflow-hidden space-y-3">
          {/* Filter Bar */}
          <div className="p-3 sm:p-3.5 border-b border-stone-200/80 bg-white/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scorecards by song, judge, or comment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 bg-white/80 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-stone-500">Filter Judge:</span>
              <select
                value={selectedJudge}
                onChange={(e) => setSelectedJudge(e.target.value)}
                className="bg-white/80 border border-stone-300 text-stone-700 rounded-xl px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-[#0284c7]"
              >
                <option value="all">All Judges ({distinctJudges.length})</option>
                {distinctJudges.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredScores.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs sm:text-sm">
              No scorecards match the current filter or search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-stone-100/60 text-stone-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 pl-3 sm:pl-4 pr-2">Judge / Producer</th>
                    <th className="py-2.5 px-2">Entrant / Song Title</th>
                    <th className="py-2.5 px-1.5 text-center">Writing</th>
                    <th className="py-2.5 px-1.5 text-center">Orig</th>
                    <th className="py-2.5 px-1.5 text-center">Emotion</th>
                    <th className="py-2.5 px-1.5 text-center">Struct</th>
                    <th className="py-2.5 px-2 text-right">Total</th>
                    <th className="py-2.5 px-2">Comments</th>
                    <th className="py-2.5 pr-3 sm:pr-4 pl-1 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredScores.map((score, idx) => (
                    <tr key={score.id || idx} className="hover:bg-white/60 transition-colors">
                      <td className="py-2 pl-3 sm:pl-4 pr-2 font-bold text-stone-900 whitespace-nowrap">
                        {score.judgeName}
                        <div className="text-[9px] text-stone-400 font-normal">
                          {score.timestamp ? new Date(score.timestamp).toLocaleDateString() : ''}
                        </div>
                      </td>
                      <td className="py-2 px-2 font-semibold text-stone-800">{score.entrantName}</td>
                      <td className="py-2 px-1.5 text-center font-bold text-stone-700">{score.writing}</td>
                      <td className="py-2 px-1.5 text-center font-bold text-stone-700">{score.originality}</td>
                      <td className="py-2 px-1.5 text-center font-bold text-stone-700">{score.emotion}</td>
                      <td className="py-2 px-1.5 text-center font-bold text-stone-700">{score.structure}</td>
                      <td className="py-2 px-2 text-right font-black text-stone-900 tabular-nums">
                        {score.totalScore}
                        <span className="text-[9px] text-stone-400 font-normal"> / 100</span>
                      </td>
                      <td className="py-2 px-2 text-stone-500 italic text-[11px] max-w-xs truncate">
                        {score.comments ? `“${score.comments}”` : '—'}
                      </td>
                      <td className="py-2 pr-3 sm:pr-4 pl-1 text-right">
                        <button
                          onClick={() => onDeleteScore(score.id || `idx-${idx}`)}
                          className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                          title="Delete this judge's score"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Contest Songs Management & Rename */}
      {activeAdminTab === 'entrants' && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-md overflow-hidden space-y-4">
          <div className="p-4 border-b border-stone-200/80 bg-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-stone-800 text-sm">Contest Songs & Entrant Roster</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Manage uploaded songs. Deleting a song here removes it immediately from both the
                online contest database and the Song Entries list.
              </p>
            </div>
            <span className="text-xs font-bold text-[#0284c7] bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 self-start sm:self-auto shrink-0">
              {songs.length} Registered {songs.length === 1 ? 'Song' : 'Songs'}
            </span>
          </div>

          {filteredSongs.length === 0 && filteredRankings.length === 0 ? (
            <div className="p-10 text-center text-stone-400 text-sm">
              {searchQuery
                ? `No contest songs match "${searchQuery}".`
                : 'No contest songs registered yet. Upload or add a song to begin.'}
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {filteredSongs.map((song) => {
                const songTitleLower = song.songTitle.trim().toLowerCase();
                const formattedLower = (song.formattedEntrantName || '').trim().toLowerCase();

                const rankingInfo = rankings.find((r) => {
                  const rName = r.entrantName.trim().toLowerCase();
                  return (
                    rName === songTitleLower ||
                    rName === formattedLower ||
                    rName.startsWith(songTitleLower)
                  );
                });

                const songScores = scores.filter((s) => {
                  const sTitle = (s.songTitle || '').trim().toLowerCase();
                  const sEntrant = s.entrantName.trim().toLowerCase();
                  return (
                    sTitle === songTitleLower ||
                    sEntrant === songTitleLower ||
                    sEntrant === formattedLower
                  );
                });

                const songFlag = flags.find(
                  (f) =>
                    f.status !== 'cleared' &&
                    (f.songTitle.trim().toLowerCase() === songTitleLower ||
                      (f.entrantName && f.entrantName.trim().toLowerCase() === formattedLower))
                );

                return (
                  <div
                    key={song.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {songFlag ? (
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-300 inline-flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            <span>
                              {songFlag.status === 'disqualified' ? 'Disqualified' : 'Flagged'}
                            </span>
                          </span>
                        ) : rankingInfo ? (
                          <span className="text-xs font-extrabold text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                            Rank #{rankingInfo.rank}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Unscored
                          </span>
                        )}
                        <h4 className="font-bold text-stone-900 text-base">{song.songTitle}</h4>
                        {song.alias && (
                          <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                            {song.alias}
                          </span>
                        )}
                        {song.discordUsername && (
                          <span className="text-[11px] font-mono text-stone-500 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200">
                            @{song.discordUsername}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-stone-500 mt-1.5 flex flex-wrap items-center gap-3">
                        <span>
                          <strong>{songScores.length}</strong>{' '}
                          {songScores.length === 1 ? 'judge scored' : 'judges scored'}
                        </span>
                        {rankingInfo && (
                          <>
                            <span>•</span>
                            <span>
                              Average: <strong>{rankingInfo.averageScore.toFixed(2)}</strong> / 100
                            </span>
                          </>
                        )}
                        {song.addedAt && (
                          <>
                            <span>•</span>
                            <span>Added: {new Date(song.addedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>

                      {song.storyConcept && (
                        <p className="text-xs text-stone-600 mt-1 italic line-clamp-1 bg-sky-50/40 p-1.5 rounded-lg border border-sky-100 max-w-xl">
                          "{song.storyConcept}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleStartRename(song.songTitle)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={() => {
                          if (onDeleteSong) {
                            onDeleteSong(song.id, song.songTitle, song.formattedEntrantName);
                          } else {
                            onDeleteEntrant(song.songTitle);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Song</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Security & PIN Management */}
      {activeAdminTab === 'settings' && (
        <div className="space-y-4">
          {/* Share Links */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-5 sm:p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0284c7]" />
              Shareable Judge Link
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Send this link to your judges. When they open it, they will only see the independent
              scorecard and song entries list to score. The full leaderboard and other judges' scores
              are hidden.
            </p>

            <div className="p-3 bg-white/60 backdrop-blur-xs rounded-xl border border-stone-200/80 flex items-center justify-between gap-2 text-xs font-mono text-stone-700 break-all">
              <span>{window.location.origin + window.location.pathname}?role=judge</span>
              <button
                onClick={handleCopyJudgeLink}
                className="shrink-0 p-2 bg-white/80 rounded-lg border border-stone-300 hover:bg-white transition-colors cursor-pointer"
                title="Copy link"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 1. Update Portal Access Security PIN */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-pink-600" />
                Portal Access Security PIN (Gatekeeper)
              </h3>
              <span className="text-xs font-mono font-bold bg-pink-100 text-pink-900 px-2.5 py-1 rounded-lg border border-pink-200">
                Current PIN: {portalPin}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              The passcode required at the front gate for judges and visitors before entering the
              judging portal. (Initial default: <strong>4274</strong>). You can change it to any 4–8
              digit code.
            </p>

            <form onSubmit={handleSavePortalPin} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                maxLength={8}
                value={newPortalPinInput}
                onChange={(e) => setNewPortalPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="New 4-8 digit Portal PIN"
                className="px-3.5 py-2 bg-white/70 border border-stone-300/80 rounded-xl text-xs sm:text-sm text-stone-900 font-mono w-52 focus:ring-2 focus:ring-pink-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={newPortalPinInput.trim().length < 4}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                Update Portal PIN
              </button>
            </form>

            {portalPinChangeSuccess && (
              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4" />
                Portal Security PIN successfully updated! New judges must enter this PIN to access the portal.
              </div>
            )}
          </div>

          {/* 2. Update Producer / Admin PIN */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0284c7]" />
                Producer / Admin Access PIN
              </h3>
              <span className="text-xs font-mono font-bold bg-sky-100 text-sky-900 px-2.5 py-1 rounded-lg border border-sky-200">
                Current PIN: {adminPin}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              The PIN required to unlock this Admin Dashboard when switching from Judge mode or
              accessing sensitive producer features. (Initial default: <strong>1234</strong>).
            </p>

            <form onSubmit={handleSaveAdminPin} className="flex flex-wrap items-center gap-2">
              <input
                type="password"
                maxLength={8}
                value={newAdminPinInput}
                onChange={(e) => setNewAdminPinInput(e.target.value)}
                placeholder="New 4-8 digit Admin PIN"
                className="px-3.5 py-2 bg-white/80 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-mono w-52 focus:ring-2 focus:ring-[#0284c7] focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={newAdminPinInput.trim().length < 4}
                className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                Update Admin PIN
              </button>
            </form>

            {adminPinChangeSuccess && (
              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4" />
                Producer PIN successfully updated!
              </div>
            )}
          </div>

          {/* 3. Remote Portal Lock Feature */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                Remote Portal Lock (Session Gatekeeper)
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                <span className="bg-rose-100 text-rose-900 px-2.5 py-1 rounded-lg border border-rose-200">
                  Security Session v{portalSessionVersion}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Lock the portal remotely across all connected devices and browsers. This increments the security session version on the server, immediately terminating active judge sessions. All judges will be required to re-enter the 4-digit Portal PIN the next time they use, navigate, or refresh the site.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLockConfirmModal(true)}
                disabled={isLockingPortal}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{isLockingPortal ? 'Locking Portal...' : 'Lock Portal for All Judges Now'}</span>
              </button>

              {lockConfirmedSuccess && (
                <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Portal successfully locked! All judges must now re-enter the PIN.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remote Portal Lock Confirmation Modal */}
      {showLockConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-2xl p-6 text-stone-900">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 leading-tight">
                Lock Contest Portal for All Judges?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Are you sure you want to lock the portal? This will immediately invalidate existing judge sessions across all devices and force everyone to re-enter the access PIN (<strong>{portalPin}</strong>) before they can continue judging.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLockConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-white/60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onLockPortal) {
                    setIsLockingPortal(true);
                    await onLockPortal();
                    setIsLockingPortal(false);
                    setShowLockConfirmModal(false);
                    setLockConfirmedSuccess(true);
                    setTimeout(() => setLockConfirmedSuccess(false), 4000);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Confirm & Lock Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renamingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white/75 backdrop-blur-xl rounded-2xl border border-white/60 shadow-2xl p-6 text-stone-900">
            <h3 className="text-base font-bold text-stone-900">Rename Contest Entry</h3>
            <p className="text-xs text-stone-500 mt-1">
              Updating this title will automatically update all previous judges' scorecards linked to
              this song.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Song Title / Entrant
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm font-medium focus:ring-2 focus:ring-[#0284c7] focus:outline-hidden"
                autoFocus
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingTarget(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                className="px-4 py-2 rounded-xl bg-[#0284c7] text-white text-xs font-bold hover:bg-[#0369a1] shadow-xs cursor-pointer"
              >
                Save New Title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
