import * as XLSX from 'xlsx';
import { EntrantRanking, JudgeScoreSubmission, ContestSongEntry, ContestSummaryStats, getTier } from '../types/contest';

export interface ExcelExportOptions {
  filename?: string;
}

/**
 * Generates and downloads a multi-sheet Microsoft Excel (.xlsx) workbook
 * containing official contest rankings, all raw judge scorecards, and registered song entries.
 */
export function exportContestToExcel(
  rankings: EntrantRanking[],
  scores: JudgeScoreSubmission[],
  songs: ContestSongEntry[],
  stats: ContestSummaryStats,
  options: ExcelExportOptions = {}
): void {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = options.filename || `Summertide_Contest_Scoring_Report_${dateStr}.xlsx`;

  // 1. Executive Summary Sheet
  const summaryData = [
    ['Summertide Studio Lyric Contest - Official Scoring Report'],
    [`Generated: ${new Date().toLocaleString()}`],
    [''],
    ['Metric', 'Value'],
    ['Total Registered Songs', songs.length],
    ['Total Ranked Entrants', rankings.length],
    ['Total Judge Submissions', stats.totalSubmissions],
    ['Unique Judges Participated', stats.totalJudges],
    ['Contest Overall Average Score (/100)', Number(stats.overallAverage.toFixed(2))],
    ['First Place / Top Scoring Entry', stats.topEntrantName || 'N/A'],
    ['Top Entry Final Score (/100)', Number(stats.topEntrantScore.toFixed(2))],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 35 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Executive Summary');

  // 2. Final Rankings Sheet
  const rankingsHeaders = [
    'Rank',
    'Tier / Rating',
    'Entrant / Song Title',
    'Artist / Alias',
    'Discord Handle',
    'Final Overall Score (/100)',
    'Judges Evaluated',
    'Writing Quality Avg (/25)',
    'Originality & Creativity Avg (/25)',
    'Emotional Impact Avg (/25)',
    'Structure & Cohesion Avg (/25)',
    'Highest Score Awarded',
    'Lowest Score Awarded',
    'Story / Concept Brief',
  ];

  const rankingsRows = rankings.map((r) => {
    const tier = getTier(r.averageScore / 4);
    const matchedSong = songs.find(
      (s) =>
        s.songTitle.trim().toLowerCase() === r.entrantName.trim().toLowerCase() ||
        s.formattedEntrantName.trim().toLowerCase() === r.entrantName.trim().toLowerCase()
    );

    const alias = r.alias || matchedSong?.alias || '';
    const discord = r.discordUsername || matchedSong?.discordUsername || '';
    const story = r.storyConcept || matchedSong?.storyConcept || '';

    return [
      r.rank,
      tier.label,
      r.entrantName,
      alias,
      discord,
      Number(r.averageScore.toFixed(2)),
      r.judgeCount,
      Number(r.writingAvg.toFixed(2)),
      Number(r.originalityAvg.toFixed(2)),
      Number(r.emotionAvg.toFixed(2)),
      Number(r.structureAvg.toFixed(2)),
      r.highestScore,
      r.lowestScore,
      story,
    ];
  });

  const rankingsSheet = XLSX.utils.aoa_to_sheet([rankingsHeaders, ...rankingsRows]);
  rankingsSheet['!cols'] = [
    { wch: 8 },  // Rank
    { wch: 16 }, // Tier
    { wch: 32 }, // Entrant
    { wch: 22 }, // Artist
    { wch: 22 }, // Discord
    { wch: 24 }, // Score 100
    { wch: 16 }, // Judges count
    { wch: 24 }, // Writing /25
    { wch: 26 }, // Originality /25
    { wch: 24 }, // Emotion /25
    { wch: 24 }, // Structure /25
    { wch: 14 }, // Highest
    { wch: 14 }, // Lowest
    { wch: 45 }, // Story
  ];
  XLSX.utils.book_append_sheet(wb, rankingsSheet, 'Final Rankings');

  // 3. All Raw Judge Scores Sheet
  const scoresHeaders = [
    'Timestamp',
    'Judge Name',
    'Entrant / Song Title',
    'Artist / Alias',
    'Discord Handle',
    'Writing Quality (/25)',
    'Originality & Creativity (/25)',
    'Emotional Impact (/25)',
    'Structure & Cohesion (/25)',
    'Total Score (/100)',
    'Judge Comments / Feedback',
  ];

  const scoresRows = scores.map((s) => [
    s.timestamp ? new Date(s.timestamp).toLocaleString() : '',
    s.judgeName,
    s.entrantName,
    s.alias || '',
    s.discordUsername || '',
    s.writing,
    s.originality,
    s.emotion,
    s.structure,
    s.totalScore,
    s.comments || '',
  ]);

  const scoresSheet = XLSX.utils.aoa_to_sheet([scoresHeaders, ...scoresRows]);
  scoresSheet['!cols'] = [
    { wch: 20 }, // Timestamp
    { wch: 20 }, // Judge
    { wch: 30 }, // Song
    { wch: 20 }, // Artist
    { wch: 20 }, // Discord
    { wch: 20 }, // Writing /25
    { wch: 24 }, // Originality /25
    { wch: 20 }, // Emotion /25
    { wch: 22 }, // Structure /25
    { wch: 18 }, // Total 100
    { wch: 60 }, // Comments
  ];
  XLSX.utils.book_append_sheet(wb, scoresSheet, 'All Judge Scorecards');

  // 4. Contest Song Entries Sheet
  const songsHeaders = [
    'Song Title',
    'Artist / Alias',
    'Discord Username',
    'Story / Concept Inspiration',
    'Lyrics Text',
    'Date Added',
    'Added By',
  ];

  const songsRows = songs.map((s) => [
    s.songTitle,
    s.alias || '',
    s.discordUsername || '',
    s.storyConcept || '',
    s.lyrics || '',
    s.addedAt ? new Date(s.addedAt).toLocaleDateString() : '',
    s.addedBy || 'Admin',
  ]);

  const songsSheet = XLSX.utils.aoa_to_sheet([songsHeaders, ...songsRows]);
  songsSheet['!cols'] = [
    { wch: 30 }, // Song Title
    { wch: 22 }, // Artist
    { wch: 22 }, // Discord
    { wch: 40 }, // Story
    { wch: 60 }, // Lyrics
    { wch: 14 }, // Date Added
    { wch: 16 }, // Added By
  ];
  XLSX.utils.book_append_sheet(wb, songsSheet, 'Contest Song Entries');

  // Write and trigger download
  XLSX.writeFile(wb, filename);
}
