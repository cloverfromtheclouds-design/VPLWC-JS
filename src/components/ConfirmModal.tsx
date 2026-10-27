import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { SummertideFlowerLogo } from './SummertideFlowerLogo';
import { HibiscusInlay } from './HibiscusInlay';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  detailItems?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  detailItems,
  confirmLabel = 'Confirm & Proceed',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-md aero-glass-card rounded-3xl p-5 sm:p-6 text-stone-900 relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Top iOS Specular Edge Highlight & Accent Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 shadow-sm ${
            isDestructive
              ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600'
              : 'bg-gradient-to-r from-pink-500 via-rose-500 to-sky-500'
          }`}
        />

        {/* Hibiscus Inlay Debossed Watermark */}
        <HibiscusInlay size="lg" position="bottom-right" opacity="opacity-[0.065] sm:opacity-[0.08]" />

        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
                isDestructive
                  ? 'bg-rose-100/90 text-rose-700 border border-rose-200'
                  : 'bg-pink-100/90 text-pink-700 border border-pink-200'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-pink-600">
                <SummertideFlowerLogo size="xs" />
                <span>Summertide Studio</span>
              </div>
              <h3 id="modal-headline" className="text-lg font-black text-stone-900 leading-tight mt-0.5">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">{message}</p>

        {detailItems && detailItems.length > 0 && (
          <div className="mt-3.5 max-h-36 overflow-y-auto bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl p-3 text-xs text-stone-700 space-y-1.5 shadow-inner">
            {detailItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0 mt-1.5" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-2xl aero-btn-secondary text-xs sm:text-sm font-bold text-stone-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold text-white transition-all disabled:opacity-50 cursor-pointer ${
              isDestructive
                ? 'aero-btn-rose'
                : 'aero-btn-pink'
            }`}
          >
            {isLoading ? 'Updating...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
