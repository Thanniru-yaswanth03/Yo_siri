'use client';

import React, { useState } from 'react';
import { ConversationRoom } from '@/components/conversation/ConversationRoom';

interface LabModule {
  id: string;
  title: string;
  subtitle: string;
  targetFocus: string;
  drillQuestion: string;
  objective: string;
}

const labModules: LabModule[] = [
  {
    id: 'grammar-clinic',
    title: 'Grammar Clinic: Conditionals & Tenses',
    subtitle: 'Master complex past and hypothetical structures',
    targetFocus: 'Third Conditionals & Past Perfect',
    drillQuestion:
      'Welcome to the Grammar Clinic. Today’s focus is on hypothetical past situations. Imagine an outage happened last week because tests were skipped. Complete and speak this thought: "If we had run the integration suite before deployment, we would have..." and explain what would have happened.',
    objective: 'Speak using correct conditional forms without mixing past and present modals.',
  },
  {
    id: 'vocab-refinement',
    title: 'Vocabulary: Professional Articulation',
    subtitle: 'Upgrade basic verbs and adjectives into high-impact words',
    targetFocus: 'Impact Verbs & Nuanced Adjectives',
    drillQuestion:
      'Let’s test your vocabulary range. Instead of saying "I fixed a big problem and made the app fast", describe a recent debugging win using words like "diagnosed", "mitigated", "streamlined", or "refactored". Go ahead!',
    objective: 'Incorporate at least two professional upgrade verbs naturally in your response.',
  },
  {
    id: 'concise-tech',
    title: 'Concise Technical Explanation',
    subtitle: 'Eliminate fluff and explain complex systems simply',
    targetFocus: 'Clarity & Economy of Words',
    drillQuestion:
      'Here is your 60-second clarity challenge: Explain the core difference between SQL and NoSQL databases to a non-technical manager in under three sentences. Ready? Speak when you are ready.',
    objective: 'Deliver an accurate definition without using confusing acronyms or exceeding 3 sentences.',
  },
  {
    id: 'filler-elimination',
    title: 'Filler-Word Elimination',
    subtitle: 'Replace "um", "uh", "like" with purposeful silence',
    targetFocus: 'Pausing & Cadence Control',
    drillQuestion:
      'We are going to train purposeful pauses. Tell me what your morning routine looks like before you start coding. Take a one-second pause between each activity rather than saying "and then", "like", or "uh". Start now.',
    objective: 'Maintain rhythm with silent pauses instead of verbal crutches.',
  },
];

export default function EnglishLabPage() {
  const [selectedModule, setSelectedModule] = useState<LabModule>(labModules[0]);

  return (
    <div className="space-y-6">
      {/* Module Selector */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              English Lab Practice Focus
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Targeted drills designed to sharpen grammar precision, expand vocabulary, and eliminate vocal fillers.
            </p>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-900/40">
            Target: {selectedModule.targetFocus}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {labModules.map((mod) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => setSelectedModule(mod)}
              className={`text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                selectedModule.id === mod.id
                  ? 'bg-violet-50/80 dark:bg-violet-950/40 border-violet-500 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500'
                  : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="font-bold truncate">{mod.title.split(':')[0]}</div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">{mod.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation Room for English Lab */}
      <ConversationRoom
        key={selectedModule.id}
        mode="english-lab"
        modeTitle={selectedModule.title}
        modeBadge="English Lab"
        initialQuestion={selectedModule.drillQuestion}
        scenarioDetails={{
          topic: selectedModule.targetFocus,
          objective: selectedModule.objective,
          difficulty: 'Intermediate / Advanced',
        }}
      />
    </div>
  );
}
