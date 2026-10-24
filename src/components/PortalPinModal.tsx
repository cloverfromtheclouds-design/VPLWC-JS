import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
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

  // Trigger smooth blooming animation on open
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setStage('bloom');
      setIsSuccessAnim(false);

      const timer = setTimeout(() => {
        setStage('card');
      }, 1050);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSkipToCard = () => {
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
      }, 550);
    } else {
      setError('Incorrect access PIN. Please verify the 4-digit access code.');
      setPin('');
    }
  };

  return (
    <div
      onClick={handleSkipToCard}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xl animate-in fade-in duration-300 cursor-default select-none"
    >
      {/* Ambient Tropical Pink Illumination in Background */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-pink-500/20 blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Stage 1: Vibrant Hibiscus Flower Pop-Up Animation */}
      {stage === 'bloom' && (
        <div className="flex flex-col items-center justify-center text-center z-10 animate-flower-popup">
          <div className="relative">
            {/* Soft luminous aura */}
            <div className="absolute inset-0 rounded-full bg-pink-500/35 blur-2xl scale-125" />
            <div className="animate-flower-float relative">
              <SummertideFlowerLogo
                size="hero"
                glow
                className="drop-shadow-[0_20px_45px_rgba(255,20,147,0.55)]"
              />
            </div>
          </div>

          <div className="mt-6 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-pink-400">
              Summertide Studio
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              {isScreenLocked ? 'Judging Session Locked' : 'Lyric Contest Portal'}
            </h1>
            <p className="text-xs text-stone-300 font-medium tracking-wide">
              {isScreenLocked ? 'Click anywhere or wait to enter PIN' : 'Preparing official evaluation desk...'}
            </p>
          </div>
        </div>
      )}

      {/* Stage 2: PIN Entering Card Reveal */}
      {stage === 'card' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-gradient-to-b from-white/90 via-white/80 to-white/70 backdrop-blur-2xl rounded-3xl border border-white/95 shadow-[0_25px_60px_rgba(255,20,147,0.2),0_1px_2px_rgba(255,255,255,0.95)_inset] p-6 sm:p-8 text-stone-900 relative overflow-hidden ring-1 ring-white/70 animate-in fade-in zoom-in-95 duration-250 cursor-auto"
        >
          {/* Top iOS Specular Edge Highlight & Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 shadow-sm" />

          {/* Hibiscus Inlay Debossed Watermark */}
          <HibiscusInlay size="lg" position="bottom-right" opacity="opacity-[0.065] sm:opacity-[0.08]" />

          {/* Brand Header with Blooming Flower Logo */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100/90 to-rose-100/90 border border-pink-200/90 flex items-center justify-center p-1.5 shadow-[0_4px_16px_rgba(255,20,147,0.25)] shrink-0">
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

          {/* Info Pill */}
          <div className="bg-gradient-to-r from-pink-50/85 to-sky-50/85 backdrop-blur-md border border-white/90 rounded-2xl p-3.5 text-xs text-stone-800 mb-5 flex items-start gap-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
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
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3.5 px-4 bg-white/85 backdrop-blur-md border border-stone-300/80 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-hidden focus:ring-2 focus:ring-pink-500 focus:border-pink-500 shadow-inner transition-all font-bold"
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
