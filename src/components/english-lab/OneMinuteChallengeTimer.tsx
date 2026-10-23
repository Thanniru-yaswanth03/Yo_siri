'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, RotateCcwIcon } from '@/components/icons';

interface OneMinuteChallengeTimerProps {
  durationSeconds?: number;
  isRunning: boolean;
  onTimeUp?: () => void;
  onToggleRunning?: (running: boolean) => void;
  onReset?: () => void;
}

export function OneMinuteChallengeTimer({
  durationSeconds = 60,
  isRunning,
  onTimeUp,
  onToggleRunning,
  onReset,
}: OneMinuteChallengeTimerProps) {
  const [prevDuration, setPrevDuration] = useState(durationSeconds);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Sync timeLeft when durationSeconds changes (standard React pattern for state from props)
  if (prevDuration !== durationSeconds) {
    setPrevDuration(durationSeconds);
    setTimeLeft(durationSeconds);
  }

  // Handle interval countdown
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Safely trigger onTimeUp when countdown reaches 0
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      onTimeUpRef.current?.();
    }
  }, [isRunning, timeLeft]);

  const percentage = Math.max(0, Math.min(100, (timeLeft / durationSeconds) * 100));

  // Pacing status
  let pacingColor = 'text-emerald-500 stroke-emerald-500';
  let pacingLabel = 'Smooth Pacing';
  let pacingBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  if (timeLeft <= 15 && timeLeft > 0) {
    pacingColor = 'text-rose-500 stroke-rose-500';
    pacingLabel = 'Wrap Up Your Core Point!';
    pacingBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (timeLeft <= 30 && timeLeft > 15) {
    pacingColor = 'text-amber-500 stroke-amber-500';
    pacingLabel = 'Transition to Key Takeaway';
    pacingBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (timeLeft === 0) {
    pacingColor = 'text-slate-500 stroke-slate-500';
    pacingLabel = 'Time Complete';
    pacingBg = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }

  const handleReset = () => {
    setTimeLeft(durationSeconds);
    onReset?.();
  };

  return (
    <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg text-slate-200">
      {/* Circular Progress Ring */}
      <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
        <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 36 36">
          <path
            className="text-slate-800"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={`transition-all duration-1000 ease-linear ${pacingColor}`}
            strokeDasharray={`${percentage}, 100`}
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className="absolute text-sm font-bold tracking-tight text-white font-mono">
          {timeLeft}s
        </span>
      </div>

      {/* Info & Controls */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            60-Second Challenge
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pacingBg}`}>
            {pacingLabel}
          </span>
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          Aim for 100-130 spoken words with a clear opening, detail, and conclusion.
        </p>
      </div>

      {/* Quick Play/Pause & Reset buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onToggleRunning?.(!isRunning)}
          className={`p-2 rounded-xl transition-all ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              : 'bg-violet-600 text-white hover:bg-violet-500 shadow-md shadow-violet-600/30'
          }`}
          title={isRunning ? 'Pause challenge' : 'Start challenge'}
        >
          {isRunning ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          title="Reset timer"
        >
          <RotateCcwIcon size={16} />
        </button>
      </div>
    </div>
  );
}
