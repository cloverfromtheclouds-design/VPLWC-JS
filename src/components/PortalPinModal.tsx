import React, { useState } from 'react';
import { KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';
import { SummertideFlowerLogo } from './SummertideFlowerLogo';
import { HibiscusInlay } from './HibiscusInlay';

interface PortalPinModalProps {
  isOpen: boolean;
  requiredPin?: string;
  onSuccess: () => void;
}

export const PortalPinModal: React.FC<PortalPinModalProps> = ({
  isOpen,
  requiredPin = '4274',
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === requiredPin.trim()) {
      setError(null);
      onSuccess();
    } else {
      setError('Incorrect access PIN. Please check with your contest administrator for the access code.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-b from-white/85 via-white/75 to-white/65 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(255,20,147,0.16),0_1px_2px_rgba(255,255,255,0.95)_inset] p-6 sm:p-8 text-stone-900 relative overflow-hidden ring-1 ring-white/60">
        {/* Top iOS Specular Edge Highlight & Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 shadow-sm" />

        {/* Hibiscus Inlay Debossed Watermark */}
        <HibiscusInlay size="lg" position="bottom-right" opacity="opacity-[0.065] sm:opacity-[0.08]" />

        {/* Brand Header with Summertide Flower Logo in Vibrant Pink */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-pink-100/90 to-rose-100/90 border border-pink-200/90 flex items-center justify-center p-1 shadow-[0_4px_14px_rgba(255,20,147,0.2)] shrink-0">
            <SummertideFlowerLogo size="lg" glow />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-pink-600 uppercase tracking-wider">
              <SummertideFlowerLogo size="xs" />
              <span>Summertide Studio</span>
            </div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight leading-tight mt-0.5">
              Judge Access Verification
            </h2>
          </div>
        </div>

        {/* Info Pill */}
        <div className="bg-gradient-to-r from-pink-50/80 to-sky-50/80 backdrop-blur-md border border-white/90 rounded-2xl p-3.5 text-xs text-stone-800 mb-5 flex items-start gap-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <ShieldCheck className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-stone-900">Official Evaluation Gate:</span> Enter the 4-digit contest access PIN provided by your producer to unlock the judging portal.
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
                className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3.5 px-4 bg-white/80 backdrop-blur-md border border-stone-300/80 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-hidden focus:ring-2 focus:ring-pink-500 focus:border-pink-500 shadow-inner transition-all font-bold"
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

          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-extrabold text-sm shadow-[0_8px_20px_rgba(255,20,147,0.28)] transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 border border-pink-400/30"
          >
            <KeyRound className="w-4 h-4" />
            <span>Verify & Enter Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between text-[11px] text-stone-400 font-medium">
          <span className="flex items-center gap-1">
            <SummertideFlowerLogo size="xs" />
            <span>Summertide Lyric Contest</span>
          </span>
          <span className="text-pink-600 font-bold">Secure Session</span>
        </div>
      </div>
    </div>
  );
};
