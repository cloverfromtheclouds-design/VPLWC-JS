import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS so remote frontends (e.g., GitHub Pages) can connect to this server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'contest_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial contest data structure
interface StorageData {
  songs: any[];
  scores: any[];
  flags: any[];
  judges: any[];
  settings: {
    portalPin: string;
    adminPin: string;
    portalSessionVersion?: number;
    lockedAt?: string | null;
  };
}

// Seed default songs if data file does not exist or is empty
const DEFAULT_SONGS = [
  {
    id: 'song-seed-1',
    songTitle: 'Echoes of the Tide',
    alias: 'Marina Blue',
    discordUsername: 'marinablue',
    storyConcept: 'A reflective song about summer memories fading like footsteps on the beach.',
    lyrics: `[Verse 1]\nFootsteps washed away by the evening sea\nYou promised you would still remember me\nGolden skies turning into indigo night\nWe were young, chasing every beam of light\n\n[Chorus]\nEchoes of the tide calling out your name\nEven when the seasons never stay the same\nSalt on my skin, warm wind in my hair\nI close my eyes and you are standing there\n\n[Verse 2]\nCarved our names upon the driftwood pier\nBelieved our dreams would outlast any year\nNow the autumn chill is creeping through the door\nAnd the ocean waves keep crashing on the shore\n\n[Outro]\nEchoes of the tide...\nFading out in blue...\nI still remember you.`,
    formattedEntrantName: 'Echoes of the Tide — Marina Blue (@marinablue)',
    addedAt: new Date().toISOString(),
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
    addedAt: new Date().toISOString(),
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
    addedAt: new Date().toISOString(),
    addedBy: 'Contest Producer',
  },
];

function loadData(): StorageData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.songs) && Array.isArray(parsed.scores)) {
        if (!Array.isArray(parsed.flags)) parsed.flags = [];
        if (!Array.isArray(parsed.judges)) parsed.judges = [];
        if (!parsed.settings || typeof parsed.settings !== 'object') {
          parsed.settings = { portalPin: '4274', adminPin: '1234', portalSessionVersion: 1, lockedAt: null };
        } else {
          if (!parsed.settings.portalPin) parsed.settings.portalPin = '4274';
          if (!parsed.settings.adminPin) parsed.settings.adminPin = '1234';
          if (typeof parsed.settings.portalSessionVersion !== 'number') {
            parsed.settings.portalSessionVersion = 1;
          }
        }
        return parsed as StorageData;
      }
    }
  } catch (err) {
    console.error('Error reading storage file, initializing defaults:', err);
  }
  const initial: StorageData = {
    songs: DEFAULT_SONGS,
    scores: [],
    flags: [],
    judges: [],
    settings: { portalPin: '4274', adminPin: '1234', portalSessionVersion: 1, lockedAt: null },
  };
  saveData(initial);
  return initial;
}

function saveData(data: StorageData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing storage file:', err);
  }
}

// REST API Endpoints for Real-Time Online Producer & Judge Sync

// 1. Full Sync
app.get('/api/sync', (req, res) => {
  const data = loadData();
  res.json({
    success: true,
    songs: data.songs || [],
    scores: data.scores || [],
    flags: data.flags || [],
    judges: data.judges || [],
    settings: data.settings || { portalPin: '4274', adminPin: '1234' },
  });
});

// 2. Songs API
app.get('/api/songs', (req, res) => {
  const data = loadData();
  res.json({ success: true, songs: data.songs || [] });
});

app.post('/api/songs', (req, res) => {
  const newSong = req.body;
  if (!newSong || !newSong.songTitle) {
    return res.status(400).json({ success: false, error: 'Song title is required' });
  }

  const data = loadData();
  // Check if identical title exists
  const existingIndex = data.songs.findIndex(
    (s) =>
      s.id === newSong.id ||
      s.songTitle.trim().toLowerCase() === newSong.songTitle.trim().toLowerCase()
  );

  if (existingIndex >= 0) {
    data.songs[existingIndex] = { ...data.songs[existingIndex], ...newSong };
  } else {
    data.songs.unshift({
      ...newSong,
      id: newSong.id || `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      addedAt: newSong.addedAt || new Date().toISOString(),
    });
  }

  saveData(data);
  res.json({ success: true, songs: data.songs });
});

// Delete song and any associated scores
app.delete('/api/songs/:idOrTitle', (req, res) => {
  const target = decodeURIComponent(req.params.idOrTitle).trim().toLowerCase();
  const data = loadData();

  // Find matching song to get its variations
  const matched = data.songs.find(
    (s) =>
      (s.id && s.id.toLowerCase() === target) ||
      s.songTitle.trim().toLowerCase() === target ||
      (s.formattedEntrantName && s.formattedEntrantName.trim().toLowerCase() === target)
  );

  const targetId = matched?.id?.toLowerCase() || (target.startsWith('song-') ? target : '');
  const targetTitle = (matched?.songTitle || target).toLowerCase();
  const targetFormatted = (matched?.formattedEntrantName || target).toLowerCase();
  const extractedTitle = target.includes(' — ') ? target.split(' — ')[0].trim().toLowerCase() : targetTitle;

  // Purge song
  data.songs = data.songs.filter((s) => {
    const sId = (s.id || '').toLowerCase();
    const sTitle = s.songTitle.trim().toLowerCase();
    const sFormatted = (s.formattedEntrantName || '').trim().toLowerCase();

    if (targetId && sId === targetId) return false;
    if (sTitle === targetTitle || sTitle === targetFormatted || sTitle === extractedTitle) return false;
    if (sFormatted === targetTitle || sFormatted === targetFormatted || sFormatted === extractedTitle) return false;
    return true;
  });

  // Purge any scores linked to this song
  data.scores = data.scores.filter((sc) => {
    const scTitle = (sc.songTitle || '').trim().toLowerCase();
    const scEntrant = (sc.entrantName || '').trim().toLowerCase();

    if (scTitle && (scTitle === targetTitle || scTitle === targetFormatted || scTitle === extractedTitle)) return false;
    if (scEntrant && (scEntrant === targetTitle || scEntrant === targetFormatted || scEntrant === extractedTitle)) return false;
    return true;
  });

  saveData(data);
  res.json({ success: true, songs: data.songs, scores: data.scores });
});

// Rename song
app.put('/api/songs/:idOrTitle', (req, res) => {
  const target = decodeURIComponent(req.params.idOrTitle).trim().toLowerCase();
  const { newTitle } = req.body;
  if (!newTitle || !newTitle.trim()) {
    return res.status(400).json({ success: false, error: 'New title is required' });
  }

  const data = loadData();
  const extractedTitle = target.includes(' — ') ? target.split(' — ')[0].trim().toLowerCase() : target;

  data.songs = data.songs.map((s) => {
    const sId = (s.id || '').toLowerCase();
    const sTitle = s.songTitle.trim().toLowerCase();
    const sFormatted = (s.formattedEntrantName || '').trim().toLowerCase();

    if (sId === target || sTitle === target || sFormatted === target || sTitle === extractedTitle) {
      return {
        ...s,
        songTitle: newTitle.trim(),
        formattedEntrantName: s.alias
          ? `${newTitle.trim()} — ${s.alias}${s.discordUsername ? ` (@${s.discordUsername})` : ''}`
          : newTitle.trim(),
      };
    }
    return s;
  });

  // Also update scores
  data.scores = data.scores.map((sc) => {
    const scTitle = (sc.songTitle || '').trim().toLowerCase();
    const scEntrant = (sc.entrantName || '').trim().toLowerCase();
    if (scTitle === target || scEntrant === target || scTitle === extractedTitle || scEntrant === extractedTitle) {
      return {
        ...sc,
        songTitle: newTitle.trim(),
        entrantName: newTitle.trim(),
      };
    }
    return sc;
  });

  saveData(data);
  res.json({ success: true, songs: data.songs, scores: data.scores });
});

// 3. Scores API
app.get('/api/scores', (req, res) => {
  const data = loadData();
  res.json({ success: true, scores: data.scores || [] });
});

app.post('/api/scores', (req, res) => {
  const newScore = req.body;
  if (!newScore || !newScore.judgeName || !newScore.entrantName) {
    return res.status(400).json({ success: false, error: 'Judge and entrant are required' });
  }

  const data = loadData();
  const targetJudge = newScore.judgeName.trim().toLowerCase();
  const targetEntrant = newScore.entrantName.trim().toLowerCase();
  const targetTitle = (newScore.songTitle || newScore.entrantName).trim().toLowerCase();
  const targetExtracted = targetTitle.includes(' — ') ? targetTitle.split(' — ')[0].trim().toLowerCase() : targetTitle;

  // Prevent duplicate submission by the same judge on the same song
  const duplicate = data.scores.find((s) => {
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

  data.scores.unshift(entry);
  saveData(data);
  res.json({ success: true, score: entry, scores: data.scores });
});

app.delete('/api/scores/:id', (req, res) => {
  const scoreId = req.params.id;
  const data = loadData();
  data.scores = data.scores.filter((s, idx) => (s.id || `idx-${idx}`) !== scoreId);
  saveData(data);
  res.json({ success: true, scores: data.scores });
});

// 4. Settings API (Portal PIN and Admin PIN)
app.get('/api/settings', (req, res) => {
  const data = loadData();
  res.json({ success: true, settings: data.settings });
});

app.post('/api/settings', (req, res) => {
  const { portalPin, adminPin } = req.body;
  const data = loadData();
  if (portalPin && typeof portalPin === 'string' && portalPin.trim().length >= 4) {
    data.settings.portalPin = portalPin.trim();
  }
  if (adminPin && typeof adminPin === 'string' && adminPin.trim().length >= 4) {
    data.settings.adminPin = adminPin.trim();
  }
  saveData(data);
  res.json({ success: true, settings: data.settings });
});

// Remote Portal Lock Endpoint (Invalidates all judge sessions)
app.post('/api/settings/lock-portal', (req, res) => {
  const data = loadData();
  const currentVersion = typeof data.settings.portalSessionVersion === 'number' ? data.settings.portalSessionVersion : 1;
  data.settings.portalSessionVersion = currentVersion + 1;
  data.settings.lockedAt = new Date().toISOString();
  saveData(data);
  res.json({
    success: true,
    settings: data.settings,
    message: 'Portal locked. All active and new judge sessions will require PIN re-entry.',
  });
});

// 5. Registered Judges API (Monitoring Board)
app.get('/api/judges', (req, res) => {
  const data = loadData();
  res.json({ success: true, judges: data.judges || [] });
});

app.post('/api/judges', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Judge name is required' });
  }

  const cleanName = name.trim();
  const data = loadData();
  if (!Array.isArray(data.judges)) data.judges = [];

  const existingIdx = data.judges.findIndex(
    (j) => j.name.trim().toLowerCase() === cleanName.toLowerCase()
  );

  const now = new Date().toISOString();
  if (existingIdx >= 0) {
    data.judges[existingIdx] = {
      ...data.judges[existingIdx],
      name: cleanName,
      lastActiveAt: now,
    };
  } else {
    data.judges.push({
      id: `judge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      registeredAt: now,
      lastActiveAt: now,
    });
  }

  saveData(data);
  res.json({ success: true, judges: data.judges });
});

app.delete('/api/judges/:name', (req, res) => {
  const target = decodeURIComponent(req.params.name).trim().toLowerCase();
  const data = loadData();
  if (!Array.isArray(data.judges)) data.judges = [];

  data.judges = data.judges.filter(
    (j) => (j.id && j.id.toLowerCase() === target) || j.name.trim().toLowerCase() !== target
  );
  saveData(data);
  res.json({ success: true, judges: data.judges });
});

// 6. Flags & Rule Violations API
app.get('/api/flags', (req, res) => {
  const data = loadData();
  res.json({ success: true, flags: data.flags || [] });
});

app.post('/api/flags', (req, res) => {
  const flag = req.body;
  if (!flag || !flag.songTitle || !flag.reason) {
    return res.status(400).json({ success: false, error: 'Song title and reason are required' });
  }

  const data = loadData();
  if (!Array.isArray(data.flags)) data.flags = [];

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

  // Add flag
  data.flags.unshift(newFlag);

  // Also tag the song in data.songs if present
  const targetTitle = newFlag.songTitle.toLowerCase();
  data.songs = data.songs.map((s) => {
    const sTitle = s.songTitle.trim().toLowerCase();
    const sFormatted = (s.formattedEntrantName || '').trim().toLowerCase();
    if (sTitle === targetTitle || sFormatted === targetTitle || sFormatted.startsWith(targetTitle)) {
      const existingSongFlags = Array.isArray(s.flags) ? s.flags : [];
      return {
        ...s,
        flags: [newFlag, ...existingSongFlags.filter((f: any) => f.id !== newFlag.id)],
      };
    }
    return s;
  });

  saveData(data);
  res.json({ success: true, flag: newFlag, flags: data.flags, songs: data.songs });
});

app.put('/api/flags/:id', (req, res) => {
  const flagId = req.params.id;
  const { status, reviewedBy } = req.body;
  const data = loadData();
  if (!Array.isArray(data.flags)) data.flags = [];

  let updatedFlag: any = null;
  const now = new Date().toISOString();

  data.flags = data.flags.map((f) => {
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

  // If status is 'disqualified' or 'cleared', update song in data.songs
  if (updatedFlag) {
    const targetTitle = (updatedFlag.songTitle || '').trim().toLowerCase();
    data.songs = data.songs.map((s) => {
      const sTitle = s.songTitle.trim().toLowerCase();
      const sFormatted = (s.formattedEntrantName || '').trim().toLowerCase();
      if (sTitle === targetTitle || sFormatted === targetTitle || sFormatted.startsWith(targetTitle)) {
        const isDisq = status === 'disqualified';
        const currentFlags = (s.flags || []).map((f: any) => (f.id === flagId ? updatedFlag : f));
        return {
          ...s,
          isDisqualified: isDisq,
          flags: currentFlags,
        };
      }
      return s;
    });
  }

  saveData(data);
  res.json({ success: true, flag: updatedFlag, flags: data.flags, songs: data.songs });
});

app.delete('/api/flags/:id', (req, res) => {
  const flagId = req.params.id;
  const data = loadData();
  if (!Array.isArray(data.flags)) data.flags = [];

  const removed = data.flags.find((f) => f.id === flagId);
  data.flags = data.flags.filter((f) => f.id !== flagId);

  // If a song was flagged, clear this flag from song
  if (removed) {
    const targetTitle = (removed.songTitle || '').trim().toLowerCase();
    data.songs = data.songs.map((s) => {
      const sTitle = s.songTitle.trim().toLowerCase();
      const sFormatted = (s.formattedEntrantName || '').trim().toLowerCase();
      if (sTitle === targetTitle || sFormatted === targetTitle || sFormatted.startsWith(targetTitle)) {
        const remainingFlags = (s.flags || []).filter((f: any) => f.id !== flagId);
        return {
          ...s,
          flags: remainingFlags,
          isDisqualified: remainingFlags.some((f: any) => f.status === 'disqualified'),
        };
      }
      return s;
    });
  }

  saveData(data);
  res.json({ success: true, flags: data.flags, songs: data.songs });
});

// Vite middleware integration for Full-Stack setup
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER || !!process.env.RAILWAY_ENVIRONMENT || (hasDist && process.env.NODE_ENV !== 'development');

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Summertide Lyric Contest Server listening on port ${PORT}`);
  });
}

startServer();
