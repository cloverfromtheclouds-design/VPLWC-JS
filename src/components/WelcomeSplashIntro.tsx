import React, { useState, useEffect } from 'react';
import { SummertideFlowerLogo } from './SummertideFlowerLogo';
import { HibiscusInlay } from './HibiscusInlay';


interface WelcomeSplashIntroProps {
  judgeName?: string;
  onFinish: () => void;
}

export const WelcomeSplashIntro: React.FC<WelcomeSplashIntroProps> = ({
  judgeName = '',
  onFinish,
}) => {
  const [stage, setStage] = useState<'bloom' | 'fade-out'>('bloom');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('fade-out');
      setTimeout(() => {
        onFinish();
      }, 350);
    }, 1150);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const handleDismiss = () => {
    setStage('fade-out');
    setTimeout(() => {
      onFinish();
    }, 200);
  };

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xl transition-opacity duration-350 cursor-pointer select-none ${
        stage === 'fade-out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient Tropical Pink Illumination in Background */}
      <div className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-pink-500/25 blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Decorative Inlays */}
      <HibiscusInlay size="xl" position="bottom-right" opacity="opacity-[0.06]" />
      <HibiscusInlay size="xl" position="top-left" opacity="opacity-[0.05]" />

      <div className="flex flex-col items-center justify-center text-center z-10 animate-flower-popup">
        <div className="relative">
          {/* Luminous aura */}
          <div className="absolute inset-0 rounded-full bg-pink-500/35 blur-2xl scale-125 pointer-events-none" />
          <div className="animate-flower-float relative">
            <SummertideFlowerLogo
              size="hero"
              glow
              className="drop-shadow-[0_20px_45px_rgba(255,20,147,0.55)]"
            />
          </div>
        </div>

        <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-pink-400">
            Summertide Studio
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
            Lyric Contest Judging Portal
          </h1>
          {judgeName ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/30 text-xs font-bold mt-1 shadow-sm">
              <span>Welcome back,</span>
              <strong className="text-white font-extrabold">{judgeName}</strong>
            </div>
          ) : (
            <p className="text-xs text-stone-300 font-medium">
              Click anywhere to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
