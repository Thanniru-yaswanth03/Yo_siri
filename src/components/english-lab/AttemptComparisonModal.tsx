'use client';

import React from 'react';
import { RetryComparison } from '@/lib/english-lab';
import { RotateCcwIcon } from '@/components/icons';

interface AttemptComparisonModalProps {
  question: string;
  comparison: RetryComparison;
  onClose: () => void;
  onRetryAgain?: () => void;
}

export function AttemptComparisonModal({
  question,
  comparison,
  onClose,
  onRetryAgain,
}: AttemptComparisonModalProps) {
  const { attempt1, attempt2, improvements, remainingGaps, coachingSummary } = comparison;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                Retry Loop Comparison
              </span>
              <span className="text-xs text-slate-400">Attempt 1 vs Attempt 2</span>
            </div>
            <h2 className="text-base font-semibold text-slate-100 mt-1">
              &ldquo;{question}&rdquo;
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Side-by-Side Attempt Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Attempt 1 */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Attempt 1 (Original)
              </span>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                <span>{attempt1.wordCount} words</span>
                <span>•</span>
                <span>{attempt1.fillerCount} fillers</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans min-h-[90px]">
              &ldquo;{attempt1.answer}&rdquo;
            </div>
          </div>

          {/* Attempt 2 */}
          <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-800/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-violet-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Attempt 2 (Retry)
              </span>
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                <span>{attempt2.wordCount} words</span>
                <span>•</span>
                <span>{attempt2.fillerCount} fillers</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-violet-700/30 text-xs text-slate-100 leading-relaxed font-medium min-h-[90px]">
              &ldquo;{attempt2.answer}&rdquo;
            </div>
          </div>
        </div>

        {/* Highlighted Improvements */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
            <span>✨</span> Specific Changes & Improvements
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-200">
            {improvements.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Remaining Gaps (if any) */}
        {remainingGaps && remainingGaps.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Remaining Polish Areas
            </h3>
            <ul className="space-y-1 text-xs text-slate-400">
              {remainingGaps.map((gap, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Coaching Takeaway & Learning Profile Update */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-violet-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-violet-300">Learning Profile Impact</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Profile Updated with New Evidence
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{coachingSummary}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onRetryAgain && (
            <button
              type="button"
              onClick={onRetryAgain}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcwIcon size={14} />
              Attempt Another Retry
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30 transition-colors"
          >
            Done with Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
