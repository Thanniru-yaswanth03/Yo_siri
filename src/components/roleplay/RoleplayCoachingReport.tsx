'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { RoleplayCoachingReport, RoleplayTurn } from '@/lib/roleplay';
import { AppStorage, StoredSession } from '@/lib/storage';

interface RoleplayCoachingReportProps {
  report: RoleplayCoachingReport;
  turns: RoleplayTurn[];
  durationSeconds: number;
  onRestartScenario: () => void;
  onChooseNewScenario: () => void;
}

export function RoleplayCoachingReportView({
  report,
  turns,
  durationSeconds,
  onRestartScenario,
  onChooseNewScenario,
}: RoleplayCoachingReportProps) {
  const [savedToDb, setSavedToDb] = useState(false);
  const saveAttempted = useRef(false);

  // Automatically save session to IndexedDB upon report rendering
  useEffect(() => {
    if (saveAttempted.current) return;
    saveAttempted.current = true;

    const userTurns = turns.filter((t) => t.role === 'user');
    const userWords = userTurns.reduce((acc, t) => acc + t.content.split(/\s+/).filter(Boolean).length, 0);
    // Average spoken rate ~130 WPM => user spoken seconds
    const userSpokenSeconds = Math.round((userWords / 130) * 60);

    const sessionRecord: StoredSession = {
      id: `session-roleplay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      mode: 'roleplay',
      title: `Roleplay: ${report.scenarioTitle}`,
      startedAt: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds,
      turnsCount: turns.length,
      userSpokenSeconds: Math.max(10, userSpokenSeconds),
      summary: report.coachingSummary,
      turns: userTurns.map((t, idx) => ({
        turnIndex: idx + 1,
        userAnswer: t.content,
        grammarMistakes: report.grammarMistakes,
        fillerWords: report.fillerWordOccurrences,
        relevanceScore: report.overallScore,
        structureScore: report.objectiveAchieved ? 90 : 75,
      })),
      metadata: {
        scenarioId: report.scenarioId,
        persona: report.aiPersona,
        overallScore: report.overallScore,
        objectiveAchieved: report.objectiveAchieved,
      },
    };

    AppStorage.saveSession(sessionRecord)
      .then(() => setSavedToDb(true))
      .catch((err) => console.error('Failed to save roleplay session to IndexedDB:', err));
  }, [report, turns, durationSeconds]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                Scenario Concluded
              </span>
              <span className="text-xs text-slate-400">
                Persona: {report.aiPersona}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight mt-1">
              {report.scenarioTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Score */}
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-violet-400 font-mono">
                {report.overallScore}/100
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Performance Rating
              </span>
            </div>

            {/* Objective Status Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                report.objectiveAchieved
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
              }`}
            >
              {report.objectiveAchieved ? '✓ Objective Achieved' : 'Partial Completion'}
            </div>
          </div>
        </div>

        {/* Executive Coaching Summary */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Coaching Summary
          </span>
          <p className="text-sm text-slate-200 leading-relaxed">
            {report.coachingSummary}
          </p>
        </div>

        {/* Storage Persistence Confirmation */}
        {savedToDb && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1">
            <span>✓</span>
            <span>Session and performance metrics permanently saved to IndexedDB storage.</span>
          </div>
        )}
      </div>

      {/* Strengths & Growth Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
            <span>✨</span> Key Strengths Exhibited
          </h3>
          <ul className="space-y-2 text-xs text-slate-200">
            {report.keyStrengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span className="leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Opportunities */}
        <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
            <span>🎯</span> Opportunities for Polish
          </h3>
          <ul className="space-y-2 text-xs text-slate-200">
            {report.growthOpportunities.map((opp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold shrink-0">•</span>
                <span className="leading-relaxed">{opp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Diplomacy, Tone, and Interpersonal Presence */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Diplomacy, Posture & Tone Analysis
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          {report.diplomacyAndToneNotes}
        </p>
      </div>

      {/* Grammar Corrections & Filler-Word Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Grammar Corrections */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              Grammar & Structure Slips
            </span>
            <span className="text-slate-500 font-mono">
              {report.grammarMistakes.length} detected
            </span>
          </div>

          {report.grammarMistakes.length === 0 ? (
            <p className="text-xs text-emerald-400 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
              No grammatical slips detected during this roleplay dialogue.
            </p>
          ) : (
            <div className="space-y-2">
              {report.grammarMistakes.map((m, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-rose-400 line-through">&ldquo;{m.original}&rdquo;</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400 font-medium">&ldquo;{m.corrected}&rdquo;</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{m.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filler Words */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              Filler-Word Occurrences
            </span>
            <span className="text-slate-500 font-mono">
              {report.fillerWordOccurrences.reduce((a, b) => a + b.count, 0)} total
            </span>
          </div>

          {report.fillerWordOccurrences.length === 0 ? (
            <p className="text-xs text-emerald-400 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
              Zero verbal fillers detected. High vocal presence!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {report.fillerWordOccurrences.map((f, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                >
                  &ldquo;{f.word}&rdquo; × {f.count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Conversational Anchors */}
      {report.recommendedNextPhrases.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-950/30 to-slate-900 border border-violet-800/40 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-violet-300">
            Recommended Phrases for Future Scenarios
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {report.recommendedNextPhrases.map((rec, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950/80 border border-violet-900/30 space-y-1">
                <div className="text-xs font-semibold text-slate-100">
                  &ldquo;{rec.phrase}&rdquo;
                </div>
                <div className="text-[11px] text-slate-400">
                  {rec.context}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <Link
          href="/progress"
          className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
        >
          ← View All Saved Sessions in Progress Reports
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRestartScenario}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Replay This Scenario
          </button>
          <button
            type="button"
            onClick={onChooseNewScenario}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30 transition-colors"
          >
            Choose Next Scenario →
          </button>
        </div>
      </div>
    </div>
  );
}
