import React, { useState, useEffect } from 'react';
import { User, X, Check, Sparkles } from 'lucide-react';

interface JudgeNameModalProps {
  isOpen: boolean;
  currentName: string;
  isInitialRequired?: boolean;
  onSave: (name: string) => void;
  onClose?: () => void;
}

export const JudgeNameModal: React.FC<JudgeNameModalProps> = ({
  isOpen,
  currentName,
  isInitialRequired = false,
  onSave,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNameInput(currentName);
      setError(null);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError('Please enter your judge name or alias to proceed.');
      return;
    }
    if (trimmed.length > 50) {
      setError('Judge name cannot exceed 50 characters.');
      return;
    }
    setError(null);
    onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-6 sm:p-8 text-stone-900 relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-rose-500 to-pink-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700 flex items-center justify-center shadow-xs shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>Summertide Studio</span>
              </div>
              <h3 className="text-xl font-extrabold text-stone-900 tracking-tight mt-0.5">
                {isInitialRequired ? 'Welcome, Contest Judge!' : 'Edit Your Judge Name'}
              </h3>
            </div>
          </div>

          {!isInitialRequired && onClose && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Explanation */}
        <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
          {isInitialRequired ? (
            <>
              Please enter your <strong>Judge Name</strong> or handle. This name will automatically appear on your scorecards and track your progress through the song queue. We will remember it so you don&apos;t have to enter it again!
            </>
          ) : (
            <>
              Update the judge name used for your upcoming scorecards and song grading progress. You can change this at any time.
            </>
          )}
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="judge-name-input" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Judge Name / Pseudonym <span className="text-pink-600">*</span>
            </label>
            <div className="relative">
              <input
                id="judge-name-input"
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Judge Mel, Alex, Aria"
                className="w-full py-3 px-4 text-base font-semibold text-stone-900 bg-stone-50 border border-stone-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-hidden transition-all shadow-inner"
              />
            </div>
            {error && (
              <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                {error}
              </p>
            )}
            <p className="text-[11px] text-stone-400 mt-1.5">
              Saved locally in your browser. You can edit this anytime from the top bar.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {!isInitialRequired && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-stone-200 text-stone-600 hover:text-stone-800 hover:bg-stone-50 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold text-xs rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isInitialRequired ? 'Save & Start Judging' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
