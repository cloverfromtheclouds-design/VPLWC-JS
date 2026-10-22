import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export interface ContestSettings {
  portalPin: string;
  adminPin: string;
  portalSessionVersion: number;
  lockedAt?: string | null;
}

/**
 * Resolves Firebase configuration:
 * 1. Checks local provisioned firebase-applet-config.json first (source of truth for provisioned applet).
 * 2. Checks single FIREBASE_CONFIG JSON environment variable.
 * 3. Checks individual environment variables (for Render deployment when files are not committed).
 */
export function getFirebaseConfig(): { config: FirebaseConfig | null; source: string } {
  // 1. Check local provisioned firebase-applet-config.json (Highest priority in local/preview)
  const configLocations = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(__dirname, '..', 'firebase-applet-config.json'),
  ];

  for (const loc of configLocations) {
    try {
      if (fs.existsSync(loc)) {
        const fileContent = fs.readFileSync(loc, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.projectId && parsed.apiKey && parsed.projectId !== 'remixed-project-id') {
          return { config: parsed, source: `file: ${loc}` };
        }
      }
    } catch (e) {
      console.warn(`[Firebase] Could not read ${loc}:`, e);
    }
  }

  // 2. Check for single JSON environment variable (Useful for Render dashboard single-string paste)
  if (process.env.FIREBASE_CONFIG) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_CONFIG);
      if (parsed.projectId && parsed.apiKey) {
        return { config: parsed, source: 'process.env.FIREBASE_CONFIG' };
      }
    } catch (e) {
      console.warn('[Firebase] Warning: Failed to parse FIREBASE_CONFIG env var as JSON:', e);
    }
  }

  // 3. Check for individual environment variables (Render Dashboard Environment Variables)
  const envProjectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.PROJECT_ID;

  const envApiKey =
    process.env.FIREBASE_API_KEY ||
    process.env.VITE_FIREBASE_API_KEY ||
    process.env.API_KEY;

  // Ignore default container project placeholder if it has not been configured
  if (envProjectId && envApiKey && envProjectId !== 'smtstdvplwc') {
    const config: FirebaseConfig = {
      projectId: envProjectId,
      apiKey: envApiKey,
      authDomain:
        process.env.FIREBASE_AUTH_DOMAIN ||
        process.env.VITE_FIREBASE_AUTH_DOMAIN ||
        `${envProjectId}.firebaseapp.com`,
      firestoreDatabaseId:
        process.env.FIREBASE_FIRESTORE_DATABASE_ID ||
        process.env.VITE_FIREBASE_DATABASE_ID ||
        process.env.FIRESTORE_DATABASE_ID,
      storageBucket:
        process.env.FIREBASE_STORAGE_BUCKET ||
        process.env.VITE_FIREBASE_STORAGE_BUCKET ||
        `${envProjectId}.firebasestorage.app`,
      messagingSenderId:
        process.env.FIREBASE_MESSAGING_SENDER_ID ||
        process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:
        process.env.FIREBASE_APP_ID ||
        process.env.VITE_FIREBASE_APP_ID,
    };
    return { config, source: 'process.env (individual variables)' };
  }

  return { config: null, source: 'none' };
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let isConnected = false;
let connectionError: string | null = null;
let activeConfig: FirebaseConfig | null = null;
let activeSource = 'none';

export async function initializeFirestore(): Promise<{
  success: boolean;
  db: Firestore | null;
  error?: string;
  config?: FirebaseConfig | null;
  source: string;
}> {
  const { config, source } = getFirebaseConfig();
  activeConfig = config;
  activeSource = source;

  if (!config) {
    const msg =
      'No Firebase credentials found. Please set FIREBASE_PROJECT_ID and FIREBASE_API_KEY environment variables on Render, or provide firebase-applet-config.json.';
    console.warn(`[Firebase] ${msg}`);
    connectionError = msg;
    isConnected = false;
    return { success: false, db: null, error: msg, source };
  }

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });
    } else {
      firebaseApp = getApp();
    }

    if (
      config.firestoreDatabaseId &&
      config.firestoreDatabaseId.trim() !== '' &&
      config.firestoreDatabaseId !== '(default)'
    ) {
      firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId.trim());
    } else {
      firestoreDb = getFirestore(firebaseApp);
    }

    // Verify read connection with a lightweight fetch
    const testDoc = await getDoc(doc(firestoreDb, 'settings', 'contest_settings'));
    isConnected = true;
    connectionError = null;
    console.log(
      `[Firebase] Successfully connected to Firestore (Project: ${config.projectId}, Database: ${
        config.firestoreDatabaseId || '(default)'
      }, Source: ${source})`
    );
    return { success: true, db: firestoreDb, config, source };
  } catch (err: any) {
    console.error('[Firebase] Failed to connect to Firestore:', err?.message || err);
    connectionError = err?.message || String(err);
    isConnected = false;
    return {
      success: false,
      db: firestoreDb, // Keep initialized ref in case transient
      error: connectionError || undefined,
      config,
      source,
    };
  }
}

export function getDb(): Firestore | null {
  return firestoreDb;
}

export function getFirebaseStatus() {
  return {
    connected: isConnected,
    error: connectionError,
    source: activeSource,
    projectId: activeConfig?.projectId || null,
    databaseId: activeConfig?.firestoreDatabaseId || '(default)',
    hasApiKey: !!activeConfig?.apiKey,
  };
}

// -------------------------------------------------------------
// FIRESTORE CRUD OPERATIONS FOR CONTEST DATA
// -------------------------------------------------------------

// 1. Songs
export async function fetchAllSongs(): Promise<any[]> {
  if (!firestoreDb) return [];
  try {
    const snapshot = await getDocs(collection(firestoreDb, 'songs'));
    const songs: any[] = [];
    snapshot.forEach((docSnap) => {
      songs.push(docSnap.data());
    });
    // Sort descending by addedAt
    songs.sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
    return songs;
  } catch (err) {
    console.error('[Firebase] Error fetching songs:', err);
    throw err;
  }
}

export async function upsertSong(song: any): Promise<void> {
  if (!firestoreDb) throw new Error('Firestore not initialized');
  const songDocRef = doc(firestoreDb, 'songs', song.id);
  await setDoc(songDocRef, song, { merge: true });
}

export async function removeSong(songId: string): Promise<void> {
  if (!firestoreDb) throw new Error('Firestore not initialized');
  await deleteDoc(doc(firestoreDb, 'songs', songId));
}

// 2. Scores
export async function fetchAllScores(): Promise<any[]> {
  if (!firestoreDb) return [];
  try {
    const snapshot = await getDocs(collection(firestoreDb, 'scores'));
    const scores: any[] = [];
    snapshot.forEach((docSnap) => {
      scores.push(docSnap.data());
    });
    scores.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    return scores;
  } catch (err) {
    console.error('[Firebase] Error fetching scores:', err);
    throw err;
  }
}

export async function upsertScore(score: any): Promise<void> {
  if (!firestoreDb) throw new Error('Firestore not initialized');
  const scoreDocRef = doc(firestoreDb, 'scores', score.id);
  await setDoc(scoreDocRef, score, { merge: true });
}

export async function removeScore(scoreId: string): Promise<void> {
  if (!firestoreDb) throw new Error('Firestore not initialized');
  await deleteDoc(doc(firestoreDb, 'scores', scoreId));
}

// 3. Flags
export async function fetchAllFlags(): Promise<any[]> {
  if (!firestoreDb) return [];
  try {
    const snapshot = await getDocs(collection(firestoreDb, 'flags'));
    const flags: any[] = [];
    snapshot.forEach((docSnap) => {
      flags.push(docSnap.data());
    });
    flags.sort((a, b) => new Date(b.flaggedAt || 0).getTime() - new Date(a.flaggedAt || 0).getTime());
    return flags;
  } catch (err) {
    console.error('[Firebase] Error fetching flags:', err);
    throw err;
  }
}

export async function upsertFlag(flag: any): Promise<void> {
  if (!firestoreDb) throw new Error('Firestore not initialized');
  const flagDocRef = doc(firestoreDb, 'flags', flag.id);
  await setDoc(flagDocRef, flag, { merge: true });
}

export async function removeFlag(flagId: string): Promise<void> {
  if (!firestoreDb) throw new Error('Firestore not initialized');
  await deleteDoc(doc(firestoreDb, 'flags', flagId));
}

// 4. Judges
export async function fetchAllJudges(): Promise<any[]> {
  if (!firestoreDb) return [];
  try {
    const snapshot = await getDocs(collection(firestoreDb, 'judges'));
    const judges: any[] = [];
    snapshot.forEach((docSnap) => {
      judges.push(docSnap.data());
    });
    judges.sort(
      (a, b) => new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime()
    );
    return judges;
  } catch (err) {
    console.error('[Firebase] Error fetching judges:', err);
    throw err;
  }
}

export async function upsertJudge(judge: any): Promise<void> {
  if (!firestoreDb) throw new Error('Firestore not initialized');
  const judgeDocRef = doc(firestoreDb, 'judges', judge.id);
  await setDoc(judgeDocRef, judge, { merge: true });
}

export async function removeJudge(judgeId: string): Promise<void> {
  if (!firestoreDb) throw new Error('Firestore not initialized');
  await deleteDoc(doc(firestoreDb, 'judges', judgeId));
}

// 5. Settings
export async function fetchSettings(): Promise<ContestSettings> {
  const defaults: ContestSettings = {
    portalPin: '4274',
    adminPin: '1234',
    portalSessionVersion: 1,
    lockedAt: null,
  };
  if (!firestoreDb) return defaults;
  try {
    const snap = await getDoc(doc(firestoreDb, 'settings', 'contest_settings'));
    if (snap.exists()) {
      const data = snap.data();
      return {
        portalPin: data.portalPin || '4274',
        adminPin: data.adminPin || '1234',
        portalSessionVersion:
          typeof data.portalSessionVersion === 'number' ? data.portalSessionVersion : 1,
        lockedAt: data.lockedAt || null,
      };
    }
  } catch (err) {
    console.error('[Firebase] Error fetching settings:', err);
  }
  return defaults;
}

export async function saveSettings(settings: Partial<ContestSettings>): Promise<ContestSettings> {
  const current = await fetchSettings();
  const updated: ContestSettings = {
    portalPin: settings.portalPin || current.portalPin,
    adminPin: settings.adminPin || current.adminPin,
    portalSessionVersion:
      typeof settings.portalSessionVersion === 'number'
        ? settings.portalSessionVersion
        : current.portalSessionVersion,
    lockedAt: settings.lockedAt !== undefined ? settings.lockedAt : current.lockedAt,
  };

  if (firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, 'settings', 'contest_settings'), updated, { merge: true });
    } catch (err) {
      console.error('[Firebase] Error saving settings to Firestore:', err);
      throw err;
    }
  }
  return updated;
}
