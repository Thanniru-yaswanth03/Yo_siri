'use client';

import React, { useState } from 'react';
import {
  InterviewCategory,
  InterviewDifficulty,
  InterviewerPersona,
  InteractionMode,
  FeedbackMode,
  InterviewConfig,
  INTERVIEW_CATEGORIES,
} from '@/lib/interview';
import {
  BriefcaseIcon,
  AwardIcon,
  CodeIcon,
  LayersIcon,
  UsersIcon,
  TargetIcon,
  MicIcon,
  SparklesIcon,
  CheckIcon,
} from '@/components/icons';

interface InterviewSetupProps {
  onStartInterview: (config: InterviewConfig) => void;
}

export function InterviewSetup({ onStartInterview }: InterviewSetupProps) {
  const [category, setCategory] = useState<InterviewCategory>('behavioral');
  const [targetRole, setTargetRole] = useState<string>(
    INTERVIEW_CATEGORIES['behavioral'].defaultRole
  );
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('intermediate');
  const [interviewerPersona, setInterviewerPersona] =
    useState<InterviewerPersona>('neutral');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('voice');
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('combined');

  const selectedPreset = INTERVIEW_CATEGORIES[category];

  const handleCategoryChange = (newCat: InterviewCategory) => {
    setCategory(newCat);
    setTargetRole(INTERVIEW_CATEGORIES[newCat].defaultRole);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartInterview({
      category,
      targetRole: targetRole.trim() || selectedPreset.defaultRole,
      difficulty,
      interviewerPersona,
      questionCount,
      interactionMode,
      feedbackMode,
    });
  };

  const categoryIcons: Record<InterviewCategory, React.ReactNode> = {
    hr: <BriefcaseIcon size={20} className="text-emerald-500" />,
    behavioral: <TargetIcon size={20} className="text-indigo-500" />,
    technical: <CodeIcon size={20} className="text-cyan-500" />,
    placement: <AwardIcon size={20} className="text-amber-500" />,
    'project-defense': <LayersIcon size={20} className="text-violet-500" />,
    'group-discussion': <UsersIcon size={20} className="text-rose-500" />,
  };

  return (
    <form onSubmit={handleStart} className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Hero Header */}
      <div className="text-center sm:text-left space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <SparklesIcon size={14} />
          <span>Phase 4: Realistic Mock Interview Simulation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          AI Interview Room
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Simulate realistic hiring interviews with adaptive follow-up questions, voice interaction,
          and transparent coaching evaluations across clarity, STAR structure, and technical depth.
        </p>
      </div>

      {/* 1. Category Selection */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Step 1: Choose Interview Category
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Select the specific interview format you want to practice today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {(Object.keys(INTERVIEW_CATEGORIES) as InterviewCategory[]).map((catKey) => {
            const item = INTERVIEW_CATEGORIES[catKey];
            const isSelected = category === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleCategoryChange(catKey)}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 dark:text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700/50 shadow-xs">
                      {categoryIcons[catKey]}
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        <CheckIcon size={14} /> Selected
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm tracking-tight">{item.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.tagline}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap gap-1">
                  {item.evaluationFocus.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Target Role & Focus Input */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Step 2: Target Role or Interview Topic
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Yo Siri personalizes questions to your target position and tech stack.
          </p>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer, Capstone Project Defense, Campus Trainee..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
          />

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 mr-1">Quick Suggestions:</span>
            {selectedPreset.suggestedRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setTargetRole(role)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  targetRole === role
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Difficulty & Interviewer Persona */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Difficulty */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Difficulty Level
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calibrates question depth and expected candidate precision.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'beginner', label: 'Beginner', desc: 'Foundational concepts & standard questions' },
                { id: 'intermediate', label: 'Intermediate', desc: 'Realistic industry depth & trade-offs' },
                { id: 'advanced', label: 'Advanced', desc: 'Rigorous edge cases & deep-dive architecture' },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  difficulty === d.id
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-xs capitalize">{d.label}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-normal leading-tight">
                  {d.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Persona */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Interviewer Persona
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the behavioral demeanor of your AI interviewer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'friendly', label: 'Friendly', desc: 'Encouraging, warm, patient tone' },
                { id: 'neutral', label: 'Neutral', desc: 'Objective, standard corporate interviewer' },
                { id: 'strict', label: 'Strict', desc: 'High standards, flags fluff, demands brevity' },
                { id: 'challenging', label: 'Challenging', desc: 'Probes edge cases, plays devil’s advocate' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setInterviewerPersona(p.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  interviewerPersona === p.id
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-xs capitalize">{p.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight">
                  {p.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Format, Duration & Feedback Mode */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Step 3: Session Duration & Interaction Mode
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Configure how you will communicate and how feedback will be delivered.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Questions Count */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Session Length
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { count: 3, label: '3 Qs', time: '~5 min' },
                { count: 5, label: '5 Qs', time: '~10 min' },
                { count: 8, label: '8 Qs', time: '~18 min' },
              ].map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setQuestionCount(opt.count)}
                  className={`py-2 px-1 rounded-xl text-center border text-xs transition-all ${
                    questionCount === opt.count
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold'
                      : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className="text-[10px] opacity-80">{opt.time}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interaction Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Interaction Mode
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setInteractionMode('voice')}
                className={`py-2 px-2 rounded-xl text-center border text-xs transition-all flex flex-col items-center justify-center gap-0.5 ${
                  interactionMode === 'voice'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold'
                    : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1 font-bold">
                  <MicIcon size={14} /> Voice Mode
                </div>
                <div className="text-[10px] opacity-80">Speech in & out</div>
              </button>

              <button
                type="button"
                onClick={() => setInteractionMode('text')}
                className={`py-2 px-2 rounded-xl text-center border text-xs transition-all flex flex-col items-center justify-center gap-0.5 ${
                  interactionMode === 'text'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold'
                    : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold">Text Mode</div>
                <div className="text-[10px] opacity-80">Silent typing</div>
              </button>
            </div>
          </div>

          {/* Feedback Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Feedback Delivery
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'immediate', label: 'Instant', desc: 'Per answer' },
                { id: 'combined', label: 'Combined', desc: 'Tip + Final' },
                { id: 'end-of-session', label: 'End Only', desc: 'Scorecard' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFeedbackMode(f.id as FeedbackMode)}
                  className={`py-2 px-1 rounded-xl text-center border text-xs transition-all ${
                    feedbackMode === f.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold'
                      : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold text-[11px]">{f.label}</div>
                  <div className="text-[10px] opacity-80">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Start Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-xs text-slate-500">
          The interviewer will ask questions one at a time. Suggested answers will remain hidden until you complete each turn.
        </p>

        <button
          type="submit"
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <SparklesIcon size={16} />
          <span>Start Mock Interview</span>
        </button>
      </div>
    </form>
  );
}
