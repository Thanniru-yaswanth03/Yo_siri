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
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#244C3B] dark:text-[#E2F0E6]">
              Communication Weakness Radar
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] font-semibold">
              {activePatterns.length} active recurring pattern(s)
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Evidence-backed observations recorded from actual user speech across practice sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDismissed(!showDismissed)}
            className={`min-h-[36px] text-xs px-3 py-1.5 rounded-xl border transition-colors ${
              showDismissed
                ? 'bg-[#FBF0EC] text-[#D87558] border-[#D87558]/40 dark:bg-[#3D2924] dark:text-[#EDA089]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            {showDismissed ? 'Viewing Dismissed' : `View Dismissed (${dismissedPatterns.length})`}
          </button>
        </div>
      </div>

      {/* Recommended Adaptive Drills based on Active Weaknesses */}
      {!showDismissed && adaptiveDrills.length > 0 && onSelectAdaptiveDrill && (
        <div className="p-5 rounded-2xl bg-[#E8EFE9]/60 dark:bg-[#25382B]/40 border border-[#78947B]/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#244C3B] dark:text-[#E2F0E6] flex items-center gap-2">
              <span>🎯</span> Priority Recommended Drill
            </h3>
            <span className="text-[11px] text-[var(--text-muted)]">
              Targeted to your most frequent pattern
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adaptiveDrills.map((drill) => (
              <div
                key={drill.id}
                className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#244C3B] transition-all space-y-2 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">{drill.title}</span>
                    {drill.timerSeconds && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] font-mono font-bold">
                        {drill.timerSeconds}s
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {drill.instruction}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAdaptiveDrill(drill)}
                  className="w-full min-h-[40px] text-center py-2 px-3 rounded-xl text-xs font-medium bg-[#244C3B] hover:bg-[#1B3B2E] dark:bg-[#467D60] text-white transition-colors flex items-center justify-center gap-1"
                >
                  <span>Start This Targeted Drill</span>
                  <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns List with Evidence Inspection */}
      {displayedPatterns.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2">
          <span className="text-2xl">🌱</span>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {showDismissed
              ? 'No dismissed classifications.'
              : 'Not enough practice data yet. Complete a few speaking sessions to build your profile.'}
          </p>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Yo Siri analyzes each spoken answer and identifies patterns with verbatim speech evidence.
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
                  ? 'bg-[var(--bg-elevated)]/60 border-[var(--border-subtle)] opacity-60'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[#78947B]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{pattern.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                      Frequency: {pattern.frequency}×
                    </span>
                    {pattern.isDismissed && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FBF0EC] text-[#D87558] border border-[#D87558]/30">
                        Dismissed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{pattern.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {pattern.isDismissed ? (
                    <button
                      type="button"
                      onClick={(e) => handleRestore(pattern.id, e)}
                      className="min-h-[36px] text-xs px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)]"
                    >
                      Restore Finding
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleDismiss(pattern.id, e)}
                      className="min-h-[36px] text-xs px-3 py-1.5 rounded-xl border border-[#D87558]/30 text-[#D87558] hover:bg-[#FBF0EC] dark:hover:bg-[#3D2924] transition-colors"
                      title="Dismiss this finding if incorrect"
                    >
                      Dismiss Finding
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Evidence Details */}
              {selectedPatternForDetails?.id === pattern.id && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                  <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Verbatim Transcript Evidence ({pattern.evidence.length} samples):
                  </div>
                  <div className="space-y-1.5">
                    {pattern.evidence.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs space-y-0.5"
                      >
                        <div className="font-mono text-[#D87558]">&ldquo;{ev.verbatimExcerpt}&rdquo;</div>
                        {ev.contextSentence && (
                          <div className="text-[11px] text-[var(--text-secondary)]">
                            {ev.contextSentence}
                          </div>
                        )}
                        <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-0.5">
                          <span>Session: {ev.sessionRef}</span>
                          <span>{new Date(ev.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
