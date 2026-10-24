import React, { useState } from 'react';
import { SummertideFlowerLogo } from './SummertideFlowerLogo';
import { HibiscusInlay } from './HibiscusInlay';
import { ArrowRight } from 'lucide-react';

interface WelcomeSplashIntroProps {
  judgeName?: string;
  onFinish: () => void;
}

export const WelcomeSplashIntro: React.FC<WelcomeSplashIntroProps> = ({
  judgeName = '',
  onFinish,
}) => {
  const [stage, setStage] = useState<'bloom' | 'fade-out'>('bloom');

  const handleDismiss = () => {
    setStage('fade-out');
    setTimeout(() => {
      onFinish();
    }, 250);
  };

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-b from-[#2e071f] via-[#480d34] to-[#200417] transition-opacity duration-300 cursor-pointer select-none overflow-hidden ${
        stage === 'fade-out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Luminous Tropical Pink Ambient Radial Radiance - pure CSS, zero backdrop-filter lag */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,20,147,0.32)_0%,rgba(219,39,119,0.15)_45%,transparent_75%)] pointer-events-none" />

      {/* Decorative Inlays */}
      <HibiscusInlay size="xl" position="bottom-right" opacity="opacity-[0.09]" />
      <HibiscusInlay size="xl" position="top-left" opacity="opacity-[0.07]" />

      <div className="flex flex-col items-center justify-center text-center z-10 max-w-lg px-4 animate-flower-popup">
        <div className="relative">
          {/* Luminous aura */}
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
            Lyric Contest Judging Portal
          </h1>
          {judgeName ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pink-500/25 text-pink-100 border border-pink-400/35 text-xs font-bold mt-2 shadow-sm">
              <span>Welcome back,</span>
              <strong className="text-white font-extrabold">{judgeName}</strong>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-pink-100/80 font-medium tracking-wide">
              Official judge evaluation & producer scoring desk
            </p>
          )}

          <div className="mt-7 pt-2 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs sm:text-sm shadow-[0_8px_25px_rgba(255,20,147,0.5)] transition-all cursor-pointer animate-pulse border border-pink-400/40"
            >
              <span>Click anywhere to continue</span>
              <ArrowRight className="w-4 h-4 text-pink-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
