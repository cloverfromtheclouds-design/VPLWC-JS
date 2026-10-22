import React, { useState } from 'react';
import { KeyRound, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

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
  const logoUrl = `${import.meta.env.BASE_URL}assets/aistudio/hibiscus-flower-vector-logo_fbb8b643.png`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-6 sm:p-8 text-stone-900 relative overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-sky-500" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 border border-pink-200/90 flex items-center justify-center p-1.5 shadow-xs shrink-0">
            <div
              className="w-8 h-8 bg-gradient-to-tr from-[#ec4899] via-[#f43f5e] to-[#fb7185]"
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
            <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>Summertide Studio</span>
            </div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight leading-tight">
              Judge Access Verification
            </h2>
          </div>
        </div>

        <div className="bg-sky-50/70 backdrop-blur-xs border border-sky-200/70 rounded-2xl p-3.5 text-xs text-sky-950 mb-5 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Authorized Judging Access:</span> Please enter the 4-digit contest access PIN provided by your administrator to enter the evaluation portal.
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
                className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3.5 px-4 bg-white/70 backdrop-blur-xs border border-stone-300/80 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7] focus:border-transparent shadow-inner transition-all font-bold"
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
            className="w-full py-3.5 px-4 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-md transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Verify & Enter Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center text-[11px] text-stone-500 font-medium">
          Summertide Lyric Contest Official Scoring System · Secure Session
        </div>
      </div>
    </div>
  );
};
