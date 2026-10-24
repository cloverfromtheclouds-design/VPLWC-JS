import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface DiscordHandleRevealProps {
  username?: string | null;
  className?: string;
  size?: 'sm' | 'xs';
}

export const DiscordHandleReveal: React.FC<DiscordHandleRevealProps> = ({
  username,
  className = '',
  size = 'xs',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!username || !username.trim()) return null;

  const cleanHandle = username.trim().replace(/^@/, '');

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setIsRevealed((prev) => !prev);
      }}
      className={`inline-flex items-center gap-1.5 rounded-xl font-medium transition-all duration-150 cursor-pointer select-none border ${
        isRevealed
          ? 'bg-[#5865F2]/10 hover:bg-[#5865F2]/15 text-[#5865F2] border-[#5865F2]/30 shadow-2xs'
          : 'bg-stone-100/90 hover:bg-stone-200/80 text-stone-600 hover:text-stone-900 border-stone-200/80 shadow-2xs'
      } ${size === 'sm' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'} ${className}`}
      title={isRevealed ? 'Click to hide Discord username' : 'Click to reveal Discord username'}
      aria-label={isRevealed ? `Discord username: @${cleanHandle}. Click to hide.` : 'Discord username hidden. Click to reveal.'}
    >
      <MessageCircle
        className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-3 h-3'} ${
          isRevealed ? 'text-[#5865F2]' : 'text-stone-400'
        }`}
      />
      {isRevealed ? (
        <span className="font-mono font-bold">@{cleanHandle}</span>
      ) : (
        <span className="font-sans flex items-center gap-1">
          <span className="font-mono tracking-widest text-[10px] text-stone-400">••••••</span>
          <span className="text-[10px] text-stone-500 font-semibold underline underline-offset-2">
            Click to reveal Discord
          </span>
        </span>
      )}
    </button>
  );
};
