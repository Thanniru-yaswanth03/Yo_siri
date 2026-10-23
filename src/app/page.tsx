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
      <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] border border-[#78947B]/30 text-xs font-semibold">
            <SparklesIcon size={14} />
            <span>AI Voice Communication Coach</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)]">
            Welcome to Yo Siri
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Your personal, offline-first voice coach. Build spontaneous English fluency, practice job interviews, and refine professional speech through natural voice dialogues with real-time feedback.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <TargetIcon size={16} className="text-[#244C3B] dark:text-[#467D60]" />
              <span>
                <strong className="text-[var(--text-primary)]">Current Focus:</strong> Spontaneous fluency & structured articulation
              </span>
            </div>
            <Link
              href="/conversation"
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#244C3B] hover:bg-[#1B3B2E] dark:bg-[#467D60] text-white font-medium text-xs shadow-xs transition-colors"
            >
              <MicIcon size={14} />
              <span>Start Speaking Practice</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Target & Streak Snapshot Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Daily Target */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Daily Target</span>
            <ClockIcon size={16} className="text-[#244C3B] dark:text-[#467D60]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[var(--text-primary)]">0</span>
            <span className="text-sm text-[var(--text-secondary)]">/ 15 mins logged</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div className="h-full bg-[#244C3B] dark:bg-[#467D60] rounded-full w-0" />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Start a 5-minute session to log speaking minutes for today.
          </p>
        </div>

        {/* Practice Streak */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Practice Streak</span>
            <FlameIcon size={16} className="text-[#D87558]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[var(--text-primary)]">Day 0</span>
            <span className="text-sm text-[#D87558] font-medium">
              Start today
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Practice at least 3 minutes every day to build long-term muscle memory.
          </p>
        </div>

        {/* Local AI Engine Status */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Local AI Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#78947B]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[var(--text-primary)] font-mono">
              gpt-oss:latest
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Ollama running on localhost:11434. Private local intelligence with no cloud costs.
          </p>
        </div>
      </section>

      {/* Quick-Start Practice Rooms */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-[var(--text-primary)]">
            Practice Studios
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Select a specialized voice environment tailored to your communication goal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Free Conversation */}
          <Link
            href="/conversation"
            className="group bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#244C3B] rounded-2xl p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquareIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[#244C3B] dark:group-hover:text-[#E2F0E6] transition-colors">
                  Free Conversation
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Casual daily dialogue, storytelling, and spontaneous opinion sharing.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[#244C3B] dark:text-[#E2F0E6]">
              <span>Start Speaking</span>
              <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 2. Interview Room */}
          <Link
            href="/interview"
            className="group bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#244C3B] rounded-2xl p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] flex items-center justify-center group-hover:scale-105 transition-transform">
                <BriefcaseIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[#244C3B] dark:group-hover:text-[#E2F0E6] transition-colors">
                  Interview Room
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Technical, behavioral, and STAR method simulation with follow-up probing.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[#244C3B] dark:text-[#E2F0E6]">
              <span>Start Mock</span>
              <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 3. English Lab */}
          <Link
            href="/english-lab"
            className="group bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#244C3B] rounded-2xl p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] flex items-center justify-center group-hover:scale-105 transition-transform">
                <GraduationCapIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[#244C3B] dark:group-hover:text-[#E2F0E6] transition-colors">
                  English Lab
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Grammar clinic, vocabulary upgrades, and concise technical explanations.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[#244C3B] dark:text-[#E2F0E6]">
              <span>Start Lab</span>
              <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 4. Roleplay Studio */}
          <Link
            href="/roleplay"
            className="group bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#244C3B] rounded-2xl p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] flex items-center justify-center group-hover:scale-105 transition-transform">
                <TheaterIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[#244C3B] dark:group-hover:text-[#E2F0E6] transition-colors">
                  Roleplay Studio
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  High-stakes scenarios: salary talks, meetings, and team debates.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[#244C3B] dark:text-[#E2F0E6]">
              <span>Choose Scene</span>
              <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* User Progress & Mistake Tracking Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-[var(--text-primary)]">
              Recent Spoken Sessions
            </h3>
            <span className="text-xs text-[var(--text-muted)]">Logged in IndexedDB</span>
          </div>

          <div className="p-8 border border-dashed border-[var(--border-subtle)] rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <MicIcon size={20} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-[var(--text-primary)]">
                Ready for practice
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Once you complete your practice session, your speaking duration, transcript history, and feedback will be logged here.
              </p>
            </div>
            <Link
              href="/conversation"
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#244C3B] hover:bg-[#1B3B2E] dark:bg-[#467D60] text-white font-medium text-xs transition-colors"
            >
              <MicIcon size={14} />
              <span>Start Session</span>
            </Link>
          </div>
        </div>

        {/* Common Mistakes Tracker */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-[var(--text-primary)]">
              Communication Weakness Profile
            </h3>
            <span className="text-xs text-[var(--text-muted)]">Speech Evidence</span>
          </div>

          <div className="p-8 border border-dashed border-[var(--border-subtle)] rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <InfoIcon size={20} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-[var(--text-primary)]">
                Evidence-based profiling
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                As you speak, Yo Siri identifies grammatical slips, filler words, and structure weaknesses with verbatim evidence.
              </p>
            </div>
            <Link
              href="/progress"
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium text-xs transition-colors"
            >
              <span>View Weakness Radar</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
