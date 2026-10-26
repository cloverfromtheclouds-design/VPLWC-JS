import React from 'react';
import {
  Trophy,
  Sliders,
  FileSpreadsheet,
  Shield,
  Lock,
  Unlock,
  Music,
  Download,
  User,
  Pencil,
} from 'lucide-react';

import { SummertideFlowerLogo } from './SummertideFlowerLogo';

interface NavbarProps {
  activeTab: 'songs' | 'scorecard' | 'rankings' | 'admin';
  setActiveTab: (tab: 'songs' | 'scorecard' | 'rankings' | 'admin') => void;
  isAdmin: boolean;
  onRequestAdminUnlock: () => void;
  onLockAdmin: () => void;
  pendingSongsCount?: number;
  totalSongsCount?: number;
  onExportExcel?: () => void;
  currentJudgeName?: string;
  onEditJudgeName?: () => void;
  onLockScreen?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  onRequestAdminUnlock,
  onLockAdmin,
  pendingSongsCount = 0,
  totalSongsCount = 0,
  onExportExcel,
  currentJudgeName = '',
  onEditJudgeName,
  onLockScreen,
}) => {
  return (
    <header className="aero-glass border-b border-white/90 sticky top-0 z-40">
      {/* Top Banner with Studio Brand & Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100/90 border border-pink-200/90 flex items-center justify-center p-1 shadow-[0_4px_12px_rgba(255,20,147,0.18)] shrink-0">
              <SummertideFlowerLogo size="lg" glow />
            </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-pink-600 block">
                  Summertide Studio
                </span>
                <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-none mt-1">
                  Lyric Contest Judging Portal
                </h1>
              </div>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Judge Identity & Edit Button */}
            {onEditJudgeName && (
              <button
                onClick={onEditJudgeName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl aero-btn-secondary text-stone-800 text-xs font-bold cursor-pointer group"
                title="Click to edit your Judge Name"
              >
                <User className="w-3.5 h-3.5 text-pink-600 group-hover:scale-110 transition-transform shrink-0" />
                <span className="hidden sm:inline text-pink-600 font-semibold">Judge:</span>
                <span className="max-w-[110px] sm:max-w-[140px] truncate text-stone-800">
                  {currentJudgeName || 'Set Name'}
                </span>
                <Pencil className="w-3 h-3 text-pink-500 opacity-60 group-hover:opacity-100 shrink-0 ml-0.5" />
              </button>
            )}

            {/* Judge Screen Privacy Lock Button */}
            {onLockScreen && (
              <button
                onClick={onLockScreen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl aero-btn-secondary text-stone-700 text-xs font-bold cursor-pointer group"
                title="Lock your screen immediately for privacy. Re-enter PIN to unlock."
              >
                <Lock className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-900 transition-colors shrink-0" />
                <span className="hidden sm:inline">Lock Screen</span>
                <span className="sm:hidden">Lock</span>
              </button>
            )}

            {/* Admin Export to Excel Quick Action */}
            {isAdmin && onExportExcel && (
              <button
                onClick={onExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl aero-btn-emerald text-white text-xs font-bold cursor-pointer"
                title="Export all contest rankings, scores, and songs to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
                <span className="hidden sm:inline">Export to Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
            )}

            {/* Admin Lock / Unlock Toggle */}
            {isAdmin ? (
              <button
                onClick={onLockAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl aero-btn-secondary text-amber-900 text-xs font-bold cursor-pointer"
                title="Lock Producer view and switch back to Judge mode"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Admin Mode</span>
                <span className="text-[10px] text-amber-700 underline ml-0.5">Lock</span>
              </button>
            ) : (
              <button
                onClick={onRequestAdminUnlock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl aero-btn-secondary text-stone-700 text-xs font-bold cursor-pointer"
                title="Enter Producer PIN to view leaderboard, all scores, and manage entries"
              >
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Producer Access</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 -mb-px">
          {/* Song Entries Tab */}
          <button
            onClick={() => setActiveTab('songs')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all border shrink-0 cursor-pointer ${
              activeTab === 'songs'
                ? 'aero-btn-primary text-white border-sky-400/80 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Song Entries</span>
            {totalSongsCount > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'songs'
                    ? 'bg-white/20 text-white'
                    : 'bg-sky-100 text-[#0284c7]'
                }`}
              >
                {totalSongsCount}
              </span>
            )}
          </button>

          {/* Scorecard */}
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all border shrink-0 cursor-pointer ${
              activeTab === 'scorecard'
                ? 'aero-btn-primary text-white border-sky-400/80 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Judge Scorecard</span>
          </button>

          {/* Producer / Admin Protected Tabs */}
          {isAdmin ? (
            <>
              <button
                onClick={() => setActiveTab('rankings')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all border shrink-0 cursor-pointer ${
                  activeTab === 'rankings'
                    ? 'aero-btn-primary text-white border-sky-400/80 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Final Rankings & Podium</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all border shrink-0 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'aero-btn-primary text-white border-sky-400/80 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Admin Control</span>
              </button>
            </>
          ) : (
            <div className="flex items-center text-xs text-stone-500 pl-2 gap-2 shrink-0">
              <span className="italic hidden sm:inline">
                Blind Judging Mode active · Leaderboard hidden
              </span>
              <span className="italic sm:hidden">
                Blind Mode
              </span>
              {currentJudgeName && (
                <span className="text-[11px] text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span>Scoring as</span>
                  <strong className="text-pink-900 font-bold">{currentJudgeName}</strong>
                </span>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
