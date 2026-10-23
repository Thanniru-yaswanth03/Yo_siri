'use client';

import React, { useState } from 'react';
import { ConversationRoom } from '@/components/conversation/ConversationRoom';

const conversationTopics = [
  {
    id: 'learning',
    title: 'Recent Learnings',
    question:
      "Hey! It's great to practice with you today. What is something interesting you learned or built recently that you'd like to tell me about?",
  },
  {
    id: 'ai-future',
    title: 'AI in Daily Life',
    question:
      'Artificial intelligence is evolving at breakneck speed. In your own words, how do you think it will change your daily workflow over the next few years?',
  },
  {
    id: 'weekend-routine',
    title: 'Unwinding & Hobbies',
    question:
      'When you want to completely disconnect from screens and recharge, what activity or hobby helps you reset best?',
  },
  {
    id: 'decision-making',
    title: 'Tough Decisions',
    question:
      'Can you describe a tough decision you had to make recently, and how you weighed the trade-offs before acting?',
  },
];

export default function ConversationPage() {
  const [selectedTopic, setSelectedTopic] = useState(conversationTopics[0]);

  return (
    <div className="space-y-6">
      {/* Topic Switcher Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-semibold text-slate-500 shrink-0">Topic Starters:</span>
        {conversationTopics.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedTopic(t)}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
              selectedTopic.id === t.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#172033]'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Main Conversation Room */}
      <ConversationRoom
        key={selectedTopic.id}
        mode="conversation"
        modeTitle="Free Conversation Room"
        modeBadge="Casual & Fluency"
        initialQuestion={selectedTopic.question}
        scenarioDetails={{
          topic: selectedTopic.title,
          objective: 'Speak naturally, elaborate on your ideas, and maintain a steady rhythm.',
          difficulty: 'Intermediate',
        }}
      />
    </div>
  );
}
