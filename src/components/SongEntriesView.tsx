import React, { useState, useMemo } from 'react';
import {
  Music,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Upload,
  Plus,
  Trash2,
  FileText,
  Sliders,
  ExternalLink,
  ChevronRight,
  User,
  MessageCircle,
  HelpCircle,
  Shield,
  Eye,
  BookOpen,
  ShieldAlert,
  Flag,
} from 'lucide-react';
import { SummertideFlowerLogo } from './SummertideFlowerLogo';
import { HibiscusInlay } from './HibiscusInlay';
import { ContestSongEntry, JudgeScoreSubmission, SongFlag } from '../types/contest';
import { parseLyricSubmission } from '../utils/lyricParser';
import { DiscordHandleReveal } from './DiscordHandleReveal';

interface SongEntriesViewProps {
  songs: ContestSongEntry[];
  scores: JudgeScoreSubmission[];
  flags?: SongFlag[];
  currentJudgeName: string;
  onChangeJudgeName: (name: string) => void;
  onSelectSongToGrade: (song: ContestSongEntry) => void;
  isAdmin: boolean;
  onAddSong?: (song: ContestSongEntry) => void;
  onDeleteSong?: (songId: string, songTitle: string, formattedEntrantName?: string) => void;
  onTriggerDuplicateModal: (song: ContestSongEntry, filename?: string) => void;
}

export const SongEntriesView: React.FC<SongEntriesViewProps> = ({
  songs,
  scores,
  flags = [],
  currentJudgeName,
  onChangeJudgeName,
  onSelectSongToGrade,
  isAdmin,
  onAddSong,
  onDeleteSong,
  onTriggerDuplicateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'graded' | 'flagged'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingLyricsSong, setViewingLyricsSong] = useState<ContestSongEntry | null>(null);

  // Manual Add Form State (Admin only)
  const [newTitle, setNewTitle] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [newDiscord, setNewDiscord] = useState('');
  const [newStory, setNewStory] = useState('');
  const [newLyrics, setNewLyrics] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Identify scores submitted by the current judge
  const judgeScoresMap = useMemo(() => {
    const map = new Map<string, JudgeScoreSubmission>();
    if (!currentJudgeName.trim()) return map;

    const lowerJudge = currentJudgeName.trim().toLowerCase();
    for (const s of scores) {
      if (s.judgeName.trim().toLowerCase() === lowerJudge) {
        // Map by song title and entrant name
        if (s.songTitle) map.set(s.songTitle.trim().toLowerCase(), s);
        if (s.entrantName) map.set(s.entrantName.trim().toLowerCase(), s);
      }
    }
    return map;
  }, [scores, currentJudgeName]);

  // Overall judge completion progress
  const totalSongs = songs.length;
  const gradedSongsCount = useMemo(() => {
    return songs.filter((song) => {
      const matchByTitle = judgeScoresMap.has(song.songTitle.trim().toLowerCase());
      const matchByEntrant = judgeScoresMap.has(song.formattedEntrantName.trim().toLowerCase());
      return matchByTitle || matchByEntrant;
    }).length;
  }, [songs, judgeScoresMap]);

  const percentComplete = totalSongs === 0 ? 0 : Math.round((gradedSongsCount / totalSongs) * 100);

  // Count flagged songs
  const flaggedSongsCount = useMemo(() => {
    return songs.filter((song) => {
      const sTitle = song.songTitle.trim().toLowerCase();
      const sFormatted = (song.formattedEntrantName || '').trim().toLowerCase();
      return flags.some(
        (f) =>
          f.status !== 'cleared' &&
          (f.songTitle.trim().toLowerCase() === sTitle ||
            (f.entrantName && f.entrantName.trim().toLowerCase() === sFormatted))
      );
    }).length;
  }, [songs, flags]);

  // Circular progress calculations (Radius = 42, Circumference ≈ 263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentComplete / 100) * circumference;

  // Filter songs based on search and status
  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const sTitle = song.songTitle.trim().toLowerCase();
      const sFormatted = (song.formattedEntrantName || '').trim().toLowerCase();

      const isGraded =
        judgeScoresMap.has(sTitle) ||
        judgeScoresMap.has(sFormatted);

      const isFlagged = flags.some(
        (f) =>
          f.status !== 'cleared' &&
          (f.songTitle.trim().toLowerCase() === sTitle ||
            (f.entrantName && f.entrantName.trim().toLowerCase() === sFormatted))
      );

      if (filterMode === 'flagged' && !isFlagged) return false;
      if (filterMode === 'graded' && !isGraded) return false;
      if (filterMode === 'pending' && isGraded) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        song.songTitle.toLowerCase().includes(q) ||
        (song.alias && song.alias.toLowerCase().includes(q)) ||
        (song.discordUsername && song.discordUsername.toLowerCase().includes(q)) ||
        (song.storyConcept && song.storyConcept.toLowerCase().includes(q))
      );
    });
  }, [songs, judgeScoresMap, flags, filterMode, searchQuery]);

  // Handle .txt Upload (admin can add, judge triggers duplicate check)
  const handleUploadTxt = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const parsed = parseLyricSubmission(content);
      const titleToCheck = (parsed.songTitle || file.name.replace(/\.[^/.]+$/, '')).trim();

      // Check if identical / duplicate exists
      const existing = songs.find(
        (s) =>
          s.songTitle.trim().toLowerCase() === titleToCheck.toLowerCase() ||
          s.formattedEntrantName.trim().toLowerCase() === parsed.formattedEntrantName.trim().toLowerCase()
      );

      if (existing) {
        onTriggerDuplicateModal(existing, file.name);
        return;
      }

      if (isAdmin && onAddSong) {
        const newEntry: ContestSongEntry = {
          id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          songTitle: titleToCheck,
          alias: parsed.alias,
          discordUsername: parsed.discordUsername,
          storyConcept: parsed.storyConcept,
          lyrics: parsed.lyrics,
          formattedEntrantName: parsed.formattedEntrantName || titleToCheck,
          addedAt: new Date().toISOString(),
          addedBy: 'Admin Upload',
        };
        onAddSong(newEntry);
      } else {
        alert(
          'Notice: Only the contest producer/admin can upload brand new songs. You can grade all available entries listed below!'
        );
      }
    };
    reader.readAsText(file);
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setManualError('Song Title is required.');
      return;
    }

    const titleToCheck = newTitle.trim();
    const existing = songs.find(
      (s) => s.songTitle.trim().toLowerCase() === titleToCheck.toLowerCase()
    );

    if (existing) {
      setManualError(`"${titleToCheck}" already exists in the contest.`);
      return;
    }

    if (onAddSong) {
      const newEntry: ContestSongEntry = {
        id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        songTitle: titleToCheck,
        alias: newAlias.trim() || undefined,
        discordUsername: newDiscord.trim() || undefined,
        storyConcept: newStory.trim() || undefined,
        lyrics: newLyrics.trim() || undefined,
        formattedEntrantName: newAlias.trim() ? `${titleToCheck} (${newAlias.trim()})` : titleToCheck,
        addedAt: new Date().toISOString(),
        addedBy: 'Admin Manual',
      };
      onAddSong(newEntry);
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewAlias('');
      setNewDiscord('');
      setNewStory('');
      setNewLyrics('');
      setManualError(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Circular Progress Bar */}
      <div className="aero-glass rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-pink-50/90 text-pink-700 border border-pink-200/90 mb-2 shadow-2xs">
            <SummertideFlowerLogo size="xs" />
            <span>Summertide Studio · Judging Queue</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Contest Song Entries
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl leading-relaxed">
            All registered participant songs are listed below. Click on any song to open the scorecard
            with its lyrics side-by-side. Track your progress with the live grading completion meter.
          </p>

          {/* Judge Name Input / Switcher */}
          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
            <span className="font-bold text-stone-700">Judging As:</span>
            <div className="flex items-center gap-1.5 bg-white/60 border border-white/70 px-3 py-1 rounded-xl shadow-2xs backdrop-blur-xs">
              <User className="w-3.5 h-3.5 text-[#0284c7]" />
              <input
                type="text"
                value={currentJudgeName}
                onChange={(e) => onChangeJudgeName(e.target.value)}
                placeholder="Enter your judge name"
                className="bg-transparent font-bold text-stone-900 text-xs focus:outline-hidden w-36 sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* Circular Progress Gauge */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/65 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/90 shadow-[0_8px_24px_rgba(255,20,147,0.06),0_1px_0_rgba(255,255,255,0.9)_inset] ring-1 ring-white/60 shrink-0">
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg className="w-28 h-28 -rotate-90 transform drop-shadow-[0_4px_10px_rgba(2,132,199,0.25)]" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="aeroProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="48%" stopColor="#0284c7" />
                  <stop offset="52%" stopColor="#0369a1" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <linearGradient id="aeroTrackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e0f2fe" />
                  <stop offset="100%" stopColor="#bae6fd" />
                </linearGradient>
                <filter id="aeroProgressGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0284c7" floodOpacity="0.45" />
                </filter>
              </defs>
              {/* Background circle track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="url(#aeroTrackGrad)"
                strokeWidth="9"
                fill="transparent"
                className="opacity-70"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="url(#aeroProgressGrad)"
                filter="url(#aeroProgressGlow)"
                className="transition-all duration-700 ease-out"
                strokeWidth="9.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-b from-white/95 via-sky-50/90 to-sky-100/70 shadow-[inset_0_2px_3px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(2,132,199,0.2),0_2px_8px_rgba(2,132,199,0.12)] border border-white/90 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Upper specular reflection gloss */}
                <div className="absolute top-0 left-1 right-1 h-[45%] rounded-t-full bg-gradient-to-b from-white/90 via-white/40 to-transparent pointer-events-none" />
                <span className="text-xl sm:text-2xl font-black bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#0891b2] bg-clip-text text-transparent tracking-tight tabular-nums relative z-10 drop-shadow-xs">
                  {percentComplete}%
                </span>
                <span className="text-[9px] font-extrabold text-sky-800 uppercase tracking-wider relative z-10 -mt-0.5">
                  Progress
                </span>
              </div>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0284c7]">
              Grading Status
            </div>
            <div className="text-base font-extrabold text-stone-900 mt-0.5">
              {gradedSongsCount} of {totalSongs} Graded
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {totalSongs === 0 ? (
                'No songs uploaded yet.'
              ) : gradedSongsCount === totalSongs ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1 justify-center sm:justify-start">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All songs completed!
                </span>
              ) : (
                <span>
                  <strong>{totalSongs - gradedSongsCount}</strong> remaining to score
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter, Search, and Admin Actions */}
      <div className="aero-glass rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by song title, artist alias, or discord..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200/90 bg-white/80 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-pink-500/50 focus:bg-white transition-all shadow-inner font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filterMode === 'all'
                ? 'aero-btn-pink text-white shadow-xs'
                : 'aero-btn-secondary text-stone-700'
            }`}
          >
            All Songs ({totalSongs})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filterMode === 'pending'
                ? 'aero-btn-pink text-white shadow-xs'
                : 'aero-btn-secondary text-stone-700'
            }`}
          >
            Needs Grading ({totalSongs - gradedSongsCount})
          </button>
          <button
            onClick={() => setFilterMode('graded')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filterMode === 'graded'
                ? 'aero-btn-pink text-white shadow-xs'
                : 'aero-btn-secondary text-stone-700'
            }`}
          >
            Graded by You ({gradedSongsCount})
          </button>
          {flaggedSongsCount > 0 && (
            <button
              onClick={() => setFilterMode('flagged')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 inline-flex items-center gap-1 cursor-pointer ${
                filterMode === 'flagged'
                  ? 'aero-btn-rose text-white shadow-2xs'
                  : 'aero-btn-secondary text-rose-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Flagged ({flaggedSongsCount})</span>
            </button>
          )}
        </div>

        {/* Admin Only Actions: Upload .txt & Add Entry */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl aero-btn-secondary text-sky-800 text-xs font-bold transition-colors cursor-pointer shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .txt Song</span>
              <input
                type="file"
                accept=".txt,.doc,.docx,text/plain"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadTxt(file);
                }}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl aero-btn-primary text-white text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Entry</span>
            </button>
          </div>
        )}
      </div>

      {/* Song Entries Grid / List */}
      {filteredSongs.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-white/60 p-12 text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0284c7] mx-auto flex items-center justify-center mb-4">
            <Music className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            {searchQuery
              ? 'No matching songs found'
              : filterMode === 'pending'
              ? 'You have graded all contest songs!'
              : filterMode === 'graded'
              ? 'No songs scored yet under your judge name'
              : 'No contest songs registered yet'}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
            {searchQuery
              ? `No entries match "${searchQuery}". Try a different search keyword.`
              : filterMode === 'pending'
              ? 'Awesome job! All registered entries have been scored by you.'
              : filterMode === 'graded'
              ? 'Select any song from "Needs Grading" to begin scoring.'
              : isAdmin
              ? 'Upload participant lyric .txt files or add new entries to populate the judging queue.'
              : 'The contest administrator has not uploaded any entries yet. Please check back shortly.'}
          </p>

          {isAdmin && songs.length === 0 && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-[#0284c7] to-[#0891b2] hover:from-[#0369a1] hover:to-[#0e7490] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Add First Contest Entry
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredSongs.map((song) => {
            const judgeScore =
              judgeScoresMap.get(song.songTitle.trim().toLowerCase()) ||
              judgeScoresMap.get(song.formattedEntrantName.trim().toLowerCase());
            const isGraded = !!judgeScore;

            const songFlag = flags.find((f) => {
              if (f.status === 'cleared') return false;
              const sTitle = song.songTitle.trim().toLowerCase();
              const sFormatted = (song.formattedEntrantName || '').trim().toLowerCase();
              const fTitle = f.songTitle.trim().toLowerCase();
              const fEntrant = (f.entrantName || '').trim().toLowerCase();
              return fTitle === sTitle || fTitle === sFormatted || fEntrant === sTitle || fEntrant === sFormatted;
            });

            return (
              <div
                key={song.id}
                className={`aero-glass-card rounded-3xl p-5 flex flex-col justify-between group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl ${
                  songFlag
                    ? 'border-rose-300 ring-rose-200'
                    : 'hover:border-sky-300'
                }`}
              >
                <div>
                  {/* Status Badge & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {songFlag ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate max-w-[170px]">
                          {songFlag.status === 'disqualified' ? 'Disqualified' : 'Flagged'} · {songFlag.reasonLabel}
                        </span>
                      </span>
                    ) : isGraded ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Graded · {judgeScore.totalScore}/100</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Needs Grading</span>
                      </span>
                    )}

                    {isAdmin && onDeleteSong && (
                      <button
                        onClick={() => onDeleteSong(song.id, song.songTitle, song.formattedEntrantName)}
                        title="Delete contest entry"
                        className="text-stone-300 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Title & Artist */}
                  <h4 className="text-lg font-bold text-stone-900 group-hover:text-[#0284c7] transition-colors line-clamp-1">
                    {song.songTitle}
                  </h4>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                    <span className="font-semibold text-stone-800">
                      {song.alias || 'Unknown Artist'}
                    </span>
                    {song.discordUsername && (
                      <DiscordHandleReveal username={song.discordUsername} size="xs" />
                    )}
                  </div>

                  {/* Concept snippet */}
                  {song.storyConcept && (
                    <div className="mt-3 text-xs text-stone-600 bg-sky-50/60 p-2.5 rounded-xl border border-sky-100 line-clamp-2 italic">
                      "{song.storyConcept}"
                    </div>
                  )}

                  {/* Score Breakdown if graded */}
                  {isGraded && !songFlag && (
                    <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-4 gap-1 text-center text-[10px]">
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                        <div className="text-stone-400">Writing</div>
                        <div className="font-extrabold text-stone-800 text-xs">
                          {judgeScore.writing}/25
                        </div>
                      </div>
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                        <div className="text-stone-400">Original</div>
                        <div className="font-extrabold text-stone-800 text-xs">
                          {judgeScore.originality}/25
                        </div>
                      </div>
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                        <div className="text-stone-400">Emotion</div>
                        <div className="font-extrabold text-stone-800 text-xs">
                          {judgeScore.emotion}/25
                        </div>
                      </div>
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                        <div className="text-stone-400">Structure</div>
                        <div className="font-extrabold text-stone-800 text-xs">
                          {judgeScore.structure}/25
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  {song.lyrics ? (
                    <button
                      type="button"
                      onClick={() => setViewingLyricsSong(song)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl aero-btn-secondary text-xs font-bold text-stone-700 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                      <span>Read Lyrics</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-stone-400">No lyrics attached</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectSongToGrade(song)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      songFlag
                        ? 'aero-btn-rose text-white'
                        : isGraded
                        ? 'aero-btn-secondary text-[#0284c7]'
                        : 'aero-btn-primary text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>
                      {songFlag
                        ? 'View Flagged Entry'
                        : isGraded
                        ? 'View Submitted Score'
                        : 'Grade Song'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Manual Add Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg aero-glass-card rounded-3xl p-6 text-stone-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Add Contest Song</h3>
                  <p className="text-xs text-stone-500">Only accessible to lead producer / admin</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {manualError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {manualError}
              </div>
            )}

            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Song Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Midnight Horizon"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Artist / Alias
                  </label>
                  <input
                    type="text"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    placeholder="e.g. Luna Starlight"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Discord Username
                  </label>
                  <input
                    type="text"
                    value={newDiscord}
                    onChange={(e) => setNewDiscord(e.target.value)}
                    placeholder="e.g. lunastarlight"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Optional Story / Concept
                </label>
                <textarea
                  rows={2}
                  value={newStory}
                  onChange={(e) => setNewStory(e.target.value)}
                  placeholder="Briefly describe the meaning or inspiration behind the lyrics..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Lyrics
                </label>
                <textarea
                  rows={5}
                  value={newLyrics}
                  onChange={(e) => setNewLyrics(e.target.value)}
                  placeholder="[Verse 1] ... [Chorus] ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 aero-btn-secondary rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 aero-btn-primary text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  Add Contest Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lyrics Reading Modal */}
      {viewingLyricsSong && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-2xl aero-glass-card rounded-3xl p-6 text-stone-900 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7]">
                  Contest Submission Lyrics
                </span>
                <h3 className="text-xl font-bold text-stone-900">{viewingLyricsSong.songTitle}</h3>
                <div className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-2">
                  <span>
                    Artist: <span className="font-semibold text-stone-900">{viewingLyricsSong.alias || 'Unknown'}</span>
                  </span>
                  {viewingLyricsSong.discordUsername && (
                    <DiscordHandleReveal username={viewingLyricsSong.discordUsername} size="xs" />
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingLyricsSong(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {viewingLyricsSong.storyConcept && (
              <div className="my-3 p-3 aero-glass rounded-xl text-xs text-stone-700">
                <span className="font-bold text-[#0284c7]">Story / Concept:</span>{' '}
                {viewingLyricsSong.storyConcept}
              </div>
            )}

            <div className="flex-1 overflow-y-auto my-2 p-4 aero-glass rounded-2xl select-text">
              <pre className="font-sans text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                {viewingLyricsSong.lyrics || 'No lyrics provided for this entry.'}
              </pre>
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewingLyricsSong(null)}
                className="px-4 py-2 aero-btn-secondary rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = viewingLyricsSong;
                  setViewingLyricsSong(null);
                  onSelectSongToGrade(s);
                }}
                className="px-5 py-2 aero-btn-primary text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-all"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Score This Song</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
