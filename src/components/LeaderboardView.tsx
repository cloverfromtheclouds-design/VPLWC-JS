import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Maximize2,
} from 'lucide-react';
import { SummertideFlowerLogo } from './SummertideFlowerLogo';
import { EntrantRanking, ContestSummaryStats, getTier } from '../types/contest';
import { JudgeOpinionModal, JudgeOpinionModalData } from './JudgeOpinionModal';

interface LeaderboardViewProps {
  rankings: EntrantRanking[];
  stats: ContestSummaryStats;
  onExportExcel?: () => void;
  onOpenScorecardForEntrant?: (entrantName: string) => void;
  onGoToScorecard?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  rankings,
  stats,
  onExportExcel,
  onOpenScorecardForEntrant,
  onGoToScorecard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntrants, setExpandedEntrants] = useState<{ [key: string]: boolean }>({});
  const [expandedOpinions, setExpandedOpinions] = useState<{ [key: string]: boolean }>({});
  const [copiedOpinionKey, setCopiedOpinionKey] = useState<string | null>(null);
  const [activeOpinionModal, setActiveOpinionModal] = useState<JudgeOpinionModalData | null>(null);
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'judges' | 'name'>('rank');

  const toggleExpand = (name: string) => {
    setExpandedEntrants((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const toggleOpinionExpand = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedOpinions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopyOpinion = (text: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedOpinionKey(key);
    setTimeout(() => setCopiedOpinionKey(null), 2000);
  };

  const filteredRankings = rankings
    .filter((r) =>
      r.entrantName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') return b.averageScore - a.averageScore;
      if (sortBy === 'judges') return b.judgeCount - a.judgeCount;
      if (sortBy === 'name') return a.entrantName.localeCompare(b.entrantName);
      return a.rank - b.rank;
    });

  const top3 = rankings.slice(0, 3);

  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Entrant / Song',
      'Judges Evaluated',
      'Final Average Score (/100)',
      'Writing Avg (/25)',
      'Originality Avg (/25)',
      'Emotion Avg (/25)',
      'Structure Avg (/25)',
      'Highest Score',
      'Lowest Score',
    ];

    const rows = rankings.map((r) => [
      r.rank,
      `"${r.entrantName.replace(/"/g, '""')}"`,
      r.judgeCount,
      r.averageScore.toFixed(2),
      r.writingAvg.toFixed(2),
      r.originalityAvg.toFixed(2),
      r.emotionAvg.toFixed(2),
      r.structureAvg.toFixed(2),
      r.highestScore,
      r.lowestScore,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'summertide-lyric-contest-final-rankings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-700 bg-pink-50/90 border border-pink-200/90 px-3 py-1 rounded-full mb-2 shadow-2xs">
            <SummertideFlowerLogo size="xs" />
            Automated Aggregation Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Official Contest Leaderboard
          </h2>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            All judges' scorecards are calculated automatically with multi-criteria weighted averages
            and tie-breaking rules. No manual calculations required.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all hover:shadow-md cursor-pointer"
              title="Download full contest results in Excel (.xlsx) format"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export to Excel (.xlsx)</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
            title="Download CSV report"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
            title="Print or save as PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/60 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl border border-white/90 shadow-[0_10px_30px_rgba(255,20,147,0.06),0_1px_1px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wide">
            Submissions Ranked
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
            {stats.totalEntrants}
          </div>
          <div className="text-xs text-stone-500 mt-1 font-medium">Eligible contest entries</div>
        </div>

        <div className="bg-white/60 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl border border-white/90 shadow-[0_10px_30px_rgba(255,20,147,0.06),0_1px_1px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wide">
            Participating Judges
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2563eb] mt-1">
            {stats.totalJudges}
          </div>
          <div className="text-xs text-stone-500 mt-1 font-medium">
            {stats.totalSubmissions} individual scorecards
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl border border-white/90 shadow-[0_10px_30px_rgba(255,20,147,0.06),0_1px_1px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wide">
            Contest Score Average
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
            {stats.overallAverage > 0 ? stats.overallAverage.toFixed(1) : '—'}
            <span className="text-xs font-semibold text-stone-500 ml-1">/ 100 max</span>
          </div>
          <div className="text-xs text-stone-500 mt-1 font-medium">
            {stats.overallAverage > 0
              ? `${(stats.overallAverage / 4).toFixed(2)} avg per criterion`
              : 'Awaiting scores'}
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl border border-white/90 shadow-[0_10px_30px_rgba(255,20,147,0.06),0_1px_1px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            Top Contender
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-stone-900 mt-1 truncate">
            {stats.topEntrantName || 'None'}
          </div>
          <div className="text-xs font-bold text-amber-700 mt-1">
            {stats.topEntrantScore > 0 ? `${stats.topEntrantScore.toFixed(2)} pts` : '—'}
          </div>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {top3.map((entrant, idx) => {
            const isWinner = idx === 0;
            const isSecond = idx === 1;
            const tier = getTier(entrant.averageScore / 4);

            return (
              <div
                key={entrant.entrantName}
                className={`relative rounded-2xl p-5 border transition-all ${
                  isWinner
                    ? 'bg-gradient-to-b from-amber-50/80 to-white border-amber-300 shadow-md ring-2 ring-amber-400/30'
                    : isSecond
                    ? 'bg-gradient-to-b from-slate-50/90 to-white border-slate-300 shadow-xs'
                    : 'bg-gradient-to-b from-orange-50/60 to-white border-amber-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isWinner ? (
                      <span className="w-8 h-8 rounded-full bg-amber-500 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                        🥇
                      </span>
                    ) : isSecond ? (
                      <span className="w-8 h-8 rounded-full bg-slate-400 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                        🥈
                      </span>
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-amber-700/80 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                        🥉
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isWinner
                          ? 'text-amber-800'
                          : isSecond
                          ? 'text-slate-700'
                          : 'text-amber-900'
                      }`}
                    >
                      {isWinner ? '1st Place Winner' : isSecond ? '2nd Place Runner-Up' : '3rd Place Honoree'}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}
                  >
                    {tier.label}
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 text-base sm:text-lg tracking-tight line-clamp-1">
                  {entrant.entrantName}
                </h3>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-stone-900 tabular-nums">
                      {entrant.averageScore.toFixed(2)}
                    </span>
                    <span className="text-xs text-stone-500 ml-1">/ 100 max</span>
                  </div>
                  <div className="text-right text-xs text-stone-500">
                    <span className="font-bold text-stone-800">{entrant.judgeCount}</span>{' '}
                    {entrant.judgeCount === 1 ? 'judge' : 'judges'} scored
                  </div>
                </div>

                {/* Criterion preview pills */}
                <div className="mt-4 grid grid-cols-4 gap-1 text-center bg-stone-100/80 p-2 rounded-xl text-[11px]">
                  <div>
                    <div className="text-stone-400 font-medium">Writing</div>
                    <div className="font-bold text-stone-800">{entrant.writingAvg.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-stone-400 font-medium">Original</div>
                    <div className="font-bold text-stone-800">{entrant.originalityAvg.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-stone-400 font-medium">Emotion</div>
                    <div className="font-bold text-stone-800">{entrant.emotionAvg.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-stone-400 font-medium">Struct</div>
                    <div className="font-bold text-stone-800">{entrant.structureAvg.toFixed(1)}</div>
                  </div>
                </div>

                {/* Recent Judge Comment Snippet - Click to expand / extract */}
                {entrant.judgeBreakdowns[0]?.comments && (
                  <div
                    onClick={(e) => toggleOpinionExpand(`podium-${entrant.entrantName}`, e)}
                    className="mt-3 text-xs bg-white/90 p-2.5 rounded-xl border border-stone-200/80 cursor-pointer hover:border-sky-300 transition-all group"
                    title="Click to expand or collapse opinion"
                  >
                    <div className="flex items-center justify-between text-[10px] text-stone-400 group-hover:text-[#0284c7] font-semibold mb-1">
                      <span className="flex items-center gap-1 uppercase tracking-wider font-bold">
                        <MessageSquare className="w-3 h-3 text-[#0284c7]" />
                        Judge Opinion
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) =>
                            handleCopyOpinion(
                              entrant.judgeBreakdowns[0].comments,
                              `podium-${entrant.entrantName}`,
                              e
                            )
                          }
                          className="px-1.5 py-0.5 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                          title="Copy opinion to clipboard"
                        >
                          {copiedOpinionKey === `podium-${entrant.entrantName}` ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              <Check className="w-3 h-3 text-emerald-600" /> Copied
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Copy className="w-3 h-3" /> Copy
                            </span>
                          )}
                        </button>
                        <span>{expandedOpinions[`podium-${entrant.entrantName}`] ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    <div
                      className={`text-stone-700 font-serif italic leading-relaxed whitespace-pre-wrap ${
                        expandedOpinions[`podium-${entrant.entrantName}`] ? '' : 'line-clamp-2'
                      }`}
                    >
                      “{entrant.judgeBreakdowns[0].comments}”
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Rankings Table Container */}
      <div className="bg-white/65 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_15px_40px_rgba(255,20,147,0.08),0_1px_1px_rgba(255,255,255,0.95)_inset] ring-1 ring-white/60 overflow-hidden">
        {/* Table Search & Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/40">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search entrant, song title, or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/80 border border-stone-300/80 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-stone-300 text-stone-700 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#426b63]"
            >
              <option value="rank">Rank (High to Low)</option>
              <option value="score">Final Score</option>
              <option value="judges">Number of Judges</option>
              <option value="name">Entrant Name</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredRankings.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800">No score records found</h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mt-1">
              No contest songs have received judge scores yet. Select any song in the Judge Scorecard to begin grading.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {onGoToScorecard && (
                <button
                  onClick={onGoToScorecard}
                  className="px-4 py-2 bg-[#0284c7] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:bg-[#0369a1] transition-all cursor-pointer"
                >
                  + Score Song in Scorecard
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-100/60 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 pl-4 sm:pl-6 pr-2 w-16">Rank</th>
                  <th className="py-3.5 px-3">Entrant / Song Title</th>
                  <th className="py-3.5 px-3 text-center">Judges</th>
                  <th className="py-3.5 px-3 text-right">Final Average</th>
                  <th className="hidden md:table-cell py-3.5 px-3 text-center">Writing (/25)</th>
                  <th className="hidden md:table-cell py-3.5 px-3 text-center">Original (/25)</th>
                  <th className="hidden md:table-cell py-3.5 px-3 text-center">Emotion (/25)</th>
                  <th className="hidden md:table-cell py-3.5 px-3 text-center">Structure (/25)</th>
                  <th className="py-3.5 px-3 text-center">Range</th>
                  <th className="py-3.5 pr-4 sm:pr-6 pl-2 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredRankings.map((entrant) => {
                  const isExpanded = !!expandedEntrants[entrant.entrantName];
                  const tier = getTier(entrant.averageScore / 4);

                  return (
                    <React.Fragment key={entrant.entrantName}>
                      <tr
                        className={`hover:bg-stone-50/80 transition-colors ${
                          entrant.rank <= 3 ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 pl-4 sm:pl-6 pr-2">
                          <div className="flex items-center gap-1.5 font-black text-stone-900">
                            {entrant.isDisqualified ? (
                              <span className="px-2 py-1 rounded-lg bg-rose-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                                DQ
                              </span>
                            ) : entrant.rank === 1 ? (
                              <span className="w-7 h-7 rounded-lg bg-amber-400 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                                #1
                              </span>
                            ) : entrant.rank === 2 ? (
                              <span className="w-7 h-7 rounded-lg bg-slate-400 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                                #2
                              </span>
                            ) : entrant.rank === 3 ? (
                              <span className="w-7 h-7 rounded-lg bg-amber-700/80 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                                #3
                              </span>
                            ) : (
                              <span className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 font-bold flex items-center justify-center text-xs">
                                #{entrant.rank}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Entrant Name */}
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm sm:text-base">
                              {entrant.entrantName}
                            </span>
                            {entrant.isDisqualified && (
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                                Disqualified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${tier.bg} ${tier.color}`}
                            >
                              {tier.label}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {(entrant.averageScore / 4).toFixed(2)} avg / criteria
                            </span>
                          </div>
                        </td>

                        {/* Judge count */}
                        <td className="py-4 px-3 text-center font-semibold text-stone-700">
                          <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md text-xs">
                            {entrant.judgeCount} {entrant.judgeCount === 1 ? 'judge' : 'judges'}
                          </span>
                        </td>

                        {/* Final Average */}
                        <td className="py-4 px-3 text-right">
                          <div className="text-base sm:text-lg font-black text-stone-900 tabular-nums">
                            {entrant.averageScore.toFixed(2)}
                          </div>
                          <div className="text-[11px] text-stone-500 font-medium">
                            {entrant.totalPoints} total pts
                          </div>
                        </td>

                        {/* Criteria Breakdowns */}
                        <td className="hidden md:table-cell py-4 px-3 text-center font-bold text-stone-800">
                          {entrant.writingAvg.toFixed(1)}
                        </td>
                        <td className="hidden md:table-cell py-4 px-3 text-center font-bold text-stone-800">
                          {entrant.originalityAvg.toFixed(1)}
                        </td>
                        <td className="hidden md:table-cell py-4 px-3 text-center font-bold text-stone-800">
                          {entrant.emotionAvg.toFixed(1)}
                        </td>
                        <td className="hidden md:table-cell py-4 px-3 text-center font-bold text-stone-800">
                          {entrant.structureAvg.toFixed(1)}
                        </td>

                        {/* Spread / Range */}
                        <td className="py-4 px-3 text-center">
                          <span className="text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded-md font-mono">
                            {entrant.lowestScore} – {entrant.highestScore}
                          </span>
                        </td>

                        {/* Expand / Details */}
                        <td className="py-4 pr-4 sm:pr-6 pl-2 text-right">
                          <button
                            onClick={() => toggleExpand(entrant.entrantName)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors"
                          >
                            <span>{isExpanded ? 'Hide' : 'Scores'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Accordion with Individual Judges' Scorecards */}
                      {isExpanded && (
                        <tr className="bg-stone-50/90 border-b border-stone-200">
                          <td colSpan={10} className="p-4 sm:p-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                                  Individual Judge Scorecards for “{entrant.entrantName}”
                                </h4>
                                {onOpenScorecardForEntrant && (
                                  <button
                                    onClick={() => onOpenScorecardForEntrant(entrant.entrantName)}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                                  >
                                    + Add New Scorecard for this Entrant
                                  </button>
                                )}
                              </div>

                              {entrant.storyConcept && (
                                <div className="p-3 bg-amber-50/80 border-l-3 border-[#c28c3b] rounded-r-xl text-xs text-[#5e4a2f]">
                                  <span className="font-bold text-[#91621f] block text-[10px] uppercase tracking-wider mb-0.5">
                                    Story & Concept Inspiration:
                                  </span>
                                  “{entrant.storyConcept}”
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {entrant.judgeBreakdowns.map((jb, jIdx) => (
                                  <div
                                    key={jIdx}
                                    className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="font-bold text-stone-900 text-xs sm:text-sm">
                                          {jb.judgeName}
                                        </div>
                                        <div className="text-[10px] text-stone-400">
                                          {jb.timestamp}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-base font-black text-stone-900 tabular-nums">
                                          {jb.totalScore}
                                        </span>
                                        <span className="text-[10px] text-stone-500"> / 100</span>
                                      </div>
                                    </div>

                                    {/* Criteria score dots */}
                                    <div className="grid grid-cols-4 gap-1 text-[10px] text-center bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                                      <div>
                                        <span className="text-stone-400">W: </span>
                                        <strong className="text-stone-800">{jb.writing}</strong>
                                      </div>
                                      <div>
                                        <span className="text-stone-400">O: </span>
                                        <strong className="text-stone-800">{jb.originality}</strong>
                                      </div>
                                      <div>
                                        <span className="text-stone-400">E: </span>
                                        <strong className="text-stone-800">{jb.emotion}</strong>
                                      </div>
                                      <div>
                                        <span className="text-stone-400">S: </span>
                                        <strong className="text-stone-800">{jb.structure}</strong>
                                      </div>
                                    </div>

                                    {jb.comments ? (
                                      <div
                                        onClick={() =>
                                          setActiveOpinionModal({
                                            judgeName: jb.judgeName,
                                            entrantName: entrant.entrantName,
                                            totalScore: jb.totalScore,
                                            comments: jb.comments,
                                            timestamp: jb.timestamp,
                                            scores: {
                                              writing: jb.writing,
                                              originality: jb.originality,
                                              emotion: jb.emotion,
                                              structure: jb.structure,
                                            },
                                          })
                                        }
                                        className="relative rounded-xl border border-stone-200/90 bg-stone-50/80 hover:bg-sky-50/70 hover:border-sky-300 transition-all cursor-pointer group text-xs p-2.5 shadow-2xs"
                                        title="Click to open full opinion in screen pop-up"
                                      >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7] transition-colors flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3 text-[#0284c7]" />
                                            <span>Opinion · Click for Pop-up</span>
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={(e) =>
                                                handleCopyOpinion(
                                                  jb.comments,
                                                  `jb-${entrant.entrantName}-${jIdx}`,
                                                  e
                                                )
                                              }
                                              className="p-1 rounded-md bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200 transition-colors inline-flex items-center gap-1 text-[10px] font-semibold"
                                              title="Copy opinion text"
                                            >
                                              {copiedOpinionKey === `jb-${entrant.entrantName}-${jIdx}` ? (
                                                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                                  <Check className="w-3 h-3 text-emerald-600" /> Copied
                                                </span>
                                              ) : (
                                                <span className="flex items-center gap-0.5">
                                                  <Copy className="w-3 h-3" /> Copy
                                                </span>
                                              )}
                                            </button>
                                            <Maximize2 className="w-3 h-3 text-sky-500 opacity-70 group-hover:opacity-100" />
                                          </div>
                                        </div>

                                        <div className="font-serif italic text-stone-800 leading-relaxed whitespace-pre-wrap line-clamp-2">
                                          “{jb.comments}”
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-stone-400 italic">
                                        No comments provided.
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screen Pop-up Modal for Reading Judge Opinion */}
      <JudgeOpinionModal
        data={activeOpinionModal}
        onClose={() => setActiveOpinionModal(null)}
      />
    </div>
  );
};
