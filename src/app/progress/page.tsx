import React from 'react';
import Link from 'next/link';
import {
  BarChart3Icon,
  FlameIcon,
  ClockIcon,
  SparklesIcon,
  MicIcon,
  InfoIcon,
} from '@/components/icons';

export default function ProgressPage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Progress Reports & Speaking Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track your spoken fluency cadence, vocabulary breadth, and consistency over time.
        </p>
      </div>

      {/* Primary KPI Metrics Grid (Truthful zero/empty state for new user) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Total Speaking Time</span>
            <ClockIcon size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">0 min</div>
          <p className="text-[11px] text-slate-400">Target: 15 min / day</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Sessions Completed</span>
            <MicIcon size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">0</div>
          <p className="text-[11px] text-slate-400">Start your first session today</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Current Streak</span>
            <FlameIcon size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">0 days</div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Ready to initiate streak
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Fluency Benchmark</span>
            <SparklesIcon size={16} className="text-violet-500" />
          </div>
          <div className="text-base font-semibold text-slate-500 dark:text-slate-400">
            Pending Calibration
          </div>
          <p className="text-[11px] text-slate-400">Requires 3 practice sessions</p>
        </div>
      </div>

      {/* Weekly Speaking Activity Chart Area (Honest Empty State) */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Weekly Speaking Volume
            </h2>
            <p className="text-xs text-slate-500">Minutes spoken each day over the current 7-day window</p>
          </div>
          <span className="text-xs text-slate-400">Current Week</span>
        </div>

        {/* Visual Week Bars Representation */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 pb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="flex flex-col items-center gap-2">
              <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-[#161F30] flex flex-col justify-end p-1">
                {/* 0 height bar */}
                <div className="w-full bg-indigo-600/30 rounded-lg h-1" />
              </div>
              <span className="text-[11px] font-medium text-slate-500">{day}</span>
              <span className="text-[10px] text-slate-400">0m</span>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
          <InfoIcon size={18} className="text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 dark:text-white block mb-0.5">
              Live Progress Tracking
            </strong>
            Speaking sessions are saved privately in your local browser IndexedDB storage once Phase 2 persistence is activated. Yo Siri never uploads your voice data to the cloud.
          </div>
        </div>
      </div>

      {/* How Fluency Metrics are Calculated */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          How Yo Siri Evaluates Your Spoken Communication
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3Icon size={16} className="text-indigo-500" />
              <span>Cadence & Pacing (WPM)</span>
            </div>
            <p className="leading-relaxed">
              Native conversational English generally ranges between <strong>130 to 150 words per minute</strong>. Speaking too fast diminishes clarity, while excessive hesitation disrupts listening flow.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <SparklesIcon size={16} className="text-violet-500" />
              <span>Grammatical Precision</span>
            </div>
            <p className="leading-relaxed">
              Analyzes subject-verb agreement, tense continuity (especially in behavioral interview stories), and preposition accuracy in real-time.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClockIcon size={16} className="text-emerald-500" />
              <span>Filler Word Density</span>
            </div>
            <p className="leading-relaxed">
              Detects unconscious verbal pauses (&quot;like&quot;, &quot;um&quot;, &quot;actually&quot;, &quot;you know&quot;) and trains you to replace them with deliberate, confident pauses.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Link
            href="/conversation"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
          >
            Start a Session to Establish Your Baseline →
          </Link>
        </div>
      </div>
    </div>
  );
}
