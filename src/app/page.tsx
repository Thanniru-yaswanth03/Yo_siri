import React from 'react';
import Link from 'next/link';
import {
  MessageSquareIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  TheaterIcon,
  FlameIcon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
  MicIcon,
  TargetIcon,
  InfoIcon,
} from '@/components/icons';

export default function DashboardPage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Greeting & Active Practice Objective Hero */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <SparklesIcon size={14} />
            <span>AI Voice Communication Coach</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome to Yo Siri
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Your personal, offline-first voice coach. Build spontaneous English fluency, practice job interviews, and refine professional speech through natural voice dialogues powered by local AI.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#172033] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <TargetIcon size={16} className="text-indigo-500" />
              <span>
                <strong className="text-slate-900 dark:text-white">Current Objective:</strong> Spontaneous fluency & technical articulation
              </span>
            </div>
            <Link
              href="/settings"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Adjust Goals →
            </Link>
          </div>
        </div>
      </section>

      {/* Target & Streak Snapshot Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Daily Target */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Daily Target</span>
            <ClockIcon size={16} className="text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">0</span>
            <span className="text-sm text-slate-500">/ 15 mins logged</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#172033] overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full w-0" />
          </div>
          <p className="text-xs text-slate-500">
            Start a 5-minute session to log speaking minutes for today.
          </p>
        </div>

        {/* Practice Streak */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Practice Streak</span>
            <FlameIcon size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">Day 0</span>
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              Start today
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Practice at least 3 minutes every day to build long-term muscle memory.
          </p>
        </div>

        {/* Local AI Engine Status */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Local AI Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
              gpt-oss:latest
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Ollama running on localhost:11434. 100% private with no paid AI cloud costs.
          </p>
        </div>
      </section>

      {/* Quick-Start Practice Rooms */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Practice Rooms
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a specialized voice environment tailored to your immediate communication goal
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Free Conversation */}
          <Link
            href="/conversation"
            className="group bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-indigo-500/60 dark:hover:border-indigo-500/60 rounded-2xl p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquareIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Free Conversation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Casual daily dialogue, storytelling, and spontaneous opinion sharing.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Start Speaking</span>
              <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 2. Interview Room */}
          <Link
            href="/interview"
            className="group bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-indigo-500/60 dark:hover:border-indigo-500/60 rounded-2xl p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BriefcaseIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Interview Room
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Technical, behavioral, and STAR method simulation with follow-up probing.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Start Mock</span>
              <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 3. English Lab */}
          <Link
            href="/english-lab"
            className="group bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-indigo-500/60 dark:hover:border-indigo-500/60 rounded-2xl p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <GraduationCapIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  English Lab
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Grammar clinic, vocabulary upgrades, and concise technical explanations.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Start Lab</span>
              <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 4. Roleplay Studio */}
          <Link
            href="/roleplay"
            className="group bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-indigo-500/60 dark:hover:border-indigo-500/60 rounded-2xl p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <TheaterIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Roleplay Studio
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Simulate high-stakes talks: salary talks, client demos, and team debates.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Choose Scene</span>
              <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* User Progress & Mistake Tracking Section (With Honest New User Empty States) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Recent Spoken Sessions
            </h3>
            <span className="text-xs text-slate-400">Total: 0</span>
          </div>

          {/* Genuine Empty State */}
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#172033] flex items-center justify-center mx-auto text-slate-400">
              <MicIcon size={20} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-slate-900 dark:text-white">
                No sessions recorded yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Once you complete your first practice session, your speaking duration, transcript history, and feedback summary will appear here.
              </p>
            </div>
            <Link
              href="/conversation"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
            >
              <MicIcon size={14} />
              <span>Start First Session</span>
            </Link>
          </div>
        </div>

        {/* Common Mistakes Tracker */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Recurring Speech Patterns & Mistakes
            </h3>
            <span className="text-xs text-slate-400">Learned: 0</span>
          </div>

          {/* Genuine Empty State */}
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#172033] flex items-center justify-center mx-auto text-slate-400">
              <InfoIcon size={20} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-slate-900 dark:text-white">
                No mistake patterns detected yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                As you speak, Yo Siri identifies grammatical slips, filler words, and awkward phrasings, compiling targeted practice recommendations.
              </p>
            </div>
            <Link
              href="/challenges"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
            >
              <span>Explore Daily Challenges</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
