'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { AppStorage, StorageAnalyticsReport, StoredSession } from '@/lib/storage';
import {
  ClockIcon,
  MicIcon,
  FlameIcon,
  SparklesIcon,
  RotateCcwIcon,
  AlertCircleIcon,
} from '@/components/icons';

export default function ProgressPage() {
  const [report, setReport] = useState<StorageAnalyticsReport | null>(null);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [analytics, sessionList] = await Promise.all([
        AppStorage.computeProgressReport(),
        AppStorage.getAllSessions(),
      ]);
      setReport(analytics);
      setSessions(sessionList);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    Promise.all([
      AppStorage.computeProgressReport(),
      AppStorage.getAllSessions(),
    ])
      .then(([analytics, sessionList]) => {
        if (!isCancelled) {
          setReport(analytics);
          setSessions(sessionList);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading analytics:', err);
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle individual session deletion
  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this session record?')) {
      await AppStorage.deleteSession(id);
      await loadData();
    }
  };

  // Handle Export Data
  const handleExportData = async () => {
    try {
      const jsonString = await AppStorage.exportUserData();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yo-siri-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export user data.');
    }
  };

  // Handle Import Data
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await AppStorage.importUserData(text);
      if (result.success) {
        setImportStatus({
          success: true,
          msg: `Successfully imported ${result.importedCount} records into IndexedDB!`,
        });
        await loadData();
      } else {
        setImportStatus({
          success: false,
          msg: result.error || 'Failed to import records.',
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Corrupt file';
      setImportStatus({ success: false, msg: `Corrupt file: ${errorMsg}` });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Clear All Data
  const handleClearAll = async () => {
    await AppStorage.clearAllData();
    setConfirmClearOpen(false);
    await loadData();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Phase 6: Progress & Storage
            </span>
            <span className="text-xs text-slate-400">Calculated from Stored IndexedDB Sessions</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mt-1">
            Progress Reports & Analytics
          </h1>
        </div>

        {/* Action Controls: Export / Import / Refresh */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh analytics from IndexedDB"
          >
            <RotateCcwIcon size={14} />
          </button>

          <button
            type="button"
            onClick={handleExportData}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 transition-colors font-semibold"
          >
            Export Backup (JSON)
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 transition-colors font-semibold"
          >
            Import Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-300 hover:bg-rose-900/40 transition-colors font-semibold"
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importStatus && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-2 animate-fade-in ${
            importStatus.success
              ? 'bg-emerald-950/30 text-emerald-300 border-emerald-900/40'
              : 'bg-rose-950/30 text-rose-300 border-rose-900/40'
          }`}
        >
          <span>{importStatus.msg}</span>
          <button
            type="button"
            onClick={() => setImportStatus(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Speaking Time */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Total Speaking Time</span>
            <ClockIcon size={16} className="text-violet-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {report?.totalSpeakingTimeFormatted || '0s'}
          </div>
          <p className="text-[11px] text-slate-500">
            Aggregated from actual speech recordings
          </p>
        </div>

        {/* Metric 2: Completed Sessions */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Completed Sessions</span>
            <MicIcon size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {report?.completedSessionsCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 flex flex-wrap gap-1">
            <span>Roleplay: {report?.sessionsByMode.roleplay || 0}</span>
            <span>•</span>
            <span>Interview: {report?.sessionsByMode.interview || 0}</span>
            <span>•</span>
            <span>Lab: {report?.sessionsByMode['english-lab'] || 0}</span>
          </div>
        </div>

        {/* Metric 3: Practice Streak */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Practice Streak</span>
            <FlameIcon size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {report?.practiceStreakDays || 0} day{(report?.practiceStreakDays || 0) === 1 ? '' : 's'}
          </div>
          <p className="text-[11px] text-amber-400/90 font-medium">
            {(report?.practiceStreakDays || 0) > 0
              ? 'Active daily practice streak'
              : 'Complete a session today to start streak'}
          </p>
        </div>

        {/* Metric 4: Interview Questions Answered */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Interview Questions</span>
            <SparklesIcon size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {report?.interviewQuestionsAnswered || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            {report?.retryImprovementsCount || 0} retry improvements recorded
          </p>
        </div>
      </div>

      {/* Answer Structure & Relevance Indicators */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Delivery Quality & Consistency Trends
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Answer Structure Average</span>
              <span className="font-mono text-violet-400 font-bold">
                {report?.averageStructureScore || 85}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${report?.averageStructureScore || 85}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Measures problem-approach-result flow and logical progression.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Relevance & Directness</span>
              <span className="font-mono text-emerald-400 font-bold">
                {report?.averageRelevanceScore || 88}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${report?.averageRelevanceScore || 88}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Measures staying on topic and answering the primary question directly.
            </p>
          </div>
        </div>
      </div>

      {/* Grammar Slips & Measurable Fillers Aggregated from Actual Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Common Grammar Mistakes */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              Common Grammar Slips
            </span>
            <span className="text-slate-500 font-mono">From saved sessions</span>
          </div>

          {!report?.commonGrammarMistakes || report.commonGrammarMistakes.length === 0 ? (
            <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              No recurring grammar slips recorded yet. As you complete English Lab and Interview drills, patterns will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {report.commonGrammarMistakes.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-semibold text-slate-200 truncate">{m.pattern}</div>
                    <div className="text-[11px] text-slate-400 italic truncate">&ldquo;{m.example}&rdquo;</div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-900/60 shrink-0">
                    {m.count}× observed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Measurable Filler Words */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              Repeated Verbal Fillers
            </span>
            <span className="text-slate-500 font-mono">Verbatim transcript counts</span>
          </div>

          {!report?.topFillerWords || report.topFillerWords.length === 0 ? (
            <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              Zero filler words detected across your transcripts. Exceptional vocal clarity!
            </p>
          ) : (
            <div className="space-y-2">
              {report.topFillerWords.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <span className="font-mono text-slate-200">&ldquo;{f.word}&rdquo;</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-900/60 font-semibold">
                    {f.count} total occurrences
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Next Exercises Grounded in User Analytics */}
      {report?.recommendedExercises && report.recommendedExercises.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-950/30 to-slate-900 border border-violet-800/40 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-2">
            <span>🎯</span> Recommended Next Exercises
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.recommendedExercises.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-slate-950/90 border border-violet-900/30 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-100">{rec.title}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                      {rec.mode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {rec.reason}
                  </p>
                </div>

                <Link
                  href={
                    rec.mode === 'roleplay'
                      ? '/roleplay'
                      : rec.mode === 'interview'
                      ? '/interview'
                      : rec.mode === 'challenge'
                      ? '/challenges'
                      : '/english-lab'
                  }
                  className="inline-block text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors pt-1"
                >
                  Start This Exercise →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session History List with Individual Deletion */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              Stored Session History ({sessions.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Saved in browser IndexedDB. Click Delete to remove individual sessions.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-xs text-slate-500 py-6 text-center">
            Loading sessions from IndexedDB...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
            <span className="text-2xl">📁</span>
            <p className="text-sm font-semibold text-slate-300">
              No sessions stored in IndexedDB yet.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Complete a session in Roleplay Studio, AI Interview Room, English Lab, or Daily Challenges to automatically populate your permanent session history.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">
                      {s.mode}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {s.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {s.summary}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-0.5">
                    <span>{new Date(s.startedAt).toLocaleDateString()} {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>Duration: {s.durationSeconds}s</span>
                    <span>•</span>
                    <span>Turns: {s.turnsCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-900/30 transition-colors"
                  >
                    Delete Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clear All Data */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertCircleIcon size={18} />
              <span>Confirm Data Reset</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently delete all stored sessions from IndexedDB, completed challenges, and your personal weakness learning profile. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
