'use client';

import React, { useState } from 'react';
import { LabTurnEvaluation } from '@/lib/english-lab';
import { Volume2Icon, RotateCcwIcon } from '@/components/icons';
import { speechSynthesizer } from '@/lib/voice';

interface LabFeedbackCardProps {
  evaluation: LabTurnEvaluation;
  onRetryQuestion: (question: string, attempt1: string) => void;
  isRetrying?: boolean;
}

export function LabFeedbackCard({
  evaluation,
  onRetryQuestion,
  isRetrying = false,
}: LabFeedbackCardProps) {
  const [copied, setCopied] = useState(false);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  const handleCopyCorrected = () => {
    navigator.clipboard.writeText(evaluation.correctedVersion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakText = (text: string) => {
    if (speechSynthesizer.isSpeaking()) {
      speechSynthesizer.cancel();
    } else {
      speechSynthesizer.speak(text);
    }
  };

  const handleCheckPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!practiceInput.trim()) return;
    setPracticeFeedback(
      `Great effort! You applied "${evaluation.shortPracticeExercise.targetFocus}". Now speak it aloud or click "Retry Question" to practice the full response!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Question Context */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {evaluation.drillCategory.replace('-', ' ')}
            </span>
            <span className="text-xs text-slate-400">Drill Feedback & Diagnostics</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">
            &ldquo;{evaluation.question}&rdquo;
          </p>
        </div>

        {/* Retry Button */}
        <button
          type="button"
          onClick={() => onRetryQuestion(evaluation.question, evaluation.originalAnswer)}
          disabled={isRetrying}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30 transition-all disabled:opacity-50"
        >
          <RotateCcwIcon size={14} />
          {isRetrying ? 'Retry in Progress...' : 'Retry This Question (Attempt 2)'}
        </button>
      </div>

      {/* 1. ORIGINAL ANSWER vs 2. CORRECTED VERSION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item 1: Original Answer */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              1. Original Answer
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {evaluation.concisenessMetrics?.wordCount || 0} words
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm text-slate-300 leading-relaxed font-sans min-h-[90px]">
            &ldquo;{evaluation.originalAnswer}&rdquo;
          </div>
        </div>

        {/* Item 2: Corrected Version */}
        <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-violet-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              2. Corrected Version
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Meaning Preserved
              </span>
              <button
                type="button"
                onClick={handleCopyCorrected}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-violet-800/30 text-sm text-slate-100 leading-relaxed font-medium min-h-[90px] flex flex-col justify-between">
            <p>&ldquo;{evaluation.correctedVersion}&rdquo;</p>
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSpeakText(evaluation.correctedVersion)}
                className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                title="Speak corrected sentence"
              >
                <Volume2Icon size={13} />
                Listen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN MISTAKES */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            3. Main Mistakes & Corrections
          </h3>
          <span className="text-xs text-slate-400">
            {evaluation.mainMistakes.length === 0
              ? 'Zero grammatical errors detected'
              : `${evaluation.mainMistakes.length} area(s) diagnosed`}
          </span>
        </div>

        {evaluation.mainMistakes.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 flex items-center gap-2">
            <span className="text-base">✓</span>
            Clean grammatical structure. Your original sentences are grammatically accurate.
          </div>
        ) : (
          <div className="space-y-2.5">
            {evaluation.mainMistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-900/50 line-through">
                    {mistake.originalSegment}
                  </span>
                  <span className="text-slate-500">→</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-900/50 font-medium">
                    {mistake.correctedSegment}
                  </span>
                  {mistake.isStylisticPreference && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 ml-auto">
                      Stylistic Preference (Not Grammar Error)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{mistake.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. CLEAR EXPLANATION & 5. MORE NATURAL ALTERNATIVE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item 4: Clear Explanation */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            4. Clear Explanation & Rule
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            {evaluation.clearExplanation}
          </p>
        </div>

        {/* Item 5: More Natural Alternative */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400"></span>
              5. More Natural Alternative
            </span>
            <button
              type="button"
              onClick={() => handleSpeakText(evaluation.naturalAlternative)}
              className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 lowercase font-medium"
            >
              <Volume2Icon size={12} />
              listen
            </button>
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed p-3.5 rounded-xl bg-violet-950/20 border border-violet-900/30 italic">
            &ldquo;{evaluation.naturalAlternative}&rdquo;
          </p>
        </div>
      </div>

      {/* 6. SHORT PRACTICE EXERCISE */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            6. Short Practice Exercise
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Focus: {evaluation.shortPracticeExercise.targetFocus}
          </span>
        </div>

        <p className="text-xs text-slate-200 font-medium">
          {evaluation.shortPracticeExercise.prompt}
        </p>

        {evaluation.shortPracticeExercise.hint && (
          <p className="text-[11px] text-slate-400 italic">
            💡 Hint: {evaluation.shortPracticeExercise.hint}
          </p>
        )}

        <form onSubmit={handleCheckPractice} className="flex gap-2 pt-1">
          <input
            type="text"
            value={practiceInput}
            onChange={(e) => setPracticeInput(e.target.value)}
            placeholder="Type your quick practice sentence here..."
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Check
          </button>
        </form>

        {practiceFeedback && (
          <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/40 text-xs text-indigo-200">
            {practiceFeedback}
          </div>
        )}
      </div>

      {/* DIAGNOSTIC METRICS: FILLER WORDS & VOCABULARY UPGRADES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Filler Word Analysis */}
        {evaluation.fillerWordAnalysis && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Transcript Filler-Word Evidence</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  evaluation.fillerWordAnalysis.totalFillers === 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {evaluation.fillerWordAnalysis.totalFillers} total filler(s)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {evaluation.fillerWordAnalysis.advice}
            </p>
            {evaluation.fillerWordAnalysis.fillers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {evaluation.fillerWordAnalysis.fillers.map((f, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                  >
                    &ldquo;{f.word}&rdquo; × {f.count}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vocabulary Upgrades */}
        {evaluation.vocabularyUpgrades && evaluation.vocabularyUpgrades.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Vocabulary Upgrades</span>
              <span className="text-[11px] text-violet-400">Professional impact</span>
            </div>
            <div className="space-y-1.5">
              {evaluation.vocabularyUpgrades.map((vocab, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/70 border border-slate-800/80"
                >
                  <span className="text-slate-400 line-through">&ldquo;{vocab.originalWord}&rdquo;</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-emerald-400 font-semibold">&ldquo;{vocab.upgradeWord}&rdquo;</span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {vocab.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
