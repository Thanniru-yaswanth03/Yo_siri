'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DailyPlanTier,
  DAILY_PLANS,
  DailyChallengeDefinition,
  getDailyChallenges,
} from '@/lib/challenges';
import { AppStorage, ChallengeCompletionRecord } from '@/lib/storage';
import { ChallengeExecutionModal } from '@/components/challenges';
import { FlameIcon, ClockIcon } from '@/components/icons';

export default function ChallengesPage() {
  const [selectedPlan, setSelectedPlan] = useState<DailyPlanTier>(() => {
    if (typeof window === 'undefined') return '15-min';
    try {
      const saved = localStorage.getItem('yo-siri-plan');
      return saved === '10-min' || saved === '15-min' || saved === '30-min' ? saved : '15-min';
    } catch {
      return '15-min';
    }
  });

  const [challenges, setChallenges] = useState<DailyChallengeDefinition[]>(() =>
    getDailyChallenges()
  );
  const [activeChallenge, setActiveChallenge] = useState<DailyChallengeDefinition | null>(null);
  const [todayCompletions, setTodayCompletions] = useState<ChallengeCompletionRecord[]>([]);

  const todayStr = typeof window !== 'undefined'
    ? new Date().toISOString().split('T')[0]
    : 'today';

  const refreshCompletions = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    AppStorage.getChallengeCompletions(today).then((records) => {
      setTodayCompletions(records);
    });
  }, []);

  useEffect(() => {
    refreshCompletions();
  }, [refreshCompletions]);

  const handleSelectPlan = (tier: DailyPlanTier) => {
    setSelectedPlan(tier);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yo-siri-plan', tier);
      } catch {
        // ignore
      }
    }
  };

  const currentPlanConfig = DAILY_PLANS[selectedPlan];
  const planChallengeIds = new Set(currentPlanConfig.challengeIds);

  const completedIds = new Set(todayCompletions.map((c) => c.challengeId));
  const planCompletedCount = currentPlanConfig.challengeIds.filter((id) =>
    completedIds.has(`challenge-${id}`) || completedIds.has(id)
  ).length;
  const planProgressPercent = Math.round(
    (planCompletedCount / currentPlanConfig.challengeIds.length) * 100
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                Daily Speaking Workouts
              </span>
              <span className="text-xs text-slate-400">
                10-, 15-, and 30-Minute Adaptive Plans
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
              Daily Speaking Challenges
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <FlameIcon size={16} />
              <span>Today&apos;s Date: {todayStr}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Daily deliberate practice is the proven path to effortless vocal fluency. Select your daily plan commitment and conquer each challenge with voice or text interaction.
        </p>

        {/* Plan Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {(['10-min', '15-min', '30-min'] as DailyPlanTier[]).map((tier) => {
            const plan = DAILY_PLANS[tier];
            const isSelected = selectedPlan === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => handleSelectPlan(tier)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-violet-950/40 border-violet-500 ring-1 ring-violet-500 text-slate-100 shadow-lg shadow-violet-950/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{plan.title}</span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-violet-400">
                      <ClockIcon size={12} />
                      {plan.durationMinutes}m
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {plan.description}
                  </p>
                </div>
                <div className="pt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {plan.challengeIds.length} Core Challenges
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan Completion Progress Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">
              {currentPlanConfig.title} Progress:
            </span>
            <span className="text-xs font-mono text-violet-400">
              {planCompletedCount} of {currentPlanConfig.challengeIds.length} completed today
            </span>
          </div>
          <div className="w-64 h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${planProgressPercent}%` }}
            />
          </div>
        </div>

        {planProgressPercent === 100 && (
          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            🎉 Today&apos;s {currentPlanConfig.title} is Complete!
          </div>
        )}
      </div>

      {/* Challenges List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Challenges in your {selectedPlan} plan
          </h2>
          <span className="text-xs text-slate-500">
            Click any challenge to begin
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {challenges.map((c) => {
            const isIncludedInPlan = planChallengeIds.has(c.type);
            const isDone = completedIds.has(c.id) || completedIds.has(c.type);

            return (
              <div
                key={c.id}
                onClick={() => setActiveChallenge(c)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isDone
                    ? 'bg-emerald-950/10 border-emerald-900/40 hover:border-emerald-700'
                    : isIncludedInPlan
                    ? 'bg-slate-900/90 border-slate-800 hover:border-violet-600 hover:bg-slate-900'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-90'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {c.badge}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        {c.durationSeconds}s
                      </span>
                      {isDone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Completed ✓
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {c.objective}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    {isIncludedInPlan ? 'Included in current plan' : 'Optional bonus'}
                  </span>
                  <span className="font-semibold text-violet-400">
                    {isDone ? 'Practice Again →' : 'Start Challenge →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution Modal */}
      {activeChallenge && (
        <ChallengeExecutionModal
          challenge={activeChallenge}
          planTier={selectedPlan}
          onClose={() => setActiveChallenge(null)}
          onCompleted={() => {
            refreshCompletions();
            setChallenges(getDailyChallenges());
          }}
        />
      )}
    </div>
  );
}
