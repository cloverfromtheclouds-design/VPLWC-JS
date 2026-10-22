import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Award,
  Sparkles,
  Copy,
  Check,
  Music,
} from 'lucide-react';
import {
  JudgeScoreSubmission,
  ContestSongEntry,
  RegisteredJudge,
} from '../types/contest';

interface JudgeMonitoringBoardProps {
  scores: JudgeScoreSubmission[];
  songs: ContestSongEntry[];
  registeredJudges?: RegisteredJudge[];
  onAddJudge?: (name: string) => Promise<void>;
  onDeleteJudge?: (nameOrId: string) => void | Promise<void>;
  onViewJudgeScores?: (judgeName: string) => void;
}

export const JudgeMonitoringBoard: React.FC<JudgeMonitoringBoardProps> = ({
  scores,
  songs,
  registeredJudges = [],
  onDeleteJudge,
  onViewJudgeScores,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [expandedJudges, setExpandedJudges] = useState<{ [key: string]: boolean }>({});
  const [copiedLinkFor, setCopiedLinkFor] = useState<string | null>(null);

  // Combine judges from registered list and any judges present in scores
  const allJudgeNames = useMemo(() => {
    const set = new Set<string>();
    registeredJudges.forEach((j) => {
      if (j.name && j.name.trim()) set.add(j.name.trim());
    });
    scores.forEach((s) => {
      if (s.judgeName && s.judgeName.trim()) set.add(s.judgeName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [registeredJudges, scores]);

  const totalSongs = songs.length;

  // Compute metrics per judge
  const judgeProgressList = useMemo(() => {
    return allJudgeNames.map((name) => {
      const lowerName = name.toLowerCase();

      // Find registration record if exists
      const regRecord = registeredJudges.find(
        (r) => r.name.trim().toLowerCase() === lowerName
      );

      // Scorecards submitted by this judge
      const judgeScores = scores.filter(
        (s) => s.judgeName.trim().toLowerCase() === lowerName
      );

      // Unique songs graded
      const gradedSongs = songs.filter((song) => {
        const sTitle = song.songTitle.trim().toLowerCase();
        const sFormatted = (song.formattedEntrantName || '').trim().toLowerCase();
        return judgeScores.some((sc) => {
          const scTitle = (sc.songTitle || '').trim().toLowerCase();
          const scEntrant = sc.entrantName.trim().toLowerCase();
          return (
            scTitle === sTitle ||
            scTitle === sFormatted ||
            scEntrant === sTitle ||
            scEntrant === sFormatted
          );
        });
      });

      const gradedCount = gradedSongs.length;
      const percent = totalSongs === 0 ? 0 : Math.round((gradedCount / totalSongs) * 100);

      // Ungraded songs
      const remainingSongs = songs.filter((song) => !gradedSongs.some((g) => g.id === song.id));

      // Averages
      let totalPoints = 0;
      let writingSum = 0;
      let origSum = 0;
      let emotionSum = 0;
      let structSum = 0;
      let maxScore = 0;
      let minScore = 100;

      judgeScores.forEach((s) => {
        totalPoints += s.totalScore;
        writingSum += s.writing;
        origSum += s.originality;
        emotionSum += s.emotion;
        structSum += s.structure;
        if (s.totalScore > maxScore) maxScore = s.totalScore;
        if (s.totalScore < minScore) minScore = s.totalScore;
      });

      const avgTotal = judgeScores.length > 0 ? totalPoints / judgeScores.length : 0;
      const avgWriting = judgeScores.length > 0 ? writingSum / judgeScores.length : 0;
      const avgOriginality = judgeScores.length > 0 ? origSum / judgeScores.length : 0;
      const avgEmotion = judgeScores.length > 0 ? emotionSum / judgeScores.length : 0;
      const avgStructure = judgeScores.length > 0 ? structSum / judgeScores.length : 0;

      // Status classification
      let status: 'completed' | 'in_progress' | 'not_started' = 'not_started';
      if (totalSongs > 0 && gradedCount >= totalSongs) {
        status = 'completed';
      } else if (gradedCount > 0) {
        status = 'in_progress';
      }

      // Latest timestamp
      const timestamps = [
        ...judgeScores.map((s) => s.timestamp),
        regRecord?.lastActiveAt,
        regRecord?.registeredAt,
      ].filter(Boolean) as string[];

      timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const latestActivity = timestamps[0] || null;

      return {
        name,
        regRecord,
        status,
        gradedCount,
        totalSongs,
        percent,
        judgeScoresCount: judgeScores.length,
        remainingSongs,
        avgTotal,
        avgWriting,
        avgOriginality,
        avgEmotion,
        avgStructure,
        maxScore: judgeScores.length > 0 ? maxScore : 0,
        minScore: judgeScores.length > 0 ? minScore : 0,
        latestActivity,
      };
    });
  }, [allJudgeNames, registeredJudges, scores, songs, totalSongs]);

  // Overall Contest Completion
  const contestStats = useMemo(() => {
    const totalJudges = allJudgeNames.length;
    const completedJudges = judgeProgressList.filter((j) => j.status === 'completed').length;
    const inProgressJudges = judgeProgressList.filter((j) => j.status === 'in_progress').length;
    const notStartedJudges = judgeProgressList.filter((j) => j.status === 'not_started').length;

    const expectedScorecards = totalJudges * totalSongs;
    const actualScorecards = scores.length;
    const overallProgress =
      expectedScorecards > 0
        ? Math.min(100, Math.round((actualScorecards / expectedScorecards) * 100))
        : 0;

    return {
      totalJudges,
      completedJudges,
      inProgressJudges,
      notStartedJudges,
      expectedScorecards,
      actualScorecards,
      overallProgress,
    };
  }, [allJudgeNames.length, judgeProgressList, scores.length, totalSongs]);

  // Filtered List
  const filteredJudges = useMemo(() => {
    return judgeProgressList.filter((j) => {
      const matchesSearch = j.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [judgeProgressList, searchQuery, statusFilter]);

  const toggleExpand = (name: string) => {
    setExpandedJudges((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleCopyPersonalLink = (judgeName: string) => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('role', 'judge');
    url.searchParams.set('name', judgeName);
    navigator.clipboard.writeText(url.toString());
    setCopiedLinkFor(judgeName);
    setTimeout(() => setCopiedLinkFor(null), 2500);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-[#0c2e42] to-[#14425d] text-white rounded-3xl p-5 sm:p-6 shadow-md border border-sky-800/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5 text-sky-300" />
              <span>Real-Time Judge Roster & Progress</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight">
              Judge Monitoring Board
            </h2>
            <p className="text-xs sm:text-sm text-sky-200/80 mt-1 max-w-2xl leading-relaxed">
              Track live evaluation progress for all judges scoring the contest, see remaining songs left to
              score, inspect individual grading tendencies, and copy judge invite links.
            </p>
          </div>
        </div>

        {/* Contest-Wide Progress Bar */}
        <div className="mt-6 pt-5 border-t border-sky-800/60">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold mb-2">
            <span className="text-sky-200">Overall Contest Evaluation Completion</span>
            <span className="text-white font-extrabold tabular-nums">
              {contestStats.actualScorecards} of {contestStats.expectedScorecards} Scorecards Recorded ({contestStats.overallProgress}%)
            </span>
          </div>
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 rounded-full transition-all duration-300 shadow-xs"
              style={{ width: `${contestStats.overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#0284c7]" />
            Registered Judges
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
            {contestStats.totalJudges}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 font-medium">Active evaluating panel</div>
        </div>

        <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            100% Completed
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
            {contestStats.completedJudges}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 font-medium">Finished all {totalSongs} entries</div>
        </div>

        <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            In Progress
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
            {contestStats.inProgressJudges}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 font-medium">Currently grading songs</div>
        </div>

        <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-xs">
          <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wide flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-stone-500" />
            Not Started
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-700 mt-1">
            {contestStats.notStartedJudges}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 font-medium">0 scorecards recorded</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search judges by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/90 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider shrink-0">
            Filter Status:
          </span>
          {(['all', 'completed', 'in_progress', 'not_started'] as const).map((filterKey) => {
            const labels = {
              all: `All (${judgeProgressList.length})`,
              completed: `Completed (${contestStats.completedJudges})`,
              in_progress: `In Progress (${contestStats.inProgressJudges})`,
              not_started: `Not Started (${contestStats.notStartedJudges})`,
            };
            return (
              <button
                key={filterKey}
                onClick={() => setStatusFilter(filterKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === filterKey
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {labels[filterKey]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Judges Cards Grid / Roster */}
      {filteredJudges.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/80 p-12 text-center text-stone-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-500" />
          <p className="text-sm font-semibold">
            {searchQuery
              ? `No judges matching "${searchQuery}".`
              : 'No judges registered yet. Click "Register New Judge" to add the first judge!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJudges.map((judge) => {
            const isExpanded = !!expandedJudges[judge.name];
            const initials = judge.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();

            return (
              <div
                key={judge.name}
                className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Main Judge Summary Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Avatar & Identity */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-[#0284c7] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs border border-white/80">
                      {initials || 'J'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black text-stone-900 truncate">
                          {judge.name}
                        </h4>

                        {/* Status Badge */}
                        {judge.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>100% Completed</span>
                          </span>
                        )}
                        {judge.status === 'in_progress' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>In Progress ({judge.gradedCount}/{judge.totalSongs})</span>
                          </span>
                        )}
                        {judge.status === 'not_started' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
                            <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                            <span>Not Started (0/{judge.totalSongs})</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-3">
                        <span>
                          <strong>{judge.gradedCount}</strong> of <strong>{judge.totalSongs}</strong> songs evaluated
                        </span>
                        {judge.latestActivity && (
                          <>
                            <span>•</span>
                            <span>
                              Active: {new Date(judge.latestActivity).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </>
                        )}
                        {judge.judgeScoresCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-[#0284c7] font-bold">
                              Avg Awarded: {judge.avgTotal.toFixed(1)}/100
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Progress Meter */}
                  <div className="w-full md:w-56 shrink-0 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                      <span>Grading Progress</span>
                      <span className="text-[#0284c7]">{judge.percent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          judge.percent === 100
                            ? 'bg-emerald-500'
                            : judge.percent > 0
                            ? 'bg-gradient-to-r from-sky-500 to-[#0284c7]'
                            : 'bg-stone-300'
                        }`}
                        style={{ width: `${judge.percent}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-stone-500 text-right">
                      {judge.remainingSongs.length === 0 ? (
                        <span className="text-emerald-700 font-semibold">All songs graded</span>
                      ) : (
                        <span>{judge.remainingSongs.length} songs remaining</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      onClick={() => handleCopyPersonalLink(judge.name)}
                      className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copy direct judging link for this judge"
                    >
                      {copiedLinkFor === judge.name ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-500" />
                          <span className="hidden sm:inline">Invite Link</span>
                        </>
                      )}
                    </button>

                    {onViewJudgeScores && judge.judgeScoresCount > 0 && (
                      <button
                        onClick={() => onViewJudgeScores(judge.name)}
                        className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0284c7] text-xs font-bold transition-colors cursor-pointer"
                        title="View all scorecards submitted by this judge"
                      >
                        Scorecards ({judge.judgeScoresCount})
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(judge.name)}
                      className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Details' : 'Details'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {onDeleteJudge && (
                      <button
                        onClick={() => onDeleteJudge(judge.name)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title={`Delete Judge "${judge.name}" and remove all their scorecards`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details: Stats & Remaining Songs Checklist */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-stone-100 bg-stone-50/60 animate-in fade-in duration-150 space-y-4">
                    {/* Scoring Breakdown Criteria */}
                    {judge.judgeScoresCount > 0 ? (
                      <div>
                        <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-[#0284c7]" />
                          <span>Judging Tendencies & Averages Awarded</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                            <span className="text-stone-400 block text-[10px]">Average Total</span>
                            <span className="text-base font-black text-stone-900 mt-0.5 block">
                              {judge.avgTotal.toFixed(1)}{' '}
                              <span className="text-xs font-normal text-stone-400">/ 100</span>
                            </span>
                            <span className="text-[10px] text-stone-500">
                              Range: {judge.minScore} – {judge.maxScore}
                            </span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                            <span className="text-stone-400 block text-[10px]">Writing Quality</span>
                            <span className="text-base font-black text-stone-900 mt-0.5 block">
                              {judge.avgWriting.toFixed(1)}{' '}
                              <span className="text-xs font-normal text-stone-400">/ 25</span>
                            </span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                            <span className="text-stone-400 block text-[10px]">Originality</span>
                            <span className="text-base font-black text-stone-900 mt-0.5 block">
                              {judge.avgOriginality.toFixed(1)}{' '}
                              <span className="text-xs font-normal text-stone-400">/ 25</span>
                            </span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                            <span className="text-stone-400 block text-[10px]">Emotional Impact</span>
                            <span className="text-base font-black text-stone-900 mt-0.5 block">
                              {judge.avgEmotion.toFixed(1)}{' '}
                              <span className="text-xs font-normal text-stone-400">/ 25</span>
                            </span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                            <span className="text-stone-400 block text-[10px]">Structure & Cohesion</span>
                            <span className="text-base font-black text-stone-900 mt-0.5 block">
                              {judge.avgStructure.toFixed(1)}{' '}
                              <span className="text-xs font-normal text-stone-400">/ 25</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900">
                        This judge has not submitted any scorecards yet. Share their personal invite
                        link to begin.
                      </div>
                    )}

                    {/* Remaining Songs Checklist */}
                    <div>
                      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-[#0284c7]" />
                          Remaining Songs for {judge.name} ({judge.remainingSongs.length})
                        </span>
                        {judge.remainingSongs.length === 0 && (
                          <span className="text-emerald-700 font-bold text-xs">
                            ✓ All contest songs completed
                          </span>
                        )}
                      </div>

                      {judge.remainingSongs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {judge.remainingSongs.map((song) => (
                            <div
                              key={song.id}
                              className="p-2.5 bg-white rounded-xl border border-stone-200 text-xs flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-stone-900 truncate">
                                  {song.songTitle}
                                </div>
                                <div className="text-[11px] text-stone-500 truncate">
                                  {song.alias || 'Unknown'} {song.discordUsername && `@${song.discordUsername}`}
                                </div>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                Pending
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                          Judge {judge.name} has finished scoring every single entry in the contest queue.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
