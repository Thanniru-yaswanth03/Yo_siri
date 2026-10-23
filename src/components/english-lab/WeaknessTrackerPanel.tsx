'use client';

import React, { useState } from 'react';
import {
  PersonalWeaknessTracker,
  WeaknessPattern,
  AdaptiveDrill,
} from '@/lib/english-lab';

interface WeaknessTrackerPanelProps {
  onSelectAdaptiveDrill?: (drill: AdaptiveDrill) => void;
}

export function WeaknessTrackerPanel({ onSelectAdaptiveDrill }: WeaknessTrackerPanelProps) {
  const [patterns, setPatterns] = useState<WeaknessPattern[]>(() =>
    PersonalWeaknessTracker.getStoredPatterns()
  );
  const [showDismissed, setShowDismissed] = useState(false);
  const [adaptiveDrills, setAdaptiveDrills] = useState<AdaptiveDrill[]>(() =>
    PersonalWeaknessTracker.generateAdaptiveDrills()
  );
  const [selectedPatternForDetails, setSelectedPatternForDetails] = useState<WeaknessPattern | null>(
    null
  );

  const refreshPatterns = () => {
    const stored = PersonalWeaknessTracker.getStoredPatterns();
    setPatterns(stored);
    setAdaptiveDrills(PersonalWeaknessTracker.generateAdaptiveDrills());
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    PersonalWeaknessTracker.dismissPattern(id);
    refreshPatterns();
  };

  const handleRestore = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    PersonalWeaknessTracker.restorePattern(id);
    refreshPatterns();
  };

  const activePatterns = patterns.filter((p) => !p.isDismissed);
  const dismissedPatterns = patterns.filter((p) => p.isDismissed);
  const displayedPatterns = showDismissed ? dismissedPatterns : activePatterns;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Personal Weakness Tracker
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {activePatterns.length} active recurring pattern(s)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Auditable speech evidence recorded across your sessions. Distinguishes actual transcript tokens from AI suggestions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDismissed(!showDismissed)}
            className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${
              showDismissed
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {showDismissed ? 'Viewing Dismissed' : `View Dismissed (${dismissedPatterns.length})`}
          </button>
        </div>
      </div>

      {/* Recommended Adaptive Drills based on Active Weaknesses */}
      {!showDismissed && adaptiveDrills.length > 0 && onSelectAdaptiveDrill && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/30 via-slate-900/60 to-slate-900/90 border border-violet-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-2">
              <span>🎯</span> Adaptive Targeted Exercises
            </h3>
            <span className="text-[11px] text-slate-400">
              Generated from your active weaknesses
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adaptiveDrills.map((drill) => (
              <div
                key={drill.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-violet-900/40 hover:border-violet-600 transition-all space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-violet-200">{drill.title}</span>
                    {drill.timerSeconds && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">
                        {drill.timerSeconds}s
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {drill.instruction}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAdaptiveDrill(drill)}
                  className="w-full text-center py-1.5 px-3 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                >
                  Start This Targeted Drill →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns List */}
      {displayedPatterns.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
          <span className="text-2xl">🌱</span>
          <p className="text-sm font-semibold text-slate-300">
            {showDismissed
              ? 'No dismissed classifications.'
              : 'No recurring weaknesses recorded yet! Complete drills to build your personal learning profile.'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Yo Siri analyzes each spoken answer and identifies patterns like tense shifts, prepositions, or fillers with verifiable evidence.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedPatterns.map((pattern) => (
            <div
              key={pattern.id}
              onClick={() =>
                setSelectedPatternForDetails(
                  selectedPatternForDetails?.id === pattern.id ? null : pattern
                )
              }
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                pattern.isDismissed
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{pattern.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Frequency: {pattern.frequency}×
                    </span>
                    {pattern.resolvedAt && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Resolved in Retry
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{pattern.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {pattern.isDismissed ? (
                    <button
                      type="button"
                      onClick={(e) => handleRestore(pattern.id, e)}
                      className="text-xs px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      Restore Classification
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleDismiss(pattern.id, e)}
                      className="text-xs px-3 py-1 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-900/30 transition-colors"
                      title="Dismiss if you feel this classification is incorrect or stylistic"
                    >
                      Dismiss Classification
                    </button>
                  )}
                </div>
              </div>

              {/* Latest Verbatim Transcript Evidence Preview */}
              {pattern.evidence && pattern.evidence.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Latest Evidence Behind This Pattern:</span>
                    <span className="text-[10px]">
                      {selectedPatternForDetails?.id === pattern.id
                        ? 'Click to collapse history'
                        : `View ${pattern.evidence.length} evidence point(s) ▼`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          pattern.evidence[0].sourceType === 'transcript'
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                            : 'bg-violet-950/80 text-violet-300 border border-violet-800/60'
                        }`}
                      >
                        {pattern.evidence[0].sourceType === 'transcript'
                          ? 'Transcript Token'
                          : 'AI Suggestion'}
                      </span>
                      <span className="truncate italic font-mono text-[11px] text-slate-200">
                        &ldquo;{pattern.evidence[0].verbatimExcerpt}&rdquo;
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      Session: {pattern.evidence[0].sessionRef.slice(-6)}
                    </span>
                  </div>

                  {/* Expanded Evidence History */}
                  {selectedPatternForDetails?.id === pattern.id && pattern.evidence.length > 1 && (
                    <div className="space-y-1.5 pt-1 pl-2 border-l border-slate-800">
                      {pattern.evidence.slice(1).map((ev, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/60 text-xs text-slate-400 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[9px] text-slate-500 font-mono">
                              {ev.sourceType}
                            </span>
                            <span className="truncate italic font-mono text-[11px] text-slate-300">
                              &ldquo;{ev.verbatimExcerpt}&rdquo;
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-600 font-mono">
                            {new Date(ev.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
