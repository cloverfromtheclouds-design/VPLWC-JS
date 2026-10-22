import React from 'react';
import {
  Trophy,
  Sliders,
  Table,
  FileSpreadsheet,
  Shield,
  Lock,
  Unlock,
  Music,
  Download,
  User,
  Pencil,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'songs' | 'scorecard' | 'rankings' | 'scores' | 'admin';
  setActiveTab: (tab: 'songs' | 'scorecard' | 'rankings' | 'scores' | 'admin') => void;
  isAdmin: boolean;
  onRequestAdminUnlock: () => void;
  onLockAdmin: () => void;
  pendingSongsCount?: number;
  totalSongsCount?: number;
  onExportExcel?: () => void;
  currentJudgeName?: string;
  onEditJudgeName?: () => void;
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
}) => {
  const logoUrl = `${import.meta.env.BASE_URL}assets/aistudio/hibiscus-flower-vector-logo_fbb8b643.png`;

  return (
    <header className="bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-40 shadow-xs">
      {/* Top Banner with Studio Brand & Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100/80 border border-pink-200/90 flex items-center justify-center p-1 shadow-xs overflow-hidden shrink-0">
              <div
                className="w-8 h-8 bg-gradient-to-tr from-[#ec4899] via-[#f43f5e] to-[#fb7185] transition-transform hover:scale-105"
                style={{
                  maskImage: `url(${logoUrl})`,
                  WebkitMaskImage: `url(${logoUrl})`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-600">
                  Summertide Studio
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isAdmin
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-sky-100 text-[#0284c7] border border-sky-200'
                  }`}
                >
                  {isAdmin ? 'Producer / Admin Panel' : 'Judge Portal (Blind)'}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Online Sync</span>
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-none mt-0.5">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-200 bg-pink-50/90 hover:bg-pink-100 text-pink-900 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
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

            {/* Admin Export to Excel Quick Action */}
            {isAdmin && onExportExcel && (
              <button
                onClick={onExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Export all contest rankings, scores, and songs to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Export to Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
            )}

            {/* Admin Lock / Unlock Toggle */}
            {isAdmin ? (
              <button
                onClick={onLockAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Lock Producer view and switch back to Judge mode"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Admin Mode</span>
                <span className="text-[10px] text-amber-700 underline ml-0.5">Lock</span>
              </button>
            ) : (
              <button
                onClick={onRequestAdminUnlock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
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
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border shrink-0 cursor-pointer ${
              activeTab === 'songs'
                ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs hover:bg-[#0369a1]'
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
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border shrink-0 cursor-pointer ${
              activeTab === 'scorecard'
                ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs hover:bg-[#0369a1]'
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
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border shrink-0 cursor-pointer ${
                  activeTab === 'rankings'
                    ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs hover:bg-[#0369a1]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Final Rankings & Podium</span>
              </button>

              <button
                onClick={() => setActiveTab('scores')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border shrink-0 cursor-pointer ${
                  activeTab === 'scores'
                    ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs hover:bg-[#0369a1]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
                }`}
              >
                <Table className="w-4 h-4" />
                <span>All Judges' Scores</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border shrink-0 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs hover:bg-[#0369a1]'
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
