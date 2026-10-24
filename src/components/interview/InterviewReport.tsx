'use client';

import React, { useState } from 'react';
import { InterviewSessionReport } from '@/lib/interview';
import {
  CheckIcon,
  RotateCcwIcon,
  SparklesIcon,
  AlertCircleIcon,
  TargetIcon,
} from '@/components/icons';

interface InterviewReportProps {
  report: InterviewSessionReport;
  onRetake: () => void;
  onNewInterview: () => void;
}

export function InterviewReport({ report, onRetake, onNewInterview }: InterviewReportProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTurnTab, setActiveTurnTab] = useState<number>(0);

  const { config, scores, turns, durationMinutes, totalQuestions } = report;

  const handleCopyReport = () => {
    try {
      const summaryText = `YO SIRI — MOCK INTERVIEW EVALUATION REPORT
Track: ${config.category.toUpperCase()} | Role: ${config.targetRole}
Difficulty: ${config.difficulty} | Persona: ${config.interviewerPersona}
Duration: ${durationMinutes} min | Questions Answered: ${totalQuestions}

TRANSPARENT COACHING SCORES (1-10):
- Overall Coaching Score: ${scores.overallScore}/100
- Relevance: ${scores.relevance}/10
- Completeness: ${scores.completeness}/10
- Spoken Clarity: ${scores.clarity}/10
- Logical Structure: ${scores.logicalStructure}/10
- Grammar Precision: ${scores.grammar}/10
- Professional Vocabulary: ${scores.vocabulary}/10
- Conciseness & Cadence: ${scores.conciseness}/10
${scores.technicalCorrectness ? `- Technical Accuracy: ${scores.technicalCorrectness}/10\n` : ''}

KEY STRENGTHS:
${report.keyStrengths.map((s) => `• ${s}`).join('\n')}

TOP IMPROVEMENT AREAS:
${report.topImprovementAreas.map((a) => `• ${a}`).join('\n')}

TURN-BY-TURN REVIEW:
${turns
  .map(
    (t, idx) => `
[Question ${idx + 1}]: ${t.question}
Original Answer: ${t.originalAnswer}
Key Weaknesses: ${t.keyWeaknesses.join('; ')}
Explanation: ${t.explanation}
Improved Model Answer: ${t.improvedAnswer}
Suggested Drill: ${t.suggestedFollowUpExercise}
`
  )
  .join('\n')}
`;

      navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // ignore
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40';
    if (score >= 6.0) return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40';
    if (score >= 4.0) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40';
    return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40';
  };

  const activeTurn = turns[activeTurnTab] || turns[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Report Header */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
              <CheckIcon size={14} />
              <span>Interview Session Completed</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">
              {config.category} Mock Interview Evaluation
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Target Role: <strong className="text-slate-800 dark:text-slate-200">{config.targetRole}</strong> • Level: {config.difficulty} • Duration: {durationMinutes} min • {totalQuestions} Questions Evaluated
            </p>
          </div>

          {/* Overall Composite Score Badge */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Coaching Score
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {scores.overallScore}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <SparklesIcon size={24} />
            </div>
          </div>
        </div>

        {/* Transparent Coaching Policy Alert */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
          <AlertCircleIcon size={16} className="text-indigo-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-900 dark:text-white block font-semibold mb-0.5">
              Transparent Coaching Benchmark Policy
            </strong>
            These ratings evaluate spoken articulation, logical flow, conciseness, and structural completeness.
            They are transparent educational coaching metrics, not automated or fabricated predictions of real-world hiring decisions.
          </div>
        </div>
      </div>

      {/* Transparent Metrics Grid */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Core Communication & Structure Dimensions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Relevance', score: scores.relevance, desc: 'Direct prompt alignment' },
            { label: 'Completeness', score: scores.completeness, desc: 'Coverage of key points' },
            { label: 'Spoken Clarity', score: scores.clarity, desc: 'Ease of comprehension' },
            { label: 'Logical Structure', score: scores.logicalStructure, desc: 'Beginning, middle & end' },
            { label: 'Grammar Precision', score: scores.grammar, desc: 'Syntax and tenses' },
            { label: 'Vocabulary Choice', score: scores.vocabulary, desc: 'Professional terminology' },
            { label: 'Conciseness', score: scores.conciseness, desc: 'Cadence without fluff' },
            ...(scores.technicalCorrectness
              ? [{ label: 'Technical Depth', score: scores.technicalCorrectness, desc: 'Conceptual rigor' }]
              : []),
          ].map((m) => (
            <div
              key={m.label}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {m.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{m.desc}</div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${getScoreColor(
                    m.score
                  )}`}
                >
                  {m.score}/10
                </span>
                <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${m.score * 10}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Strengths & Improvement Areas */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <CheckIcon size={16} />
            <span>Demonstrated Strengths</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {report.keyStrengths.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <AlertCircleIcon size={16} />
            <span>Target Improvement Areas</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {report.topImprovementAreas.map((a, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Turn-by-Turn Deep Dive */}
      {turns.length > 0 && (
        <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Turn-by-Turn Detailed Evaluation
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Review your original verbatim answer, identified weaknesses, and improved exemplar response.
              </p>
            </div>

            {/* Question Selector Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {turns.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTurnTab(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    activeTurnTab === idx
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  Q{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {activeTurn && (
            <div className="space-y-5 pt-2 animate-in fade-in duration-200">
              {/* Question */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  Interviewer Question #{activeTurnTab + 1}:
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {activeTurn.question}
                </p>
              </div>

              {/* Candidate Original Answer (Preserved verbatim) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Your Original Recorded Answer (Verbatim):
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {activeTurn.originalAnswer.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal bg-white dark:bg-[#0B1120] p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                  &ldquo;{activeTurn.originalAnswer}&rdquo;
                </p>
              </div>

              {/* STAR Method Analysis (If available) */}
              {activeTurn.starAnalysis && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <TargetIcon size={14} className="text-indigo-500" />
                      STAR Framework Breakdown (Situation, Task, Action, Result)
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${
                        activeTurn.starAnalysis.adherenceLevel === 'strong'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {activeTurn.starAnalysis.adherenceLevel} adherence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200/60 dark:border-slate-800/60">
                      <strong className="text-indigo-600 dark:text-indigo-400 block text-[11px]">
                        Situation (Context):
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                        {activeTurn.starAnalysis.situation}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200/60 dark:border-slate-800/60">
                      <strong className="text-indigo-600 dark:text-indigo-400 block text-[11px]">
                        Task (Challenge):
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                        {activeTurn.starAnalysis.task}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200/60 dark:border-slate-800/60">
                      <strong className="text-indigo-600 dark:text-indigo-400 block text-[11px]">
                        Action (Ownership):
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                        {activeTurn.starAnalysis.action}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200/60 dark:border-slate-800/60">
                      <strong className="text-indigo-600 dark:text-indigo-400 block text-[11px]">
                        Result (Impact / Metrics):
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                        {activeTurn.starAnalysis.result}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Weaknesses & Rationale Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircleIcon size={14} /> Key Weaknesses Identified
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {activeTurn.keyWeaknesses.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Coaching Explanation & Rationale
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeTurn.explanation}
                  </p>
                </div>
              </div>

              {/* Improved Model Answer Exemplar */}
              <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <SparklesIcon size={14} className="text-emerald-600" />
                    Improved Model Exemplar Answer
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    Demonstration Pattern
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium bg-white dark:bg-[#0B1120] p-3.5 rounded-lg border border-emerald-200/40 dark:border-emerald-900/40">
                  {activeTurn.improvedAnswer}
                </p>
              </div>

              {/* Suggested Follow-up Exercise */}
              <div className="p-3.5 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-xs flex items-start gap-2.5">
                <TargetIcon size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-indigo-950 dark:text-indigo-300 block font-semibold">
                    Recommended Follow-up Drill:
                  </strong>
                  <span className="text-slate-600 dark:text-slate-300">
                    {activeTurn.suggestedFollowUpExercise}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-[#1E293B]">
        <button
          type="button"
          onClick={handleCopyReport}
          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
        >
          <CheckIcon size={14} className={copied ? 'text-emerald-500' : 'opacity-0'} />
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary Report'}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcwIcon size={14} />
            <span>Retake This Track</span>
          </button>

          <button
            type="button"
            onClick={onNewInterview}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            Practice Another Interview
          </button>
        </div>
      </div>
    </div>
  );
}
