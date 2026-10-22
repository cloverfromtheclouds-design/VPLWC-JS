import {
  JudgeScoreSubmission,
  EntrantRanking,
  ContestSummaryStats,
  SongFlag,
} from '../types/contest';

export function calculateRankings(
  scores: JudgeScoreSubmission[],
  flags: SongFlag[] = []
): EntrantRanking[] {
  if (!scores || scores.length === 0) return [];

  // Group by trimmed entrant name
  const groups: { [key: string]: JudgeScoreSubmission[] } = {};
  const displayNameMap: { [key: string]: string } = {};

  for (const score of scores) {
    const rawName = (score.entrantName || 'Untitled Submission').trim();
    if (!rawName) continue;
    const normalizedKey = rawName.toLowerCase();
    if (!groups[normalizedKey]) {
      groups[normalizedKey] = [];
      displayNameMap[normalizedKey] = rawName;
    }
    groups[normalizedKey].push(score);
  }

  const unrankedList: Omit<EntrantRanking, 'rank'>[] = Object.keys(groups).map((key) => {
    const entrantScores = groups[key];
    const entrantName = displayNameMap[key];
    const judgeCount = entrantScores.length;

    let totalPoints = 0;
    let writingSum = 0;
    let origSum = 0;
    let emotionSum = 0;
    let structSum = 0;
    let highestScore = -Infinity;
    let lowestScore = Infinity;

    const judgeBreakdowns = entrantScores.map((s) => {
      totalPoints += s.totalScore;
      writingSum += s.writing;
      origSum += s.originality;
      emotionSum += s.emotion;
      structSum += s.structure;

      if (s.totalScore > highestScore) highestScore = s.totalScore;
      if (s.totalScore < lowestScore) lowestScore = s.totalScore;

      return {
        judgeName: s.judgeName || 'Independent Judge',
        totalScore: s.totalScore,
        writing: s.writing,
        originality: s.originality,
        emotion: s.emotion,
        structure: s.structure,
        comments: s.comments || '',
        timestamp: s.timestamp,
      };
    });

    const averageScore = judgeCount > 0 ? totalPoints / judgeCount : 0;
    const writingAvg = judgeCount > 0 ? writingSum / judgeCount : 0;
    const originalityAvg = judgeCount > 0 ? origSum / judgeCount : 0;
    const emotionAvg = judgeCount > 0 ? emotionSum / judgeCount : 0;
    const structureAvg = judgeCount > 0 ? structSum / judgeCount : 0;

    const firstWithMetadata = entrantScores.find((s) => s.lyrics || s.songTitle || s.alias);
    const sTitleLower = (firstWithMetadata?.songTitle || entrantName).trim().toLowerCase();

    const activeFlags = flags.filter(
      (f) =>
        f.status !== 'cleared' &&
        (f.songTitle.trim().toLowerCase() === sTitleLower ||
          f.songTitle.trim().toLowerCase() === key ||
          (f.entrantName && f.entrantName.trim().toLowerCase() === key))
    );
    const isDisqualified = activeFlags.some((f) => f.status === 'disqualified');

    return {
      entrantName,
      songTitle: firstWithMetadata?.songTitle,
      alias: firstWithMetadata?.alias,
      discordUsername: firstWithMetadata?.discordUsername,
      storyConcept: firstWithMetadata?.storyConcept,
      lyrics: firstWithMetadata?.lyrics,
      judgeCount,
      totalPoints,
      averageScore,
      writingAvg,
      originalityAvg,
      emotionAvg,
      structureAvg,
      highestScore: highestScore === -Infinity ? 0 : highestScore,
      lowestScore: lowestScore === Infinity ? 0 : lowestScore,
      isDisqualified,
      activeFlags,
      judgeBreakdowns,
    };
  });

  // Sort: Disqualified to bottom, then Average Score DESC, then Originality Avg DESC, then Writing Avg DESC
  unrankedList.sort((a, b) => {
    if (a.isDisqualified && !b.isDisqualified) return 1;
    if (!a.isDisqualified && b.isDisqualified) return -1;

    if (Math.abs(b.averageScore - a.averageScore) > 0.001) {
      return b.averageScore - a.averageScore;
    }
    if (Math.abs(b.originalityAvg - a.originalityAvg) > 0.001) {
      return b.originalityAvg - a.originalityAvg;
    }
    if (Math.abs(b.writingAvg - a.writingAvg) > 0.001) {
      return b.writingAvg - a.writingAvg;
    }
    return b.judgeCount - a.judgeCount;
  });

  // Assign ranks
  let validRank = 1;
  return unrankedList.map((item) => {
    if (item.isDisqualified) {
      return {
        ...item,
        rank: 999, // Designated disqualified
      };
    }
    const assigned = {
      ...item,
      rank: validRank,
    };
    validRank++;
    return assigned;
  });
}

export function computeSummaryStats(
  scores: JudgeScoreSubmission[],
  rankings: EntrantRanking[]
): ContestSummaryStats {
  const judgesSet = new Set<string>();
  let totalScoreSum = 0;

  scores.forEach((s) => {
    if (s.judgeName) judgesSet.add(s.judgeName.trim().toLowerCase());
    totalScoreSum += s.totalScore;
  });

  const overallAverage = scores.length > 0 ? totalScoreSum / scores.length : 0;
  const topEntrant = rankings[0];

  return {
    totalEntrants: rankings.length,
    totalJudges: judgesSet.size,
    totalSubmissions: scores.length,
    overallAverage,
    topEntrantName: topEntrant ? topEntrant.entrantName : 'None yet',
    topEntrantScore: topEntrant ? topEntrant.averageScore : 0,
  };
}

