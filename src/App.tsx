/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  JudgeScoreSubmission,
  EntrantRanking,
  ContestSongEntry,
  SongFlag,
  RegisteredJudge,
  FlagReason,
  FirebaseStatus,
} from './types/contest';
import {
  calculateRankings,
  computeSummaryStats,
} from './utils/ranking';
import { exportContestToExcel } from './utils/excelExport';
import { Navbar } from './components/Navbar';
import { SongEntriesView } from './components/SongEntriesView';
import { LeaderboardView } from './components/LeaderboardView';
import { ScorecardView } from './components/ScorecardView';
import { AdminDashboard } from './components/AdminDashboard';
import { ConfirmModal } from './components/ConfirmModal';
import { DuplicateUploadModal } from './components/DuplicateUploadModal';
import { JudgeNameModal } from './components/JudgeNameModal';
import { PortalPinModal } from './components/PortalPinModal';
import { WelcomeSplashIntro } from './components/WelcomeSplashIntro';
import { CheckCircle2, AlertCircle, X, KeyRound } from 'lucide-react';

const bgImageUrl = `${import.meta.env.BASE_URL}assets/aistudio/Snomicom_Halfbody_27Nov25_5d4fd688.png`;
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function apiFetch(urlPath: string, init?: RequestInit) {
  const fullUrl = urlPath.startsWith('http') ? urlPath : `${API_BASE}${urlPath}`;
  return fetch(fullUrl, init);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'songs' | 'scorecard' | 'rankings' | 'admin'>(
    'songs'
  );

  // Cloud Firebase Status (from /api/sync)
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseStatus | null>(null);

  // Producer / Admin State (Blind Judging by default)
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState(() => {
    return localStorage.getItem('summertide_admin_pin') || '1234';
  });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Portal Access PIN (Customizable by admin, initial default 4274)
  const [portalPin, setPortalPin] = useState(() => {
    return localStorage.getItem('summertide_portal_pin') || '4274';
  });

  // Portal Access PIN (PIN is required first before entering the portal)
  const [isPortalPinUnlocked, setIsPortalPinUnlocked] = useState(() => {
    return localStorage.getItem('summertide_portal_pin_unlocked') === 'true';
  });

  // Track portal session version for remote locking by admin
  const [portalSessionVersion, setPortalSessionVersion] = useState<number>(() => {
    const saved = localStorage.getItem('summertide_portal_session_version');
    return saved ? parseInt(saved, 10) : 1;
  });

  // Judge name state (saved in localStorage for seamless judging sessions)
  const [currentJudgeName, setCurrentJudgeName] = useState(() => {
    return localStorage.getItem('summertide_judge_name') || '';
  });
  // Require judge name upon entering the site ONLY after portal PIN is verified
  const [isJudgeNameModalOpen, setIsJudgeNameModalOpen] = useState(() => {
    const unlocked = localStorage.getItem('summertide_portal_pin_unlocked') === 'true';
    return unlocked && !localStorage.getItem('summertide_judge_name');
  });

  // Judge screen privacy lock state
  const [isScreenLocked, setIsScreenLocked] = useState(false);

  // Entrance welcome animation state (shows smooth flower blooming on initial web entry)
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(() => {
    const unlocked = localStorage.getItem('summertide_portal_pin_unlocked') === 'true';
    const judge = localStorage.getItem('summertide_judge_name');
    const seen = sessionStorage.getItem('summertide_intro_seen') === 'true';
    return unlocked && !!judge && !seen;
  });

  // Parallax scroll position (gentle bounded tracking to stay visible throughout the page)
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Contest Songs State (persisted in localStorage)
  const [songs, setSongs] = useState<ContestSongEntry[]>(() => {
    try {
      const saved = localStorage.getItem('summertide_contest_songs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading songs from localStorage:', e);
    }
    return [];
  });

  // Contest Flags State (persisted in localStorage & synced online)
  const [flags, setFlags] = useState<SongFlag[]>(() => {
    try {
      const saved = localStorage.getItem('summertide_contest_flags');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading flags from localStorage:', e);
    }
    return [];
  });

  // Registered Judges State (for Monitoring Board)
  const [registeredJudges, setRegisteredJudges] = useState<RegisteredJudge[]>(() => {
    try {
      const saved = localStorage.getItem('summertide_registered_judges');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading registered judges from localStorage:', e);
    }
    return [];
  });

  // Contest Scores State (persisted in localStorage)
  const [scores, setScores] = useState<JudgeScoreSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('summertide_contest_scores');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading scores from localStorage:', e);
    }
    return [];
  });

  const [scorecardEntrantPreFill, setScorecardEntrantPreFill] = useState('');

  // Duplicate Upload Modal State
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    duplicateSong: ContestSongEntry | null;
    filename?: string;
  }>({
    isOpen: false,
    duplicateSong: null,
  });

  // Toast Notification
  const [toast, setToast] = useState<{
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Confirmation Modals for Destructive Operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detailItems?: string[];
    confirmLabel?: string;
    isDestructive?: boolean;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: Date.now(), type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Performance-optimized sync cache ref to avoid unnecessary re-renders & lag
  const lastSyncedRef = useRef<{
    songs: string;
    scores: string;
    flags: string;
    judges: string;
    portalPin: string;
    adminPin: string;
    sessionVersion: number;
    firebase: string;
  }>({
    songs: '',
    scores: '',
    flags: '',
    judges: '',
    portalPin: '',
    adminPin: '',
    sessionVersion: 0,
    firebase: '',
  });

  // Continuous Online Server Sync with smart diff comparison
  const fetchContestData = useCallback(async (isSilent = true) => {
    // Avoid background work if browser tab is hidden to save CPU and avoid lag
    if (document.hidden && isSilent) return;

    try {
      const res = await apiFetch('/api/sync');
      if (!okRes(res)) return;
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.songs)) {
          const songsStr = JSON.stringify(data.songs);
          if (songsStr !== lastSyncedRef.current.songs) {
            lastSyncedRef.current.songs = songsStr;
            setSongs(data.songs);
            try {
              localStorage.setItem('summertide_contest_songs', songsStr);
            } catch (e) {
              // Ignore storage quotas
            }
          }
        }
        if (Array.isArray(data.scores)) {
          const scoresStr = JSON.stringify(data.scores);
          if (scoresStr !== lastSyncedRef.current.scores) {
            lastSyncedRef.current.scores = scoresStr;
            setScores(data.scores);
            try {
              localStorage.setItem('summertide_contest_scores', scoresStr);
            } catch (e) {
              // Ignore storage quotas
            }
          }
        }
        if (Array.isArray(data.flags)) {
          const flagsStr = JSON.stringify(data.flags);
          if (flagsStr !== lastSyncedRef.current.flags) {
            lastSyncedRef.current.flags = flagsStr;
            setFlags(data.flags);
            try {
              localStorage.setItem('summertide_contest_flags', flagsStr);
            } catch (e) {
              // Ignore storage quotas
            }
          }
        }
        if (Array.isArray(data.judges)) {
          const judgesStr = JSON.stringify(data.judges);
          if (judgesStr !== lastSyncedRef.current.judges) {
            lastSyncedRef.current.judges = judgesStr;
            setRegisteredJudges(data.judges);
            try {
              localStorage.setItem('summertide_registered_judges', judgesStr);
            } catch (e) {
              // Ignore storage quotas
            }
          }
        }
        if (data.settings) {
          if (data.settings.portalPin && data.settings.portalPin !== lastSyncedRef.current.portalPin) {
            lastSyncedRef.current.portalPin = data.settings.portalPin;
            setPortalPin(data.settings.portalPin);
            localStorage.setItem('summertide_portal_pin', data.settings.portalPin);
          }
          if (data.settings.adminPin && data.settings.adminPin !== lastSyncedRef.current.adminPin) {
            lastSyncedRef.current.adminPin = data.settings.adminPin;
            setAdminPin(data.settings.adminPin);
            localStorage.setItem('summertide_admin_pin', data.settings.adminPin);
          }
          if (typeof data.settings.portalSessionVersion === 'number') {
            const serverVersion = data.settings.portalSessionVersion;
            const currentLocalVersion = parseInt(localStorage.getItem('summertide_portal_session_version') || '1', 10);
            if (serverVersion > currentLocalVersion) {
              // Remote lock triggered by Admin!
              setIsPortalPinUnlocked(false);
              localStorage.removeItem('summertide_portal_pin_unlocked');
              localStorage.setItem('summertide_portal_session_version', serverVersion.toString());
              setPortalSessionVersion(serverVersion);
              showToast('The contest administrator has locked the portal. Please re-enter the access PIN.', 'info');
            } else {
              setPortalSessionVersion(serverVersion);
            }
          }
        }
        if (data.firebase) {
          const fbStr = JSON.stringify(data.firebase);
          if (fbStr !== lastSyncedRef.current.firebase) {
            lastSyncedRef.current.firebase = fbStr;
            setFirebaseStatus(data.firebase);
          }
        }
      }
    } catch (err) {
      if (!isSilent) console.error('Failed to sync contest data from server:', err);
    }
  }, [showToast]);

  // Helper for fetch response
  function okRes(res: Response) {
    return res.ok;
  }

  useEffect(() => {
    // Initial fetch from online server on boot
    fetchContestData(false);

    // Live continuous sync every 4.5 seconds
    const interval = setInterval(() => {
      fetchContestData(true);
    }, 4500);

    // Immediate sync when tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchContestData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchContestData]);

  // Save portal pin to localStorage
  useEffect(() => {
    if (portalPin) {
      localStorage.setItem('summertide_portal_pin', portalPin);
    }
  }, [portalPin]);

  // Save current judge name to localStorage
  useEffect(() => {
    if (currentJudgeName) {
      localStorage.setItem('summertide_judge_name', currentJudgeName);
    }
  }, [currentJudgeName]);

  // Dismiss entrance welcome animation
  const handleFinishWelcomeIntro = useCallback(() => {
    sessionStorage.setItem('summertide_intro_seen', 'true');
    setShowWelcomeIntro(false);
  }, []);

  // Judges Screen Privacy Lock: Locks portal immediately and prompts for PIN to re-enter
  const handleLockScreen = useCallback(() => {
    setIsPortalPinUnlocked(false);
    setIsScreenLocked(true);
    localStorage.removeItem('summertide_portal_pin_unlocked');
    showToast('Screen locked for privacy. Enter your access PIN to resume judging.', 'info');
  }, [showToast]);

  // Handle Portal PIN verification
  const handlePortalPinSuccess = () => {
    setIsPortalPinUnlocked(true);
    localStorage.setItem('summertide_portal_pin_unlocked', 'true');
    localStorage.setItem('summertide_portal_session_version', portalSessionVersion.toString());
    const wasLocked = isScreenLocked;
    setIsScreenLocked(false);
    if (!currentJudgeName) {
      setIsJudgeNameModalOpen(true);
    }
    showToast(
      wasLocked
        ? 'Judging session unlocked. Welcome back!'
        : 'Portal PIN verified. Welcome to Summertide Judging Portal!',
      'success'
    );
  };

  // Register a judge into the monitoring roster
  const handleRegisterJudge = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Optimistic local update
    setRegisteredJudges((prev) => {
      const exists = prev.some((j) => j.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return prev.map((j) =>
          j.name.toLowerCase() === trimmed.toLowerCase()
            ? { ...j, lastActiveAt: new Date().toISOString() }
            : j
        );
      }
      return [
        ...prev,
        {
          id: `judge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: trimmed,
          registeredAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        },
      ];
    });

    try {
      const res = await apiFetch('/api/judges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.judges)) {
          setRegisteredJudges(data.judges);
          localStorage.setItem('summertide_registered_judges', JSON.stringify(data.judges));
        }
      }
    } catch (e) {
      console.error('Failed to register judge on server:', e);
    }
  };

  const handleDeleteJudge = (nameOrId: string) => {
    const targetClean = nameOrId.trim().toLowerCase();

    // Identify all matching names and IDs
    const matchedNames = new Set<string>([targetClean]);
    registeredJudges.forEach((j) => {
      const jId = (j.id || '').trim().toLowerCase();
      const jName = (j.name || '').trim().toLowerCase();
      if (jId === targetClean || jName === targetClean) {
        if (jName) matchedNames.add(jName);
        if (jId) matchedNames.add(jId);
      }
    });

    const judgeScores = scores.filter(
      (s) => s.judgeName && matchedNames.has(s.judgeName.trim().toLowerCase())
    );

    const displayName =
      registeredJudges.find((j) => matchedNames.has(j.name.trim().toLowerCase()))?.name ||
      nameOrId;

    setConfirmModal({
      isOpen: true,
      title: `Delete Judge "${displayName}"?`,
      message: `Are you sure you want to permanently delete Judge "${displayName}" and remove them from the contest?`,
      detailItems:
        judgeScores.length > 0
          ? [
              `⚠️ WARNING: ${judgeScores.length} scorecard${judgeScores.length === 1 ? '' : 's'} graded by ${displayName} will be permanently deleted.`,
              'Contest rankings, criteria averages, and standings will recalculate automatically.',
              'This judge will be removed from the monitoring board and cloud database.',
              'This action cannot be undone.',
            ]
          : [
              `⚠️ WARNING: Judge "${displayName}" will be permanently removed from the contest monitoring roster and database.`,
              'Any links previously issued to this judge will no longer link to their record.',
            ],
      confirmLabel: judgeScores.length > 0 ? 'Yes, Delete Judge & All Scores' : 'Yes, Delete Judge',
      isDestructive: true,
      action: async () => {
        // 1. Optimistically remove judge from registeredJudges
        setRegisteredJudges((prev) =>
          prev.filter((j) => {
            const jId = (j.id || '').trim().toLowerCase();
            const jName = (j.name || '').trim().toLowerCase();
            return !matchedNames.has(jId) && !matchedNames.has(jName);
          })
        );

        // 2. Optimistically remove all scorecards submitted by this judge from scores
        setScores((prev) =>
          prev.filter((s) => !matchedNames.has((s.judgeName || '').trim().toLowerCase()))
        );

        // 3. If deleted judge is the current session judge, clear session name
        if (currentJudgeName && matchedNames.has(currentJudgeName.trim().toLowerCase())) {
          setCurrentJudgeName('');
          localStorage.removeItem('summertide_judge_name');
        }

        // 4. Update localStorage immediately
        try {
          const updatedJudges = registeredJudges.filter((j) => {
            const jId = (j.id || '').trim().toLowerCase();
            const jName = (j.name || '').trim().toLowerCase();
            return !matchedNames.has(jId) && !matchedNames.has(jName);
          });
          const updatedScores = scores.filter(
            (s) => !matchedNames.has((s.judgeName || '').trim().toLowerCase())
          );
          localStorage.setItem('summertide_registered_judges', JSON.stringify(updatedJudges));
          localStorage.setItem('summertide_contest_scores', JSON.stringify(updatedScores));
        } catch (e) {
          console.error('LocalStorage write error:', e);
        }

        // Close modal
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));

        // 5. Call server to delete from memoryCache and Firestore
        try {
          const res = await apiFetch(`/api/judges/${encodeURIComponent(nameOrId)}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.judges)) {
              setRegisteredJudges(data.judges);
              localStorage.setItem('summertide_registered_judges', JSON.stringify(data.judges));
            }
            if (Array.isArray(data.scores)) {
              setScores(data.scores);
              localStorage.setItem('summertide_contest_scores', JSON.stringify(data.scores));
            }
          }
        } catch (e) {
          console.error('Failed to remove judge on server:', e);
        }

        showToast(
          judgeScores.length > 0
            ? `Deleted Judge "${displayName}" and ${judgeScores.length} scorecard${judgeScores.length === 1 ? '' : 's'}.`
            : `Deleted Judge "${displayName}" from contest.`,
          'info'
        );
      },
    });
  };

  // Handle saving / updating judge identity
  const handleSaveJudgeName = (name: string, isExistingLogin = false) => {
    setCurrentJudgeName(name);
    localStorage.setItem('summertide_judge_name', name);
    setIsJudgeNameModalOpen(false);
    handleRegisterJudge(name);

    const existingScoresCount = scores.filter(
      (s) => s.judgeName && s.judgeName.trim().toLowerCase() === name.trim().toLowerCase()
    ).length;

    if (isExistingLogin || existingScoresCount > 0) {
      showToast(
        `Welcome back, Judge ${name}! Restored ${existingScoresCount} scorecard${
          existingScoresCount === 1 ? '' : 's'
        } on this device.`,
        'success'
      );
    } else {
      showToast(`Welcome, Judge ${name}! Ready to score contest songs.`, 'success');
    }
  };

  // Check URL query parameters and saved session (Blind Judge mode is DEFAULT)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'admin') {
      setIsAdmin(true);
    } else {
      const savedAuth = sessionStorage.getItem('summertide_admin_unlocked');
      if (savedAuth === 'true') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
    const nameParam = params.get('name');
    if (nameParam && nameParam.trim()) {
      setCurrentJudgeName(nameParam.trim());
      handleRegisterJudge(nameParam.trim());
    } else {
      const savedName = localStorage.getItem('summertide_judge_name');
      if (savedName && savedName.trim()) {
        handleRegisterJudge(savedName.trim());
      }
    }
  }, []);

  // Calculate live rankings and statistics in real time whenever scores change
  const rankings = useMemo(() => calculateRankings(scores, flags), [scores, flags]);
  const stats = useMemo(() => computeSummaryStats(scores, rankings), [scores, rankings]);

  // Lists for autocomplete in scorecard
  const knownJudges = useMemo(() => {
    const fromScores = scores.map((s) => s.judgeName);
    if (currentJudgeName) fromScores.push(currentJudgeName);
    return Array.from(new Set(fromScores)).filter(Boolean);
  }, [scores, currentJudgeName]);

  const knownEntrants = useMemo(() => {
    const fromScores = scores.map((s) => s.entrantName);
    const fromSongs = songs.map((s) => s.formattedEntrantName || s.songTitle);
    return Array.from(new Set([...fromSongs, ...fromScores])).filter(Boolean);
  }, [scores, songs]);

  // Export full contest data to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      exportContestToExcel(rankings, scores, songs, stats);
      showToast('Downloaded official contest results as Excel (.xlsx)!', 'success');
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('Failed to export Excel file. Please try again.', 'error');
    }
  };

  // Song Entry Handlers (Only Admin can add or upload songs)
  const handleAddSong = async (newSong: ContestSongEntry) => {
    if (!isAdmin) {
      showToast('Notice: Only the contest producer/admin can upload entries.', 'error');
      return;
    }
    // Optimistic update
    setSongs((prev) => [newSong, ...prev.filter((s) => s.id !== newSong.id)]);
    showToast(`Registered "${newSong.songTitle}" in the contest queue!`, 'success');

    try {
      const res = await apiFetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSong),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.songs)) {
          setSongs(data.songs);
          localStorage.setItem('summertide_contest_songs', JSON.stringify(data.songs));
        }
        showToast(`"${newSong.songTitle}" is now live online for all judges & producers!`, 'success');
      }
    } catch (e) {
      console.error('Failed to upload song to server:', e);
    }
  };

  const handleDeleteSong = (songId: string, songTitle: string, formattedEntrantName?: string) => {
    if (!isAdmin) return;
    setConfirmModal({
      isOpen: true,
      title: `Delete Song "${songTitle}"?`,
      message: `Are you sure you want to remove "${songTitle}" from the contest queue? This will permanently delete this song and all corresponding judge scorecards online across all devices.`,
      confirmLabel: 'Delete Song & Scores',
      isDestructive: true,
      action: async () => {
        const titleLower = songTitle.trim().toLowerCase();
        const formattedLower = (formattedEntrantName || '').trim().toLowerCase();

        // Optimistic remove from local songs
        setSongs((prev) =>
          prev.filter(
            (s) =>
              s.id !== songId &&
              s.songTitle.trim().toLowerCase() !== titleLower &&
              (!formattedLower || (s.formattedEntrantName || '').trim().toLowerCase() !== formattedLower)
          )
        );

        // Optimistic remove corresponding scores
        setScores((prev) =>
          prev.filter((sc) => {
            const scTitle = (sc.songTitle || '').trim().toLowerCase();
            const scEntrant = sc.entrantName.trim().toLowerCase();
            if (scTitle === titleLower || scEntrant === titleLower) return false;
            if (formattedLower && (scTitle === formattedLower || scEntrant === formattedLower)) return false;
            return true;
          })
        );

        setConfirmModal((prev) => ({ ...prev, isOpen: false }));

        try {
          const res = await apiFetch(`/api/songs/${encodeURIComponent(songId || songTitle)}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.songs)) {
              setSongs(data.songs);
              localStorage.setItem('summertide_contest_songs', JSON.stringify(data.songs));
            }
            if (Array.isArray(data.scores)) {
              setScores(data.scores);
              localStorage.setItem('summertide_contest_scores', JSON.stringify(data.scores));
            }
          }
        } catch (e) {
          console.error('Failed to delete song on server:', e);
        }
        showToast(`Removed "${songTitle}" and all scorecards from the contest.`, 'info');
      },
    });
  };

  const handleTriggerDuplicateModal = (song: ContestSongEntry, filename?: string) => {
    setDuplicateModal({
      isOpen: true,
      duplicateSong: song,
      filename,
    });
  };

  const handleConfirmGradeDuplicate = (song: ContestSongEntry) => {
    setScorecardEntrantPreFill(song.formattedEntrantName || song.songTitle);
    setActiveTab('scorecard');
  };

  const handleSelectSongToGrade = (song: ContestSongEntry) => {
    setScorecardEntrantPreFill(song.formattedEntrantName || song.songTitle);
    setActiveTab('scorecard');
  };

  // Submit Scorecard
  const handleSubmitScore = async (submission: JudgeScoreSubmission): Promise<boolean> => {
    const j = submission.judgeName.trim().toLowerCase();
    const entrant = submission.entrantName.trim().toLowerCase();
    const title = (submission.songTitle || '').trim().toLowerCase();

    // Check duplicate locally
    const duplicate = scores.find((s) => {
      if (s.judgeName.trim().toLowerCase() !== j) return false;
      const sEntrant = s.entrantName.trim().toLowerCase();
      const sTitle = (s.songTitle || '').trim().toLowerCase();
      return (
        sEntrant === entrant ||
        sTitle === title ||
        (title && sEntrant === title) ||
        (entrant && sTitle === entrant) ||
        (title && sEntrant.includes(title))
      );
    });

    if (duplicate) {
      showToast(`Score has already been submitted for this song by Judge ${submission.judgeName}.`, 'error');
      return false;
    }

    const newScoreItem: JudgeScoreSubmission = {
      ...submission,
      id: submission.id || `score-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: submission.timestamp || new Date().toISOString(),
    };

    setScores((prev) => [newScoreItem, ...prev]);

    if (submission.judgeName && submission.judgeName !== currentJudgeName) {
      setCurrentJudgeName(submission.judgeName);
    }
    if (submission.judgeName) {
      handleRegisterJudge(submission.judgeName);
    }

    try {
      const res = await apiFetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScoreItem),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.scores)) {
          setScores(data.scores);
          localStorage.setItem('summertide_contest_scores', JSON.stringify(data.scores));
        }
      } else if (res.status === 409) {
        showToast('This scorecard has already been submitted online.', 'error');
        return false;
      }
    } catch (e) {
      console.error('Failed to post score to online server:', e);
    }

    showToast(
      `Score recorded for "${submission.entrantName}"! Total: ${submission.totalScore}/100`,
      'success'
    );
    return true;
  };

  // Admin PIN Unlock
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === adminPin) {
      setIsAdmin(true);
      sessionStorage.setItem('summertide_admin_unlocked', 'true');
      setIsPinModalOpen(false);
      setEnteredPin('');
      setPinError(null);
      setActiveTab('rankings');
      showToast('Producer Control Center unlocked.', 'success');
    } else {
      setPinError('Incorrect PIN. Please try again.');
    }
  };

  const handleLockAdmin = () => {
    setIsAdmin(false);
    sessionStorage.setItem('summertide_admin_unlocked', 'false');
    setActiveTab('songs');
    showToast('Switched to Judge Mode (Blind). Leaderboard hidden from view.', 'info');
  };

  const handleUpdateAdminPin = async (newPin: string) => {
    setAdminPin(newPin);
    localStorage.setItem('summertide_admin_pin', newPin);
    showToast('Producer PIN updated successfully!', 'success');

    try {
      await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin: newPin }),
      });
    } catch (e) {
      console.error('Failed to sync admin pin with server:', e);
    }
  };

  const handleUpdatePortalPin = async (newPin: string) => {
    setPortalPin(newPin);
    localStorage.setItem('summertide_portal_pin', newPin);
    showToast(`Portal Access Security PIN updated to "${newPin}"!`, 'success');

    try {
      await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalPin: newPin }),
      });
    } catch (e) {
      console.error('Failed to sync portal pin with server:', e);
    }
  };

  // Remote Portal Lock (Forces all judges across all devices to re-enter PIN)
  const handleLockPortal = async () => {
    try {
      const res = await apiFetch('/api/settings/lock-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.portalSessionVersion) {
          setPortalSessionVersion(data.settings.portalSessionVersion);
          localStorage.setItem('summertide_portal_session_version', data.settings.portalSessionVersion.toString());
        }
        showToast('Judging Portal has been LOCKED! All judges must re-enter the access PIN.', 'success');
      }
    } catch (e) {
      console.error('Failed to lock portal on server:', e);
      showToast('Failed to lock portal on server.', 'error');
    }
  };

  // Flag & Rule Violation Handlers
  const handleFlagSong = async (
    songId: string,
    songTitle: string,
    entrantName: string,
    reason: FlagReason,
    reasonLabel: string,
    notes: string
  ) => {
    const newFlag: SongFlag = {
      id: `flag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      songId,
      songTitle,
      entrantName,
      flaggedBy: currentJudgeName || 'Independent Judge',
      reason,
      reasonLabel,
      notes,
      flaggedAt: new Date().toISOString(),
      status: 'pending_review',
    };

    setFlags((prev) => [newFlag, ...prev]);
    showToast(`Flag logged for "${songTitle}" (${reasonLabel}). Scoring aborted.`, 'error');

    try {
      const res = await apiFetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFlag),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.flags)) {
          setFlags(data.flags);
          localStorage.setItem('summertide_contest_flags', JSON.stringify(data.flags));
        }
        if (Array.isArray(data.songs)) {
          setSongs(data.songs);
          localStorage.setItem('summertide_contest_songs', JSON.stringify(data.songs));
        }
      }
    } catch (e) {
      console.error('Failed to post flag to server:', e);
    }
  };

  const handleUpdateFlagStatus = async (
    flagId: string,
    status: 'disqualified' | 'cleared'
  ) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, status, reviewedBy: 'Admin' } : f))
    );

    const message =
      status === 'disqualified'
        ? 'Song has been officially disqualified from contest standings.'
        : 'Flag cleared. Song restored for judging!';
    showToast(message, status === 'disqualified' ? 'error' : 'success');

    try {
      const res = await apiFetch(`/api/flags/${encodeURIComponent(flagId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewedBy: 'Admin' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.flags)) {
          setFlags(data.flags);
          localStorage.setItem('summertide_contest_flags', JSON.stringify(data.flags));
        }
        if (Array.isArray(data.songs)) {
          setSongs(data.songs);
          localStorage.setItem('summertide_contest_songs', JSON.stringify(data.songs));
        }
      }
    } catch (e) {
      console.error('Failed to update flag status on server:', e);
    }
  };

  const handleDeleteFlag = async (flagId: string) => {
    setFlags((prev) => prev.filter((f) => f.id !== flagId));
    showToast('Violation report removed.', 'info');

    try {
      const res = await apiFetch(`/api/flags/${encodeURIComponent(flagId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.flags)) {
          setFlags(data.flags);
          localStorage.setItem('summertide_contest_flags', JSON.stringify(data.flags));
        }
        if (Array.isArray(data.songs)) {
          setSongs(data.songs);
          localStorage.setItem('summertide_contest_songs', JSON.stringify(data.songs));
        }
      }
    } catch (e) {
      console.error('Failed to delete flag on server:', e);
    }
  };

  // Admin: Delete a single score
  const handleDeleteScore = (scoreId: string) => {
    const target = scores.find((s, idx) => (s.id || `idx-${idx}`) === scoreId);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Scorecard?',
      message: `Are you sure you want to delete the scorecard by ${target?.judgeName || 'this judge'} for "${target?.entrantName || 'this entry'}"? This action recalculates contest rankings online.`,
      confirmLabel: 'Delete Scorecard',
      isDestructive: true,
      action: async () => {
        setScores((prev) => prev.filter((s, idx) => (s.id || `idx-${idx}`) !== scoreId));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));

        try {
          const res = await apiFetch(`/api/scores/${encodeURIComponent(scoreId)}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.scores)) {
              setScores(data.scores);
              localStorage.setItem('summertide_contest_scores', JSON.stringify(data.scores));
            }
          }
        } catch (e) {
          console.error('Failed to delete score on server:', e);
        }

        showToast('Scorecard removed and rankings updated.', 'info');
      },
    });
  };

  // Admin: Delete an entire entrant and all their scores
  const handleDeleteEntrant = (entrantName: string) => {
    const matched = songs.find(
      (s) =>
        s.songTitle.trim().toLowerCase() === entrantName.trim().toLowerCase() ||
        (s.formattedEntrantName && s.formattedEntrantName.trim().toLowerCase() === entrantName.trim().toLowerCase())
    );
    handleDeleteSong(matched?.id || entrantName, matched?.songTitle || entrantName, matched?.formattedEntrantName || entrantName);
  };

  // Admin: Rename an entrant across all historical scores & songs
  const handleRenameEntrant = async (oldName: string, newName: string) => {
    const oldLower = oldName.trim().toLowerCase();

    setScores((prev) =>
      prev.map((s) => {
        const sTitle = (s.songTitle || '').trim().toLowerCase();
        const sEntrant = s.entrantName.trim().toLowerCase();
        if (sTitle === oldLower || sEntrant === oldLower) {
          return { ...s, songTitle: newName, entrantName: newName };
        }
        return s;
      })
    );

    setSongs((prev) =>
      prev.map((s) => {
        const sTitle = s.songTitle.trim().toLowerCase();
        const sFormatted = (s.formattedEntrantName || '').trim().toLowerCase();
        if (sTitle === oldLower || sFormatted === oldLower) {
          return {
            ...s,
            songTitle: newName,
            formattedEntrantName: s.alias ? `${newName} — ${s.alias}` : newName,
          };
        }
        return s;
      })
    );

    showToast(`Renamed "${oldName}" to "${newName}" across all scorecards.`, 'success');

    try {
      const res = await apiFetch(`/api/songs/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTitle: newName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.songs)) setSongs(data.songs);
        if (Array.isArray(data.scores)) setScores(data.scores);
      }
    } catch (e) {
      console.error('Failed to update title on server:', e);
    }
  };

  const handleOpenScorecardForEntrant = (name: string) => {
    setScorecardEntrantPreFill(name);
    setActiveTab('scorecard');
  };

  return (
    <div className="relative min-h-screen text-[#20242d] font-sans antialiased flex flex-col selection:bg-pink-200 selection:text-pink-900 overflow-x-hidden">
      {/* Background with Gentle Parallax and Enhanced Pink Gradient */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      >
        {/* Parallax Background Image Layer (Gentle translation with ample headroom to stay visible all the way through) */}
        <div
          className="absolute -top-[12%] -bottom-[12%] -left-[4%] -right-[4%] bg-cover bg-center bg-no-repeat will-change-transform"
          style={{
            backgroundImage: `url(${bgImageUrl})`,
            transform: `translate3d(0, ${-Math.min(scrollY * 0.045, 110)}px, 0) scale(1.15)`,
            transformOrigin: 'center center',
            filter: 'blur(2px) saturate(1.18)',
            opacity: 0.88,
          }}
        />

        {/* Enhanced Summertide Pink Gradient Overlays (Increased intensity while keeping art visible) */}
        <div className="absolute inset-0 bg-gradient-to-b from-pink-100/40 via-pink-200/50 to-pink-300/65 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-300/30 via-transparent to-rose-200/25 pointer-events-none" />

        {/* Subtle Frutiger Aero Atmospheric Sky/Cyan Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[340px] bg-gradient-to-b from-cyan-300/20 via-sky-200/12 to-transparent blur-3xl rounded-full pointer-events-none" />

        {/* Distinct Frutiger Aero Aurora Light Ribbons & Glass Caustics */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen">
          {/* Broad Luminous Aqua/Cyan Aero Aurora Wave (Signature Vista/7 Organic Tech-Nature Aesthetic) */}
          <div className="absolute -top-[8%] -left-[18%] w-[145%] h-64 bg-gradient-to-r from-transparent via-cyan-300/40 via-sky-100/55 via-cyan-200/35 to-transparent blur-2xl -rotate-12 transform-gpu animate-glass-flare pointer-events-none" />

          {/* Secondary Soft Horizon Glass Stream */}
          <div className="absolute top-[18%] left-[2%] w-[96%] h-28 bg-gradient-to-r from-transparent via-sky-300/35 via-white/50 to-transparent blur-2xl transform-gpu pointer-events-none" />

          {/* Luminous Starburst Optical Core */}
          <div className="absolute top-[3%] left-[24%] w-[520px] h-[220px] bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.95)_0%,_rgba(125,211,252,0.7)_30%,_rgba(56,189,248,0.38)_55%,_transparent_75%)] blur-lg pointer-events-none" />

          {/* Chromatic Iridescent Glass Caustic Halo Ring */}
          <div className="absolute top-[1%] left-[15%] w-88 h-88 rounded-full border border-white/70 bg-gradient-to-br from-cyan-300/40 via-white/15 to-pink-300/30 blur-xs shadow-[inset_0_0_30px_rgba(56,189,248,0.45),0_0_35px_rgba(255,255,255,0.5)] pointer-events-none" />

          {/* Lower Right Secondary Prismatic Angle Reflection */}
          <div className="absolute top-[48%] -right-[12%] w-[70%] h-32 bg-gradient-to-r from-transparent via-cyan-300/40 via-white/45 to-transparent blur-2xl rotate-12 transform-gpu pointer-events-none" />
        </div>
      </div>

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        onRequestAdminUnlock={() => {
          setPinError(null);
          setEnteredPin('');
          setIsPinModalOpen(true);
        }}
        onLockAdmin={handleLockAdmin}
        totalSongsCount={songs.length}
        onExportExcel={isAdmin ? handleExportExcel : undefined}
        currentJudgeName={currentJudgeName}
        onEditJudgeName={() => setIsJudgeNameModalOpen(true)}
        onLockScreen={handleLockScreen}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Song Entries Tab (Available to both judges and admin; uploads restricted to admin) */}
        {activeTab === 'songs' && (
          <SongEntriesView
            songs={songs}
            scores={scores}
            flags={flags}
            currentJudgeName={currentJudgeName}
            onChangeJudgeName={setCurrentJudgeName}
            onSelectSongToGrade={handleSelectSongToGrade}
            isAdmin={isAdmin}
            onAddSong={isAdmin ? handleAddSong : undefined}
            onDeleteSong={isAdmin ? handleDeleteSong : undefined}
            onTriggerDuplicateModal={handleTriggerDuplicateModal}
          />
        )}

        {/* Judge Scorecard View */}
        {activeTab === 'scorecard' && (
          <ScorecardView
            initialEntrantName={scorecardEntrantPreFill}
            defaultJudgeName={currentJudgeName}
            onSubmitScore={handleSubmitScore}
            knownJudges={knownJudges}
            knownEntrants={knownEntrants}
            existingScores={scores}
            contestSongs={songs}
            flags={flags}
            onFlagSong={handleFlagSong}
            isAdmin={isAdmin}
            onGoToSongEntries={() => setActiveTab('songs')}
            onTriggerDuplicateModal={handleTriggerDuplicateModal}
          />
        )}

        {/* Leaderboard View (Admin Only) */}
        {isAdmin && activeTab === 'rankings' && (
          <LeaderboardView
            rankings={rankings}
            stats={stats}
            onExportExcel={handleExportExcel}
            onOpenScorecardForEntrant={handleOpenScorecardForEntrant}
            onGoToScorecard={() => setActiveTab('scorecard')}
          />
        )}

        {/* Admin Control Center (Admin Only) */}
        {isAdmin && activeTab === 'admin' && (
          <AdminDashboard
            scores={scores}
            rankings={rankings}
            songs={songs}
            flags={flags}
            registeredJudges={registeredJudges}
            firebaseStatus={firebaseStatus}
            onDeleteScore={handleDeleteScore}
            onDeleteSong={handleDeleteSong}
            onDeleteEntrant={handleDeleteEntrant}
            onRenameEntrant={handleRenameEntrant}
            onExportExcel={handleExportExcel}
            adminPin={adminPin}
            portalPin={portalPin}
            portalSessionVersion={portalSessionVersion}
            onLockPortal={handleLockPortal}
            onUpdateAdminPin={handleUpdateAdminPin}
            onUpdatePortalPin={handleUpdatePortalPin}
            onUpdateFlagStatus={handleUpdateFlagStatus}
            onDeleteFlag={handleDeleteFlag}
            onAddJudge={handleRegisterJudge}
            onDeleteJudge={handleDeleteJudge}
            onSwitchToJudgeMode={handleLockAdmin}
          />
        )}
      </main>

      {/* Admin Unlock PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm aero-glass-card rounded-3xl p-6 text-stone-900">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-stone-900">Producer Access</h3>
            <p className="text-xs text-stone-500 mt-1">
              Enter your Producer PIN to unlock the live leaderboard, all scores matrix, Excel exports,
              and contest controls. (Default: <code>1234</code>)
            </p>

            <form onSubmit={handleUnlockAdmin} className="mt-4 space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={8}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="w-full text-center text-xl tracking-widest font-mono py-2.5 px-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#0284c7] focus:outline-hidden"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5 text-center">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-2.5 aero-btn-secondary rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 aero-btn-primary text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Welcome Entrance Splash with Flower Pop-Up (Initial visit with active session) */}
      {showWelcomeIntro && (
        <WelcomeSplashIntro
          judgeName={currentJudgeName}
          onFinish={handleFinishWelcomeIntro}
        />
      )}

      {/* Portal PIN Access Gatekeeper (Configurable by admin or session lock) */}
      <PortalPinModal
        isOpen={!isPortalPinUnlocked}
        requiredPin={portalPin}
        isScreenLocked={isScreenLocked}
        onSuccess={handlePortalPinSuccess}
      />

      {/* Judge Name Onboarding & Edit Modal */}
      <JudgeNameModal
        isOpen={isJudgeNameModalOpen}
        currentName={currentJudgeName}
        isInitialRequired={!currentJudgeName}
        registeredJudges={registeredJudges}
        scores={scores}
        totalSongsCount={songs.length}
        onSave={handleSaveJudgeName}
        onClose={() => {
          if (currentJudgeName) {
            setIsJudgeNameModalOpen(false);
          }
        }}
      />

      {/* Duplicate Upload Modal */}
      <DuplicateUploadModal
        isOpen={duplicateModal.isOpen}
        duplicateSong={duplicateModal.duplicateSong}
        uploadedFileName={duplicateModal.filename}
        onConfirmGrade={handleConfirmGradeDuplicate}
        onClose={() => setDuplicateModal({ isOpen: false, duplicateSong: null })}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        detailItems={confirmModal.detailItems}
        confirmLabel={confirmModal.confirmLabel}
        isDestructive={confirmModal.isDestructive}
        isLoading={false}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-stone-900 text-white rounded-2xl shadow-xl border border-stone-700 animate-in slide-in-from-bottom-5 duration-200 text-xs sm:text-sm">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-stone-400 hover:text-white p-1 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-stone-200/80 bg-white/80 backdrop-blur-md py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>Summertide Studio Lyric Contest · Producer & Judging System</div>
          <div className="text-stone-400">
            Four criteria · Maximum awardable: 100/100 · Automated Standings & Excel Export
          </div>
        </div>
      </footer>
    </div>
  );
}
