import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, ArrowRight, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { SummertideFlowerLogo } from './SummertideFlowerLogo';
import { HibiscusInlay } from './HibiscusInlay';

interface PortalPinModalProps {
  isOpen: boolean;
  requiredPin?: string;
  isScreenLocked?: boolean;
  onSuccess: () => void;
}

export const PortalPinModal: React.FC<PortalPinModalProps> = ({
  isOpen,
  requiredPin = '4274',
  isScreenLocked = false,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'bloom' | 'card'>('bloom');
  const [isSuccessAnim, setIsSuccessAnim] = useState(false);

  // When opened, reset to blooming flower screen and keep it on screen until clicked
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setStage('bloom');
      setIsSuccessAnim(false);
      // NOTE: No auto-timer! The flower animation remains visible until the user clicks anywhere.
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScreenClick = () => {
    if (stage === 'bloom') {
      setStage('card');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === requiredPin.trim()) {
      setError(null);
      setIsSuccessAnim(true);
      setTimeout(() => {
        onSuccess();
      }, 500);
    } else {
      setError('Incorrect access PIN. Please verify the 4-digit access code.');
      setPin('');
    }
  };

  return (
    <div
      onClick={handleScreenClick}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gradient-to-b from-[#2e071f] via-[#480d34] to-[#200417] animate-in fade-in duration-300 select-none overflow-hidden ${
        stage === 'bloom' ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Luminous Tropical Pink Ambient Radial Radiance - pure CSS, zero backdrop-filter lag */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,20,147,0.32)_0%,rgba(219,39,119,0.15)_45%,transparent_75%)] pointer-events-none" />

      {/* Decorative Hibiscus Inlays */}
      <HibiscusInlay size="xl" position="bottom-right" opacity="opacity-[0.09]" />
      <HibiscusInlay size="xl" position="top-left" opacity="opacity-[0.07]" />

      {/* Stage 1: Vibrant Hibiscus Flower Pop-Up Animation (Remains until user clicks anywhere) */}
      {stage === 'bloom' && (
        <div className="flex flex-col items-center justify-center text-center z-10 max-w-lg px-4 animate-flower-popup">
          <div className="relative">
            {/* Luminous aura behind flower */}
            <div className="absolute -inset-6 rounded-full bg-pink-500/35 blur-2xl scale-125 pointer-events-none" />
            <div className="animate-flower-float relative">
              <SummertideFlowerLogo
                size="hero"
                glow
                className="drop-shadow-[0_22px_50px_rgba(255,20,147,0.65)]"
              />
            </div>
          </div>

          <div className="mt-7 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="text-xs font-black uppercase tracking-[0.28em] text-pink-300 drop-shadow-sm">
              Summertide Studio
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {isScreenLocked ? 'Judging Session Locked' : 'Lyric Contest Judging Portal'}
            </h1>
            <p className="text-xs sm:text-sm text-pink-100/80 font-medium tracking-wide max-w-md mx-auto leading-relaxed">
              {isScreenLocked
                ? 'Your session is locked for privacy. Click anywhere to enter PIN.'
                : 'Official judge evaluation & producer scoring desk.'}
            </p>
          </div>

          {/* Click to enter PIN prompt button */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setStage('card')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-[0_8px_25px_rgba(255,20,147,0.5)] transition-all cursor-pointer animate-pulse border border-pink-400/40"
            >
              <KeyRound className="w-4 h-4 text-pink-200" />
              <span>Click anywhere to enter PIN</span>
            </button>
            <span className="text-[11px] text-pink-200/70 font-medium">
              Tap or click anywhere on screen to unlock
            </span>
          </div>
        </div>
      )}

      {/* Stage 2: PIN Entering Card Reveal (Shows after user clicked anywhere) */}
      {stage === 'card' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-3xl border border-pink-100 shadow-[0_25px_65px_rgba(255,20,147,0.35),0_1px_2px_rgba(255,255,255,0.95)_inset] p-6 sm:p-8 text-stone-900 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-auto z-10"
        >
          {/* Top Specular Edge Highlight & Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 shadow-sm" />

          {/* Hibiscus Inlay Debossed Watermark */}
          <HibiscusInlay size="lg" position="bottom-right" opacity="opacity-[0.065] sm:opacity-[0.08]" />

          {/* Top Bar with Back Option */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setStage('bloom')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-400 hover:text-pink-600 transition-colors p-1 -ml-1 cursor-pointer"
              title="Return to flower screen"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to screen</span>
            </button>
            <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200/80">
              PIN Required
            </span>
          </div>

          {/* Brand Header with Blooming Flower Logo */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200 flex items-center justify-center p-1.5 shadow-[0_4px_16px_rgba(255,20,147,0.25)] shrink-0">
              <SummertideFlowerLogo size="xl" glow />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-pink-600 uppercase tracking-wider">
                <SummertideFlowerLogo size="xs" />
                <span>Summertide Studio</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight mt-0.5">
                {isScreenLocked ? 'Screen Locked' : 'Judge Access Verification'}
              </h2>
            </div>
          </div>

          {/* Info Pill (No backdrop-blur to avoid lag) */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50/70 border border-pink-200/80 rounded-2xl p-3.5 text-xs text-stone-800 mb-5 flex items-start gap-2.5 shadow-2xs">
            {isScreenLocked ? (
              <Lock className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">
              <span className="font-bold text-stone-900">
                {isScreenLocked ? 'Privacy Lock Active:' : 'Official Evaluation Gate:'}
              </span>{' '}
              {isScreenLocked
                ? 'Your session is locked. Enter the 4-digit PIN to resume scoring.'
                : 'Enter the 4-digit contest access PIN to unlock the judging portal.'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 text-center">
                Enter 4-Digit Access PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder="••••"
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3.5 px-4 bg-white border border-stone-300 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-hidden focus:ring-2 focus:ring-pink-500 focus:border-pink-500 shadow-inner transition-all font-bold"
                  autoFocus
                  required
                />
              </div>
              {error && (
                <p className="text-xs text-rose-600 font-bold mt-2 text-center animate-in fade-in duration-150">
                  {error}
                </p>
              )}
            </div>

            {isSuccessAnim ? (
              <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg animate-in zoom-in-95 duration-150">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>Access Verified! Unlocking...</span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={pin.length < 4}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-extrabold text-sm shadow-[0_8px_22px_rgba(255,20,147,0.3)] transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 border border-pink-400/30"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isScreenLocked ? 'Unlock Session' : 'Verify & Enter Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </form>

          <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between text-[11px] text-stone-400 font-medium">
            <span className="flex items-center gap-1">
              <SummertideFlowerLogo size="xs" />
              <span>Summertide Lyric Contest</span>
            </span>
            <span className="text-pink-600 font-bold">Secure Session</span>
          </div>
        </div>
      )}
    </div>
  );
};
