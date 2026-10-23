import React from 'react';

interface HibiscusInlayProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left' | 'center';
  opacity?: string;
  rotation?: string;
}

/**
 * HibiscusInlay
 * Renders a subtle debossed / engraved watermark of the Summertide hibiscus vector logo
 * inside UI boxes. Matches the box color tone but slightly darker with low opacity
 * for an authentic physical inlay appearance.
 */
export const HibiscusInlay: React.FC<HibiscusInlayProps> = ({
  className = '',
  size = 'md',
  position = 'bottom-right',
  opacity = 'opacity-[0.055] sm:opacity-[0.07]',
  rotation = 'rotate-[-12deg]',
}) => {
  const logoUrl = `${import.meta.env.BASE_URL}assets/aistudio/hibiscus-flower-vector-logo_fbb8b643.png`;

  const sizeStyles = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28 sm:w-36 sm:h-36',
    lg: 'w-40 h-40 sm:w-52 sm:h-52',
    xl: 'w-56 h-56 sm:w-72 sm:h-72',
    hero: 'w-72 h-72 sm:w-96 sm:h-96',
  };

  const positionStyles = {
    'bottom-right': '-bottom-6 -right-6 pointer-events-none select-none',
    'top-right': '-top-6 -right-6 pointer-events-none select-none',
    'bottom-left': '-bottom-6 -left-6 pointer-events-none select-none',
    'top-left': '-top-6 -left-6 pointer-events-none select-none',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none',
  };

  const sizeClass = sizeStyles[size] || sizeStyles.md;
  const posClass = positionStyles[position] || positionStyles['bottom-right'];

  return (
    <div
      className={`absolute ${posClass} ${sizeClass} ${opacity} ${rotation} transition-opacity duration-300 pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* 
        Inlay rendering:
        Uses CSS mask with the hibiscus flower logo, filled with a subtle darker tone of the 
        surrounding white surface (stone-900 / slate-900) to create a soft debossed watermark.
      */}
      <div
        className="w-full h-full bg-stone-900/90 mix-blend-multiply"
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
