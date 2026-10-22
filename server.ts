import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  initializeFirestore,
  getFirebaseStatus,
  fetchAllSongs,
  upsertSong,
  removeSong,
  fetchAllScores,
  upsertScore,
  removeScore,
  fetchAllFlags,
  upsertFlag,
  removeFlag,
  fetchAllJudges,
  upsertJudge,
  removeJudge,
  fetchSettings,
  saveSettings,
} from './src/serverFirebase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS so remote frontends (e.g., GitHub Pages, Render, or Custom domains) can connect
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Seed default songs for initial contest initialization
const DEFAULT_SONGS = [
  {
    id: 'song-seed-1',
    songTitle: 'Echoes of the Tide',
    alias: 'Marina Blue',
    discordUsername: 'marinablue',
    storyConcept: 'A reflective song about summer memories fading like footsteps on the beach.',
    lyrics: `[Verse 1]\nFootsteps washed away by the evening sea\nYou promised you would still remember me\nGolden skies turning into indigo night\nWe were young, chasing every beam of light\n\n[Chorus]\nEchoes of the tide calling out your name\nEven when the seasons never stay the same\nSalt on my skin, warm wind in my hair\nI close my eyes and you are standing there\n\n[Verse 2]\nCarved our names upon the driftwood pier\nBelieved our dreams would outlast any year\nNow the autumn chill is creeping through the door\nAnd the ocean waves keep crashing on the shore\n\n[Outro]\nEchoes of the tide...\nFading out in blue...\nI still remember you.`,
    formattedEntrantName: 'Echoes of the Tide — Marina Blue (@marinablue)',
    addedAt: '2026-10-22T04:57:22.152Z',
    addedBy: 'Contest Producer',
  },
  {
    id: 'song-seed-2',
    songTitle: 'Starlit Boulevard',
    alias: 'Kai Vance',
    discordUsername: 'kaivance',
    storyConcept: 'Late night cruising under neon signs thinking about second chances.',
    lyrics: `[Verse 1]\nHeadlights cutting through the midnight haze\nLost inside a labyrinth of yesterday\'s days\nRadio playing static and an old slow jam\nWondering if you ever knew the boy I am\n\n[Chorus]\nDown on Starlit Boulevard\nUnderneath the broken sky\nEvery street sign reads your name\nEvery red light asks me why\nWe let the fire burn into spark\nDriving all alone in the dark\n\n[Bridge]\nGas pedal down, nothing left to lose\nJust the city lights and a pair of worn-out shoes\n\n[Chorus]\nDown on Starlit Boulevard\nUnderneath the broken sky\nI\'ll keep driving till sunrise\nTill the memories run dry.`,
    formattedEntrantName: 'Starlit Boulevard — Kai Vance (@kaivance)',
    addedAt: '2026-10-22T04:57:22.152Z',
    addedBy: 'Contest Producer',
  },
  {
    id: 'song-seed-3',
    songTitle: 'Paper Cranes in the Wind',
    alias: 'Sora Tanaka',
    discordUsername: 'soratanaka',
    storyConcept: 'A thousand folded hopes sent into the sky for someone far away.',
    lyrics: `[Verse 1]\nFold the crease along the paper spine\nA silent prayer for you across the border line\nWings of white taking flight upon the breeze\nRustling softly through the cherry blossom trees\n\n[Chorus]\nOne thousand paper cranes dancing in the wind\nCarrying the words we never got to send\nIf they cross the ocean, if they reach your shore\nKnow that my heart is yours forevermore\n\n[Verse 2]\nInk on parchment blurred by falling rain\nA bittersweet reminder that hope outlives the pain\nEvery crane a memory of the days we shared\nEvery gentle fold proof of how much I cared\n\n[Outro]\nPaper cranes in the wind...\nFly home again.`,
    formattedEntrantName: 'Paper Cranes in the Wind — Sora Tanaka (@soratanaka)',
    addedAt: '2026-10-22T04:57:22.152Z',
    addedBy: 'Contest Producer',
  },
];

// Fallback in-memory cache to ensure instant API responsiveness
interface MemoryCache {
  songs: any[];
  scores: any[];
  flags: any[];
  judges: any[];
  settings: {
    portalPin: string;
    adminPin: string;
    portalSessionVersion: number;
    lockedAt?: string | null;
  };
}

const memoryCache: MemoryCache = {
  songs: [...DEFAULT_SONGS],
  scores: [],
  flags: [],
  judges: [],
  settings: { portalPin: '4274', adminPin: '1234', portalSessionVersion: 1, lockedAt: null },
};

/**
 * Bootstrap Firebase Firestore data on server startup:
 * 1. Checks if Firestore is populated.
 * 2. If empty, check for existing contest_data.json to migrate, or seed DEFAULT_SONGS.
 * 3. Cache data in memoryCache for rapid retrieval.
 */
async function syncFromFirestore(): Promise<void> {
  const status = getFirebaseStatus();
  if (!status.connected) {
    console.warn('[Server] Firestore is not connected. Operating in fallback cache mode.');
    return;
  }

  try {
    const [remoteSongs, remoteScores, remoteFlags, remoteJudges, remoteSettings] =
      await Promise.all([
        fetchAllSongs(),
        fetchAllScores(),
        fetchAllFlags(),
        fetchAllJudges(),
        fetchSettings(),
      ]);

    // If Firestore has no songs yet, perform seed or migration from contest_data.json
    if (remoteSongs.length === 0) {
      console.log('[Firebase] Firestore songs collection is empty. Checking for migration or seed...');
      let migrationSongs = DEFAULT_SONGS;

      const localDataFile = path.resolve(process.cwd(), 'data', 'contest_data.json');
      if (fs.existsSync(localDataFile)) {
        try {
          const raw = fs.readFileSync(localDataFile, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.songs) && parsed.songs.length > 0) {
            console.log(`[Firebase] Migrating ${parsed.songs.length} songs from data/contest_data.json to Firestore...`);
            migrationSongs = parsed.songs;
          }
          if (Array.isArray(parsed.scores) && parsed.scores.length > 0) {
            console.log(`[Firebase] Migrating ${parsed.scores.length} scores from data/contest_data.json to Firestore...`);
            for (const sc of parsed.scores) {
              await upsertScore(sc);
            }
          }
        } catch (e) {
          console.warn('[Firebase] Migration parse error:', e);
        }
      }

      for (const s of migrationSongs) {
        await upsertSong(s);
      }
      await saveSettings(remoteSettings);

      memoryCache.songs = migrationSongs;
    } else {
      memoryCache.songs = remoteSongs;
    }

    memoryCache.scores = remoteScores;
    memoryCache.flags = remoteFlags;
    memoryCache.judges = remoteJudges;
    memoryCache.settings = remoteSettings;

    console.log(
      `[Firebase] Synced from Firestore: ${memoryCache.songs.length} songs, ${memoryCache.scores.length} scores, ${memoryCache.flags.length} flags, ${memoryCache.judges.length} judges.`
    );
  } catch (err) {
    console.error('[Firebase] Error syncing from Firestore:', err);
  }
}

// ----------------------------------------------------------------
// REST API Endpoints with Firebase Firestore Backing
// ----------------------------------------------------------------

// 1. Full Sync
app.get('/api/sync', async (req, res) => {
  try {
    // Attempt fresh sync from Firestore if connected
    const status = getFirebaseStatus();
    if (status.connected) {
      const [songs, scores, flags, judges, settings] = await Promise.all([
        fetchAllSongs(),
        fetchAllScores(),
        fetchAllFlags(),
        fetchAllJudges(),
        fetchSettings(),
      ]);
      memoryCache.songs = songs;
      memoryCache.scores = scores;
      memoryCache.flags = flags;
      memoryCache.judges = judges;
      memoryCache.settings = settings;
    }

    res.json({
      success: true,
      songs: memoryCache.songs,
      scores: memoryCache.scores,
      flags: memoryCache.flags,
      judges: memoryCache.judges,
      settings: memoryCache.settings,
      firebase: getFirebaseStatus(),
    });
  } catch (err: any) {
    console.error('[API /api/sync] Error:', err);
    res.json({
      success: true,
      songs: memoryCache.songs,
      scores: memoryCache.scores,
      flags: memoryCache.flags,
      judges: memoryCache.judges,
      settings: memoryCache.settings,
      firebase: getFirebaseStatus(),
      warning: 'Returned from memory cache due to Firestore read exception.',
    });
  }
});

// 2. Songs API
app.get('/api/songs', async (req, res) => {
  try {
    const status = getFirebaseStatus();
    if (status.connected) {
      memoryCache.songs = await fetchAllSongs();
    }
    res.json({ success: true, songs: memoryCache.songs });
  } catch (err: any) {
    res.json({ success: true, songs: memoryCache.songs });
  }
});

app.post('/api/songs', async (req, res) => {
  const newSong = req.body;
  if (!newSong || !newSong.songTitle) {
    return res.status(400).json({ success: false, error: 'Song title is required' });
  }

  const existingIndex = memoryCache.songs.findIndex(
    (s) =>
      s.id === newSong.id ||
      s.songTitle.trim().toLowerCase() === newSong.songTitle.trim().toLowerCase()
  );

  let songToSave: any;
  if (existingIndex >= 0) {
    songToSave = { ...memoryCache.songs[existingIndex], ...newSong };
    memoryCache.songs[existingIndex] = songToSave;
  } else {
    songToSave = {
      ...newSong,
      id: newSong.id || `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      addedAt: newSong.addedAt || new Date().toISOString(),
    };
    memoryCache.songs.unshift(songToSave);
  }

  // Persist to Firestore
  try {
    await upsertSong(songToSave);
  } catch (err) {
    console.error('[Firebase] Failed to upsert song:', err);
  }

  res.json({ success: true, songs: memoryCache.songs });
});

// Delete song and any associated scores
app.delete('/api/songs/:idOrTitle', async (req, res) => {
  const target = decodeURIComponent(req.params.idOrTitle).trim().toLowerCase();

  const matched = memoryCache.songs.find(
    (s) =>
      (s.id && s.id.toLowerCase() === target) ||
      s.songTitle.trim().toLowerCase() === target ||
      (s.formattedEntrantName && s.formattedEntrantName.trim().toLowerCase() === target)
  );

  const targetId = matched?.id || (target.startsWith('song-') ? target : '');
  const targetTitle = (matched?.songTitle || target).toLowerCase();
  const targetFormatted = (matched?.formattedEntrantName || target).toLowerCase();
  const extractedTitle = target.includes(' — ') ? target.split(' — ')[0].trim().toLowerCase() : targetTitle;

  // Filter out of memoryCache
  const removedSongs = memoryCache.songs.filter((s) => {
    const sId = (s.id || '').toLowerCase();
    const sTitle = s.songTitle.trim().toLowerCase();
    const sFormatted = (s.formattedEntrantName || '').trim().toLowerCase();
    if (targetId && sId === targetId.toLowerCase()) return true;
    if (sTitle === targetTitle || sTitle === targetFormatted || sTitle === extractedTitle) return true;
    if (sFormatted === targetTitle || sFormatted === targetFormatted || sFormatted === extractedTitle) return true;
    return false;
  });

  memoryCache.songs = memoryCache.songs.filter((s) => !removedSongs.includes(s));

  // Find associated scores to purge
  const removedScores = memoryCache.scores.filter((sc) => {
    const scTitle = (sc.songTitle || '').trim().toLowerCase();
    const scEntrant = (sc.entrantName || '').trim().toLowerCase();
    if (scTitle && (scTitle === targetTitle || scTitle === targetFormatted || scTitle === extractedTitle)) return true;
    if (scEntrant && (scEntrant === targetTitle || scEntrant === targetFormatted || scEntrant === extractedTitle)) return true;
    return false;
  });

  memoryCache.scores = memoryCache.scores.filter((sc) => !removedScores.includes(sc));

  // Delete from Firestore
  try {
    for (const s of removedSongs) {
      if (s.id) await removeSong(s.id);
    }
    for (const sc of removedScores) {
      if (sc.id) await removeScore(sc.id);
    }
  } catch (err) {
    console.error('[Firebase] Error deleting from Firestore:', err);
  }

  res.json({ success: true, songs: memoryCache.songs, scores: memoryCache.scores });
});

// Rename song
app.put('/api/songs/:idOrTitle', async (req, res) => {
  const target = decodeURIComponent(req.params.idOrTitle).trim().toLowerCase();
  const { newTitle } = req.body;
  if (!newTitle || !newTitle.trim()) {
    return res.status(400).json({ success: false, error: 'New title is required' });
  }

  const extractedTitle = target.includes(' — ') ? target.split(' — ')[0].trim().toLowerCase() : target;
  const updatedSongs: any[] = [];

  memoryCache.songs = memoryCache.songs.map((s) => {
    const sId = (s.id || '').toLowerCase();
    const sTitle = s.songTitle.trim().toLowerCase();
    const sFormatted = (s.formattedEntrantName || '').trim().toLowerCase();

    if (sId === target || sTitle === target || sFormatted === target || sTitle === extractedTitle) {
      const updated = {
        ...s,
        songTitle: newTitle.trim(),
        formattedEntrantName: s.alias
          ? `${newTitle.trim()} — ${s.alias}${s.discordUsername ? ` (@${s.discordUsername})` : ''}`
          : newTitle.trim(),
      };
      updatedSongs.push(updated);
      return updated;
    }
    return s;
  });

  // Also update scores
  const updatedScores: any[] = [];
  memoryCache.scores = memoryCache.scores.map((sc) => {
    const scTitle = (sc.songTitle || '').trim().toLowerCase();
    const scEntrant = (sc.entrantName || '').trim().toLowerCase();
    if (scTitle === target || scEntrant === target || scTitle === extractedTitle || scEntrant === extractedTitle) {
      const updated = {
        ...sc,
        songTitle: newTitle.trim(),
        entrantName: newTitle.trim(),
      };
      updatedScores.push(updated);
      return updated;
    }
    return sc;
  });

  // Persist to Firestore
  try {
    for (const s of updatedSongs) {
      await upsertSong(s);
    }
    for (const sc of updatedScores) {
      await upsertScore(sc);
    }
  } catch (err) {
    console.error('[Firebase] Error updating renamed songs/scores in Firestore:', err);
  }

  res.json({ success: true, songs: memoryCache.songs, scores: memoryCache.scores });
});

// 3. Scores API
app.get('/api/scores', async (req, res) => {
  try {
    const status = getFirebaseStatus();
    if (status.connected) {
      memoryCache.scores = await fetchAllScores();
    }
    res.json({ success: true, scores: memoryCache.scores });
  } catch (err) {
    res.json({ success: true, scores: memoryCache.scores });
  }
});

app.post('/api/scores', async (req, res) => {
  const newScore = req.body;
  if (!newScore || !newScore.judgeName || !newScore.entrantName) {
    return res.status(400).json({ success: false, error: 'Judge and entrant are required' });
  }

  const targetJudge = newScore.judgeName.trim().toLowerCase();
  const targetEntrant = newScore.entrantName.trim().toLowerCase();
  const targetTitle = (newScore.songTitle || newScore.entrantName).trim().toLowerCase();
  const targetExtracted = targetTitle.includes(' — ') ? targetTitle.split(' — ')[0].trim().toLowerCase() : targetTitle;

  // Prevent duplicate submission by the same judge on the same song
  const duplicate = memoryCache.scores.find((s) => {
    if (s.judgeName.trim().toLowerCase() !== targetJudge) return false;
    const sTitle = (s.songTitle || '').trim().toLowerCase();
    const sEntrant = (s.entrantName || '').trim().toLowerCase();
    const sExtracted = sTitle.includes(' — ') ? sTitle.split(' — ')[0].trim().toLowerCase() : sTitle;

    return (
      sTitle === targetTitle ||
      sTitle === targetEntrant ||
      sTitle === targetExtracted ||
      sEntrant === targetTitle ||
      sEntrant === targetEntrant ||
      sEntrant === targetExtracted ||
      sExtracted === targetTitle ||
      sExtracted === targetExtracted
    );
  });

  if (duplicate) {
    return res.status(409).json({
      success: false,
      error: `Judge ${newScore.judgeName} has already submitted a score for this song. Resubmission is not permitted.`,
      existingScore: duplicate,
    });
  }

  const entry = {
    ...newScore,
    id: newScore.id || `score-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: newScore.timestamp || new Date().toISOString(),
  };

  memoryCache.scores.unshift(entry);

  // Persist to Firestore
  try {
    await upsertScore(entry);
  } catch (err) {
    console.error('[Firebase] Failed to persist score to Firestore:', err);
  }

  res.json({ success: true, score: entry, scores: memoryCache.scores });
});

app.delete('/api/scores/:id', async (req, res) => {
  const scoreId = req.params.id;
  memoryCache.scores = memoryCache.scores.filter((s, idx) => (s.id || `idx-${idx}`) !== scoreId);

  try {
    await removeScore(scoreId);
  } catch (err) {
    console.error('[Firebase] Failed to delete score from Firestore:', err);
  }

  res.json({ success: true, scores: memoryCache.scores });
});

// 4. Settings API (Portal PIN and Admin PIN)
app.get('/api/settings', async (req, res) => {
  try {
    const status = getFirebaseStatus();
    if (status.connected) {
      memoryCache.settings = await fetchSettings();
    }
    res.json({ success: true, settings: memoryCache.settings });
  } catch (err) {
    res.json({ success: true, settings: memoryCache.settings });
  }
});

app.post('/api/settings', async (req, res) => {
  const { portalPin, adminPin } = req.body;
  const updates: any = {};
  if (portalPin && typeof portalPin === 'string' && portalPin.trim().length >= 4) {
    updates.portalPin = portalPin.trim();
    memoryCache.settings.portalPin = updates.portalPin;
  }
  if (adminPin && typeof adminPin === 'string' && adminPin.trim().length >= 4) {
    updates.adminPin = adminPin.trim();
    memoryCache.settings.adminPin = updates.adminPin;
  }

  try {
    const updated = await saveSettings(updates);
    memoryCache.settings = updated;
  } catch (err) {
    console.error('[Firebase] Error saving settings to Firestore:', err);
  }

  res.json({ success: true, settings: memoryCache.settings });
});

// Remote Portal Lock Endpoint (Invalidates all judge sessions)
app.post('/api/settings/lock-portal', async (req, res) => {
  const currentVersion =
    typeof memoryCache.settings.portalSessionVersion === 'number'
      ? memoryCache.settings.portalSessionVersion
      : 1;

  const nextVersion = currentVersion + 1;
  const lockedAt = new Date().toISOString();

  memoryCache.settings.portalSessionVersion = nextVersion;
  memoryCache.settings.lockedAt = lockedAt;

  try {
    await saveSettings({
      portalSessionVersion: nextVersion,
      lockedAt,
    });
  } catch (err) {
    console.error('[Firebase] Failed to save remote lock state to Firestore:', err);
  }

  res.json({
    success: true,
    settings: memoryCache.settings,
    message: 'Portal locked. All active and new judge sessions will require PIN re-entry.',
  });
});

// 5. Registered Judges API (Monitoring Board)
app.get('/api/judges', async (req, res) => {
  try {
    const status = getFirebaseStatus();
    if (status.connected) {
      memoryCache.judges = await fetchAllJudges();
    }
    res.json({ success: true, judges: memoryCache.judges });
  } catch (err) {
    res.json({ success: true, judges: memoryCache.judges });
  }
});

app.post('/api/judges', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Judge name is required' });
  }

  const cleanName = name.trim();
  const existingIdx = memoryCache.judges.findIndex(
    (j) => j.name.trim().toLowerCase() === cleanName.toLowerCase()
  );

  const now = new Date().toISOString();
  let judgeEntry: any;
  if (existingIdx >= 0) {
    judgeEntry = {
      ...memoryCache.judges[existingIdx],
      name: cleanName,
      lastActiveAt: now,
    };
    memoryCache.judges[existingIdx] = judgeEntry;
  } else {
    judgeEntry = {
      id: `judge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      registeredAt: now,
      lastActiveAt: now,
    };
    memoryCache.judges.push(judgeEntry);
  }

  try {
    await upsertJudge(judgeEntry);
  } catch (err) {
    console.error('[Firebase] Error saving judge to Firestore:', err);
  }

  res.json({ success: true, judges: memoryCache.judges });
});

app.delete('/api/judges/:name', async (req, res) => {
  const target = decodeURIComponent(req.params.name).trim().toLowerCase();
  const removed = memoryCache.judges.find(
    (j) => (j.id && j.id.toLowerCase() === target) || j.name.trim().toLowerCase() === target
  );

  memoryCache.judges = memoryCache.judges.filter(
    (j) => (j.id && j.id.toLowerCase() === target) || j.name.trim().toLowerCase() !== target
  );

  if (removed?.id) {
    try {
      await removeJudge(removed.id);
    } catch (err) {
      console.error('[Firebase] Error removing judge from Firestore:', err);
    }
  }

  res.json({ success: true, judges: memoryCache.judges });
});

// 6. Flags & Rule Violations API
app.get('/api/flags', async (req, res) => {
  try {
    const status = getFirebaseStatus();
    if (status.connected) {
      memoryCache.flags = await fetchAllFlags();
    }
    res.json({ success: true, flags: memoryCache.flags });
  } catch (err) {
    res.json({ success: true, flags: memoryCache.flags });
  }
});

app.post('/api/flags', async (req, res) => {
  const flag = req.body;
  if (!flag || !flag.songTitle || !flag.reason) {
    return res.status(400).json({ success: false, error: 'Song title and reason are required' });
  }

  const newFlag = {
    id: flag.id || `flag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    songId: flag.songId || '',
    songTitle: flag.songTitle.trim(),
    entrantName: (flag.entrantName || flag.songTitle).trim(),
    flaggedBy: (flag.flaggedBy || 'Judge').trim(),
    reason: flag.reason,
    reasonLabel: flag.reasonLabel || flag.reason,
    notes: (flag.notes || '').trim(),
    flaggedAt: flag.flaggedAt || new Date().toISOString(),
    status: flag.status || 'pending_review',
  };

  memoryCache.flags.unshift(newFlag);

  // Update associated song in memory & Firestore
  const targetTitle = newFlag.songTitle.toLowerCase();
  let affectedSong: any = null;
  memoryCache.songs = memoryCache.songs.map((s) => {
    const sTitle = s.songTitle.trim().toLowerCase();
    const sFormatted = (s.formattedEntrantName || '').trim().toLowerCase();
    if (sTitle === targetTitle || sFormatted === targetTitle || sFormatted.startsWith(targetTitle)) {
      const existingSongFlags = Array.isArray(s.flags) ? s.flags : [];
      const updated = {
        ...s,
        flags: [newFlag, ...existingSongFlags.filter((f: any) => f.id !== newFlag.id)],
      };
      affectedSong = updated;
      return updated;
    }
    return s;
  });

  try {
    await upsertFlag(newFlag);
    if (affectedSong) {
      await upsertSong(affectedSong);
    }
  } catch (err) {
    console.error('[Firebase] Failed to write flag to Firestore:', err);
  }

  res.json({ success: true, flag: newFlag, flags: memoryCache.flags, songs: memoryCache.songs });
});

app.put('/api/flags/:id', async (req, res) => {
  const flagId = req.params.id;
  const { status, reviewedBy } = req.body;

  let updatedFlag: any = null;
  const now = new Date().toISOString();

  memoryCache.flags = memoryCache.flags.map((f) => {
    if (f.id === flagId) {
      updatedFlag = {
        ...f,
        status: status || f.status,
        reviewedBy: reviewedBy || 'Admin',
        reviewedAt: now,
      };
      return updatedFlag;
    }
    return f;
  });

  let affectedSong: any = null;
  if (updatedFlag) {
    const targetTitle = (updatedFlag.songTitle || '').trim().toLowerCase();
    memoryCache.songs = memoryCache.songs.map((s) => {
      const sTitle = s.songTitle.trim().toLowerCase();
      const sFormatted = (s.formattedEntrantName || '').trim().toLowerCase();
      if (sTitle === targetTitle || sFormatted === targetTitle || sFormatted.startsWith(targetTitle)) {
        const isDisq = status === 'disqualified';
        const currentFlags = (s.flags || []).map((f: any) => (f.id === flagId ? updatedFlag : f));
        const updated = {
          ...s,
          isDisqualified: isDisq,
          flags: currentFlags,
        };
        affectedSong = updated;
        return updated;
      }
      return s;
    });
  }

  try {
    if (updatedFlag) await upsertFlag(updatedFlag);
    if (affectedSong) await upsertSong(affectedSong);
  } catch (err) {
    console.error('[Firebase] Error updating flag in Firestore:', err);
  }

  res.json({ success: true, flag: updatedFlag, flags: memoryCache.flags, songs: memoryCache.songs });
});

app.delete('/api/flags/:id', async (req, res) => {
  const flagId = req.params.id;
  const removed = memoryCache.flags.find((f) => f.id === flagId);
  memoryCache.flags = memoryCache.flags.filter((f) => f.id !== flagId);

  let affectedSong: any = null;
  if (removed) {
    const targetTitle = (removed.songTitle || '').trim().toLowerCase();
    memoryCache.songs = memoryCache.songs.map((s) => {
      const sTitle = s.songTitle.trim().toLowerCase();
      const sFormatted = (s.formattedEntrantName || '').trim().toLowerCase();
      if (sTitle === targetTitle || sFormatted === targetTitle || sFormatted.startsWith(targetTitle)) {
        const remainingFlags = (s.flags || []).filter((f: any) => f.id !== flagId);
        const updated = {
          ...s,
          flags: remainingFlags,
          isDisqualified: remainingFlags.some((f: any) => f.status === 'disqualified'),
        };
        affectedSong = updated;
        return updated;
      }
      return s;
    });
  }

  try {
    await removeFlag(flagId);
    if (affectedSong) await upsertSong(affectedSong);
  } catch (err) {
    console.error('[Firebase] Error removing flag from Firestore:', err);
  }

  res.json({ success: true, flags: memoryCache.flags, songs: memoryCache.songs });
});

// 7. Firebase Cloud & Render Status API
app.get('/api/firebase/status', (req, res) => {
  res.json({
    success: true,
    status: getFirebaseStatus(),
    instructions: {
      renderSetup: 'Add FIREBASE_PROJECT_ID, FIREBASE_API_KEY, and other variables in your Render Web Service Environment settings.',
      diskFreeCost: 'Firestore database handles 100% of persistent storage, eliminating the need for paid persistent disk storage on Render.',
    },
  });
});

// Health check endpoints for Render and uptime monitoring
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    firebase: getFirebaseStatus(),
  });
});

// Vite middleware integration for Full-Stack setup
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    !!process.env.RENDER ||
    !!process.env.RAILWAY_ENVIRONMENT ||
    (hasDist && process.env.NODE_ENV !== 'development');

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Bind to port immediately so Render health checks pass without delay
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`[Server] Summertide Lyric Contest Server listening on port ${PORT} (0.0.0.0)`);
    console.log(`[Server] Mode: ${isProduction ? 'Production' : 'Development'}`);

    // Asynchronously connect to Firebase Firestore so server boot never hangs
    try {
      console.log('[Server] Connecting to Firebase Firestore...');
      await initializeFirestore();
      await syncFromFirestore();
      const fb = getFirebaseStatus();
      console.log(`[Storage] Database Engine: ${fb.connected ? '🔥 Firebase Firestore (Cloud)' : '⚠️ In-Memory Fallback'}`);
    } catch (fbErr: any) {
      console.error('[Firebase] Startup connection warning (continuing with memory cache):', fbErr?.message || fbErr);
    }
  });
}

startServer();
