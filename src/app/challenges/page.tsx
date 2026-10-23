'use client';

import React, { useState } from 'react';
import { ConversationRoom } from '@/components/conversation/ConversationRoom';
import {
  TrophyIcon,
  FlameIcon,
  ClockIcon,
  TargetIcon,
  CheckIcon,
  ArrowRightIcon,
} from '@/components/icons';
import { DailyChallengeItem } from '@/types';

const dailyChallenges: DailyChallengeItem[] = [
  {
    id: 'challenge-elevator',
    title: 'The 60-Second Technical Pitch',
    category: 'Interview Fluency',
    difficulty: 'Intermediate',
    durationMinutes: 3,
    description:
      'Explain what your current project or application does to a curious peer in under 60 seconds without saying "um" or "like".',
    prompt:
      'Ready for your 60-Second Pitch? The timer starts when you speak. Tell me what your primary application does, who it serves, and what core technical challenge you solved.',
    objective: 'Deliver a concise value proposition with high energy and no verbal crutches.',
    practiceMode: 'interview',
  },
  {
    id: 'challenge-diplomacy',
    title: 'Diplomatic Disagreement in Code Review',
    category: 'Workplace Communication',
    difficulty: 'Advanced',
    durationMinutes: 4,
    description:
      'A colleague wants to push a hacky workaround to meet a Friday deadline. Express your concern clearly without sounding condescending or blocking.',
    prompt:
      'Your colleague says: "Look, I know this is a messy hack, but product wants it deployed today. Can you just approve the pull request and we will clean it up later?" How do you respond respectfully?',
    objective: 'Acknowledge the deadline pressure first, then advocate for the stable compromise.',
    practiceMode: 'roleplay',
  },
  {
    id: 'challenge-tenses',
    title: 'Past vs Hypothetical Tense Precision',
    category: 'English Lab',
    difficulty: 'Beginner',
    durationMinutes: 3,
    description:
      'Train conditional grammar: explain a past mistake and state what you would have done differently using correct conditional modals.',
    prompt:
      'Welcome to the Tense Precision drill. Think about a minor mistake or oversight from last month. Complete this sentence: "If I had verified the configuration earlier, I would have avoided..." and elaborate in two sentences.',
    objective: 'Flawlessly connect "had + past participle" with "would have + verb".',
    practiceMode: 'english-lab',
  },
];

export default function ChallengesPage() {
  const [activeChallenge, setActiveChallenge] = useState<DailyChallengeItem | null>(null);

  return (
    <div className="space-y-8 pb-12">
      {/* If a challenge is active, render the ConversationRoom */}
      {activeChallenge ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveChallenge(null)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              ← Back to All Daily Challenges
            </button>
            <span className="text-xs text-slate-400">
              Active Challenge: {activeChallenge.title}
            </span>
          </div>

          <ConversationRoom
            mode={activeChallenge.practiceMode}
            modeTitle={`Daily Challenge: ${activeChallenge.title}`}
            modeBadge={activeChallenge.category}
            initialQuestion={activeChallenge.prompt}
            scenarioDetails={{
              topic: activeChallenge.category,
              objective: activeChallenge.objective,
              difficulty: activeChallenge.difficulty,
            }}
          />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 text-xs font-semibold mb-2">
                <TrophyIcon size={14} className="text-amber-500" />
                <span>Today&apos;s Workout Routine</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Daily Speaking Challenges
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Short, high-intensity speaking workouts designed to build confidence in specific communication scenarios.
              </p>
            </div>

            {/* Streak motivation badge */}
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] shadow-sm shrink-0">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500">
                <FlameIcon size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Practice Streak</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  0 Days (Ready)
                </span>
              </div>
            </div>
          </div>

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {dailyChallenges.map((challenge, index) => (
              <div
                key={challenge.id}
                className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5 hover:border-indigo-500/50 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-400">
                      Challenge #{index + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        challenge.difficulty === 'Beginner'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                          : challenge.difficulty === 'Intermediate'
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                          : 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {challenge.difficulty}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {challenge.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {challenge.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <ClockIcon size={14} className="text-indigo-500 shrink-0" />
                      <span>{challenge.durationMinutes} minutes duration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TargetIcon size={14} className="text-indigo-500 shrink-0" />
                      <span className="truncate">{challenge.category}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveChallenge(challenge)}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span>Launch Challenge</span>
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Quick Tip Card */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-[#131B2E] border border-indigo-200/50 dark:border-indigo-900/30 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <CheckIcon size={16} />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white">
                Pro Tip: The 3-Second Pause Rule
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                When faced with an unexpected question, taking a deliberate three-second breath before answering makes you sound thoughtful and composed, whereas rushing in usually leads to verbal fillers.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
