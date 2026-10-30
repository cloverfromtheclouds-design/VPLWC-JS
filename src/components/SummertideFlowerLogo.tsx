import React from 'react';

interface SummertideFlowerLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  glow?: boolean;
  frutigerPattern?: boolean;
}

export const SummertideFlowerLogo: React.FC<SummertideFlowerLogoProps> = ({
  className = '',
  size = 'md',
  glow = false,
  frutigerPattern = false,
}) => {
  const logoUrl = `${import.meta.env.BASE_URL}assets/aistudio/hibiscus-flower-vector-logo_fbb8b643.png`;

  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16',
    hero: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  const dim = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${dim} ${className}`}
      aria-label="Summertide Studio Flower"
    >
      {/* Frutiger Aero / Aqua Pattern Surrounding the Flower */}
      {frutigerPattern && (
        <div
          className="absolute -inset-2.5 pointer-events-none select-none flex items-center justify-center"
          aria-hidden="true"
        >
          {/* Concentric Caustic Glass Orbit Ring */}
          <div className="absolute inset-0 rounded-full border border-sky-400/40 bg-gradient-to-tr from-cyan-400/15 via-white/25 to-pink-400/20 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),0_3px_10px_rgba(2,132,199,0.18)]" />
          <div className="absolute inset-1 rounded-full border border-white/70 bg-gradient-to-b from-white/40 to-transparent" />

          {/* Top-Half 3D Specular Curved Glass Sheen */}
          <div className="absolute top-0.5 left-2 right-2 h-[42%] rounded-t-full bg-gradient-to-b from-white/85 via-white/35 to-transparent" />

          {/* Orbiting Micro Glass Dew Beads / Aqua Bubbles */}
          <div className="absolute -top-0.5 left-1 w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-cyan-300/70 to-white/95 border border-white shadow-[0_0_4px_rgba(255,255,255,0.9),inset_0_0.5px_1px_#fff]">
            <div className="w-0.5 h-0.5 rounded-full bg-white absolute top-0.5 left-0.5" />
          </div>
          <div className="absolute -bottom-0.5 right-1 w-2 h-2 rounded-full bg-gradient-to-tr from-sky-400/60 via-pink-300/40 to-white/95 border border-white/90 shadow-[0_0_3px_rgba(255,255,255,0.8)]">
            <div className="w-0.5 h-0.5 rounded-full bg-white absolute top-0.5 left-0.5" />
          </div>
          <div className="absolute bottom-2 -left-1 w-1.5 h-1.5 rounded-full bg-white/90 border border-white shadow-2xs" />

          {/* Specular 4-Point Star Glint / Lens Flare at upper-right */}
          <div className="absolute -top-1 -right-0.5 w-3.5 h-3.5 animate-pulse-glow">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-[0_0_4px_rgba(255,255,255,1)]">
              <path
                d="M12 0 C12 6.6 12 6.6 18 12 C12 12 12 17.4 12 24 C12 17.4 12 12 6 12 C12 6.6 12 6.6 12 0 Z"
                fill="url(#frutigerLogoGlintGrad)"
              />
              <defs>
                <linearGradient id="frutigerLogoGlintGrad" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
                </linearGradient>
              </defs>
            </svg>
          </div>

        </div>
      )}

      {/* Diffuse glow (only if explicitly enabled without frutigerPattern) */}
      {glow && !frutigerPattern && (
        <div
          className="absolute inset-0 rounded-full bg-pink-500/30 blur-md scale-125 pointer-events-none"
          aria-hidden="true"
        />
      )}
      {/* Vibrant Pink Hibiscus Flower rendered with CSS masking */}
      <div
        className="w-full h-full bg-gradient-to-tr from-[#ff1493] via-[#ff2d78] to-[#f43f5e] drop-shadow-xs transition-transform"
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
  );
};
