"use client";

import { forwardRef } from "react";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  placeholder?: string;
}

const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(
  ({ value, onChange, onSubmit, loading = false, placeholder }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    };

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0DB] overflow-hidden">
        {/* Pantry-aware label */}
        <div className="px-4 pt-3 pb-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
            </svg>
            Pantry-aware suggestions
          </span>
        </div>

        {/* Textarea */}
        <div className="relative px-4 pb-3">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "What are you in the mood for today?"}
            rows={3}
            disabled={loading}
            className="w-full pr-14 text-[#1F1F1F] placeholder-[#B5ADA6] bg-transparent resize-none focus:outline-none text-base leading-relaxed"
          />

          {/* Send button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim() || loading}
            className="absolute right-4 bottom-3 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#E54D2E] to-[#D13415] text-white shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-press"
          >
            {loading ? (
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Microcopy */}
        <div className="px-4 pb-3 pt-1 border-t border-[#F5F0ED]">
          <p className="text-xs text-[#B5ADA6]">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    );
  }
);

Composer.displayName = "Composer";

export default Composer;
