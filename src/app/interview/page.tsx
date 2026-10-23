'use client';

import React, { useState } from 'react';
import { ConversationRoom } from '@/components/conversation/ConversationRoom';

interface Track {
  id: string;
  name: string;
  role: string;
  difficulty: 'Junior' | 'Mid' | 'Senior / Lead';
  firstQuestion: string;
  objective: string;
}

const interviewTracks: Track[] = [
  {
    id: 'system-design',
    name: 'System Design & Architecture',
    role: 'Senior Software Engineer',
    difficulty: 'Senior / Lead',
    firstQuestion:
      'Welcome to the technical round. Could you walk me through the architecture of a high-throughput, low-latency URL shortening service like Bitly? Specifically, how would you design the storage schema and cache strategy?',
    objective: 'Demonstrate structured trade-off analysis, scalability considerations, and concise spoken explanations.',
  },
  {
    id: 'behavioral-conflict',
    name: 'STAR: Handling Conflict',
    role: 'Engineering Culture & Leadership',
    difficulty: 'Mid',
    firstQuestion:
      'Tell me about a specific time when you strongly disagreed with a tech lead or product manager regarding technical direction. How did you present your case, and what was the resolution?',
    objective: 'Follow the Situation-Task-Action-Result structure without excessive rambling.',
  },
  {
    id: 'intro-elevator',
    name: 'Self Introduction & Impact',
    role: 'General Tech Screen',
    difficulty: 'Junior',
    firstQuestion:
      'Let’s start with a classic: "Tell me about yourself." Please summarize your background, your primary technical strengths, and the most impactful project you delivered recently in about 90 seconds.',
    objective: 'Hook the interviewer with confident pacing, clear chronology, and measurable impact.',
  },
  {
    id: 'frontend-performance',
    name: 'Frontend Core Web Vitals',
    role: 'Frontend Architect',
    difficulty: 'Senior / Lead',
    firstQuestion:
      'Suppose our web application is suffering from poor Largest Contentful Paint (LCP) and Interaction to Next Paint (INP). How would you systematically diagnose the root causes and improve user perception?',
    objective: 'Explain technical browser mechanics with clarity, precision, and confidence.',
  },
];

export default function InterviewPage() {
  const [selectedTrack, setSelectedTrack] = useState<Track>(interviewTracks[0]);

  return (
    <div className="space-y-6">
      {/* Track Selector Bar */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Mock Interview Track
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Practice rigorous technical and behavioral questions with instant feedback on clarity and structure.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40">
            Level: {selectedTrack.difficulty}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {interviewTracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => setSelectedTrack(track)}
              className={`text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                selectedTrack.id === track.id
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500'
                  : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="font-bold truncate">{track.name}</div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">{track.role}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation Room for Mock Interview */}
      <ConversationRoom
        key={selectedTrack.id}
        mode="interview"
        modeTitle={`Interview: ${selectedTrack.name}`}
        modeBadge={selectedTrack.role}
        initialQuestion={selectedTrack.firstQuestion}
        scenarioDetails={{
          topic: selectedTrack.name,
          objective: selectedTrack.objective,
          difficulty: selectedTrack.difficulty,
        }}
      />
    </div>
  );
}
