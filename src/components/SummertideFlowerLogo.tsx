import React from 'react';

interface SummertideFlowerLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  glow?: boolean;
}

export const SummertideFlowerLogo: React.FC<SummertideFlowerLogoProps> = ({
  className = '',
  size = 'md',
  glow = false,
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
      {glow && (
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
