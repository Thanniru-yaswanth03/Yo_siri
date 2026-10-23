'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppStorage, StorageAnalyticsReport, StoredSession } from '@/lib/storage';
import { WeaknessTrackerPanel } from '@/components/english-lab/WeaknessTrackerPanel';
import {
  ClockIcon,
  MicIcon,
  FlameIcon,
  SparklesIcon,
  RotateCcwIcon,
  AlertCircleIcon,
} from '@/components/icons';

export default function ProgressPage() {
  const router = useRouter();
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

  const hasSufficientData = Boolean(report && report.completedSessionsCount >= 2);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] border border-[#78947B]/30">
              Evidence-Based Analytics
            </span>
            <span className="text-xs text-[var(--text-secondary)]">Calculated from Stored Sessions</span>
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Progress Reports & Weakness Tracking
          </h1>
        </div>

        {/* Action Controls: Export / Import / Refresh */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={loadData}
            className="min-h-[40px] p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-xs"
            title="Refresh analytics from IndexedDB"
          >
            <RotateCcwIcon size={14} />
          </button>

          <button
            type="button"
            onClick={handleExportData}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors font-semibold shadow-xs"
          >
            Export Backup (JSON)
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors font-semibold shadow-xs"
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
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FBF0EC] border border-[#D87558]/30 text-[#D87558] hover:bg-[#F3E3DD] transition-colors font-semibold shadow-xs"
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
              ? 'bg-[#E8EFE9] text-[#244C3B] border-[#78947B]/40 dark:bg-[#25382B] dark:text-[#E2F0E6]'
              : 'bg-[#FBF0EC] text-[#D87558] border-[#D87558]/40'
          }`}
        >
          <span>{importStatus.msg}</span>
          <button
            type="button"
            onClick={() => setImportStatus(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Speaking Time */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Total Speaking Time</span>
            <ClockIcon size={16} className="text-[#244C3B] dark:text-[#467D60]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
            {report?.totalSpeakingTimeFormatted || '0s'}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Aggregated from actual speech recordings
          </p>
        </div>

        {/* Metric 2: Completed Sessions */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Completed Sessions</span>
            <MicIcon size={16} className="text-[#78947B]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
            {report?.completedSessionsCount || 0}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex flex-wrap gap-1">
            <span>Roleplay: {report?.sessionsByMode.roleplay || 0}</span>
            <span>•</span>
            <span>Interview: {report?.sessionsByMode.interview || 0}</span>
            <span>•</span>
            <span>Lab: {report?.sessionsByMode['english-lab'] || 0}</span>
          </div>
        </div>

        {/* Metric 3: Practice Streak */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Practice Streak</span>
            <FlameIcon size={16} className="text-[#D87558]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
            {report?.practiceStreakDays || 0} day{(report?.practiceStreakDays || 0) === 1 ? '' : 's'}
          </div>
          <p className="text-[11px] text-[#D87558] font-medium">
            {(report?.practiceStreakDays || 0) > 0
              ? 'Active daily practice streak'
              : 'Complete a session today to start streak'}
          </p>
        </div>

        {/* Metric 4: Interview Questions Answered */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold uppercase tracking-wider">Interview Questions</span>
            <SparklesIcon size={16} className="text-[#78947B]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
            {report?.interviewQuestionsAnswered || 0}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            {report?.retryImprovementsCount || 0} retry improvements recorded
          </p>
        </div>
      </div>

      {/* Answer Delivery Quality & Consistency Trends (Honest State) */}
      {!hasSufficientData ? (
        <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2 shadow-xs">
          <span className="text-2xl">📊</span>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Not enough practice data yet
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Complete at least 2 speaking sessions in Free Conversation, Interview Room, or English Lab to calculate trustworthy delivery trends without arbitrary estimates.
          </p>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Delivery Quality & Consistency Trends
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-primary)]">Answer Structure Average</span>
                <span className="font-mono text-[#244C3B] dark:text-[#E2F0E6] font-bold">
                  {report?.averageStructureScore}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--bg-base)] overflow-hidden">
                <div
                  className="h-full bg-[#244C3B] dark:bg-[#467D60] rounded-full"
                  style={{ width: `${report?.averageStructureScore}%` }}
                />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Measures problem-approach-result flow and logical progression.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-primary)]">Relevance & Directness</span>
                <span className="font-mono text-[#78947B] font-bold">
                  {report?.averageRelevanceScore}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--bg-base)] overflow-hidden">
                <div
                  className="h-full bg-[#78947B] rounded-full"
                  style={{ width: `${report?.averageRelevanceScore}%` }}
                />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Measures staying on topic and answering the primary question directly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Communication Weakness Radar Section */}
      <div className="space-y-4">
        <WeaknessTrackerPanel
          onSelectAdaptiveDrill={() => {
            router.push('/english-lab');
          }}
        />
      </div>

      {/* Grammar Slips & Measurable Fillers Aggregated from Actual Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Common Grammar Mistakes */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Common Grammar Slips
            </span>
            <span className="text-[var(--text-muted)] font-mono">From saved sessions</span>
          </div>

          {!report?.commonGrammarMistakes || report.commonGrammarMistakes.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center">
              No recurring grammar slips recorded yet. As you complete English Lab and Interview drills, patterns will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {report.commonGrammarMistakes.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-semibold text-[var(--text-primary)] truncate">{m.pattern}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] italic truncate">&ldquo;{m.example}&rdquo;</div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#FBF0EC] text-[#D87558] border border-[#D87558]/30 shrink-0 font-semibold">
                    {m.count}× observed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Measurable Filler Words */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Repeated Verbal Fillers
            </span>
            <span className="text-[var(--text-muted)] font-mono">Verbatim transcript counts</span>
          </div>

          {!report?.topFillerWords || report.topFillerWords.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center">
              Zero filler words detected across your transcripts. Clear, confident delivery!
            </p>
          ) : (
            <div className="space-y-2">
              {report.topFillerWords.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs flex items-center justify-between"
                >
                  <span className="font-mono text-[var(--text-primary)]">&ldquo;{f.word}&rdquo;</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] border border-[#78947B]/30 font-semibold">
                    {f.count} total occurrences
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session History List with Individual Deletion */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-serif font-bold text-[var(--text-primary)]">
              Stored Session History ({sessions.length})
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Saved in browser IndexedDB. Click Delete to remove individual sessions.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-xs text-[var(--text-muted)] py-6 text-center">
            Loading sessions from IndexedDB...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center space-y-2">
            <span className="text-2xl">📁</span>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              No sessions stored in IndexedDB yet.
            </p>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
              Complete a session in Free Conversation, AI Interview Room, English Lab, or Roleplay Studio to automatically populate your permanent session history.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#78947B] transition-all flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6] font-mono">
                      {s.mode}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {s.title}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                    {s.summary}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] font-mono pt-0.5">
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
                    className="min-h-[36px] text-xs px-3 py-1.5 rounded-xl bg-[#FBF0EC] hover:bg-[#F3E3DD] text-[#D87558] border border-[#D87558]/30 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#D87558] font-bold text-sm">
              <AlertCircleIcon size={18} />
              <span>Confirm Data Reset</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              This will permanently delete all stored sessions from IndexedDB, completed challenges, and your personal weakness learning profile. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-[#D87558] hover:bg-[#C56346] text-white shadow-sm"
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
