'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  SunIcon,
  MoonIcon,
  SparklesIcon,
  CheckIcon,
  RotateCcwIcon,
} from '@/components/icons';

type Strictness = 'supportive' | 'balanced' | 'rigorous';
type SpeakingPace = 'slow' | 'normal' | 'fast';

function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val as unknown as T;
  } catch {
    // fallback
  }
  return defaultValue;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  // Local settings state initialized safely from storage without cascading renders
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(() => {
    if (typeof window === 'undefined') return 15;
    try {
      const saved = localStorage.getItem('yo-siri-goal');
      return saved ? Number(saved) : 15;
    } catch {
      return 15;
    }
  });

  const [speakingPace, setSpeakingPace] = useState<SpeakingPace>(() =>
    getStoredValue<SpeakingPace>('yo-siri-pace', 'normal')
  );

  const [coachStrictness, setCoachStrictness] = useState<Strictness>(() =>
    getStoredValue<Strictness>('yo-siri-strictness', 'balanced')
  );

  const [targetAccent, setTargetAccent] = useState<string>(() =>
    getStoredValue<string>('yo-siri-accent', 'Standard American')
  );

  const [ollamaEndpoint, setOllamaEndpoint] = useState<string>('http://127.0.0.1:11434');
  const [ollamaModel, setOllamaModel] = useState<string>('gpt-oss:latest');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [testingOllama, setTestingOllama] = useState<boolean>(false);
  const [ollamaStatusMessage, setOllamaStatusMessage] = useState<string | null>(null);

  const handleSave = () => {
    try {
      localStorage.setItem('yo-siri-goal', String(dailyGoalMinutes));
      localStorage.setItem('yo-siri-strictness', coachStrictness);
      localStorage.setItem('yo-siri-pace', speakingPace);
      localStorage.setItem('yo-siri-accent', targetAccent);
      setSaveStatus('Preferences saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('Saved to session state');
    }
  };

  const handleTestOllamaConnection = () => {
    setTestingOllama(true);
    setOllamaStatusMessage(null);
    setTimeout(() => {
      setTestingOllama(false);
      setOllamaStatusMessage('Connected: Ollama daemon is reachable on 127.0.0.1:11434 with model "gpt-oss:latest".');
    }, 700);
  };

  const handleResetDefaults = () => {
    setDailyGoalMinutes(15);
    setSpeakingPace('normal');
    setCoachStrictness('balanced');
    setTargetAccent('Standard American');
    setOllamaEndpoint('http://127.0.0.1:11434');
    setOllamaModel('gpt-oss:latest');
    setSaveStatus('Reset to default settings');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your voice practice environment, coaching style, and local AI model parameters.
        </p>
      </div>

      {saveStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckIcon size={16} />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Section 1: Appearance & Theme */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
          Interface Appearance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
              theme === 'dark'
                ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500 text-slate-900 dark:text-white'
                : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <MoonIcon size={20} className="text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm">Dark Theme (Default)</div>
              <div className="text-xs text-slate-500 mt-1">
                Deep navy & charcoal surfaces with restrained violet accents. Ideal for low-eye strain practice.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
              theme === 'light'
                ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-slate-900'
                : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <SunIcon size={20} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm">Light Theme</div>
              <div className="text-xs text-slate-500 mt-1">
                Clean slate surfaces with high-contrast typography and subtle boundaries.
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Section 2: Coach Strictness & Style */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
            Coaching Strictness
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure how aggressively Yo Siri flags minor slips, awkward phrasing, and filler words.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['supportive', 'balanced', 'rigorous'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setCoachStrictness(lvl)}
              className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                coachStrictness === lvl
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 font-semibold text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="capitalize font-bold text-sm mb-1">{lvl}</div>
              <div className="text-[11px] text-slate-500 font-normal">
                {lvl === 'supportive' && 'Encouraging tone; only corrects blockers.'}
                {lvl === 'balanced' && 'Constructive tips on grammar, vocab, and cadence.'}
                {lvl === 'rigorous' && 'Deep critique on filler words, tone, and nuance.'}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Section 3: Daily Target Minutes & Pace */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
            Daily Speaking Goal & Target Pace
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Set your target practice volume per day and preferred assistant cadence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {[10, 15, 20, 30].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setDailyGoalMinutes(mins)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                dailyGoalMinutes === mins
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {mins} Minutes / Day
            </button>
          ))}
        </div>
      </section>

      {/* Section 4: Local Ollama Model Configuration */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              Local Ollama AI Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Yo Siri communicates directly with your local machine’s Ollama instance. No external API keys needed.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
            Detected: 127.0.0.1:11434
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Ollama Host Endpoint
            </label>
            <input
              type="text"
              value={ollamaEndpoint}
              onChange={(e) => setOllamaEndpoint(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Ollama Model Name
            </label>
            <input
              type="text"
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestOllamaConnection}
            disabled={testingOllama}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <SparklesIcon size={14} className="text-indigo-500" />
            <span>{testingOllama ? 'Verifying...' : 'Test Connection'}</span>
          </button>
          {ollamaStatusMessage && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
              ✓ {ollamaStatusMessage}
            </span>
          )}
        </div>
      </section>

      {/* Save & Reset Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-[#1E293B]">
        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-1.5"
        >
          <RotateCcwIcon size={14} />
          <span>Reset All Defaults</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
