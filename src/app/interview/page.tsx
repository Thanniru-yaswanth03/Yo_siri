'use client';

import React, { useState } from 'react';
import {
  InterviewConfig,
  InterviewSessionReport,
} from '@/lib/interview';
import { InterviewSetup } from '@/components/interview/InterviewSetup';
import { InterviewSession } from '@/components/interview/InterviewSession';
import { InterviewReport } from '@/components/interview/InterviewReport';
import { AppStorage } from '@/lib/storage';

type ViewMode = 'setup' | 'session' | 'report';

export default function InterviewPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [activeConfig, setActiveConfig] = useState<InterviewConfig | null>(null);
  const [sessionReport, setSessionReport] = useState<InterviewSessionReport | null>(null);

  const handleStartInterview = (config: InterviewConfig) => {
    setActiveConfig(config);
    setViewMode('session');
    setSessionReport(null);
  };

  const handleEndSession = (report: InterviewSessionReport) => {
    setSessionReport(report);
    setViewMode('report');

    // Automatically persist to IndexedDB
    const totalWords = report.turns.reduce(
      (acc, t) => acc + (t.originalAnswer || '').split(/\s+/).filter(Boolean).length,
      0
    );
    const spokenSeconds = Math.round((totalWords / 130) * 60);
    const endedAt = report.completedAt || new Date().toISOString();

    AppStorage.saveSession({
      id: `session-interview-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      mode: 'interview',
      title: `${report.config.category.toUpperCase()} Mock Interview`,
      startedAt: report.startedAt,
      endedAt,
      durationSeconds: Math.max(15, Math.round(report.durationMinutes * 60)),
      turnsCount: report.turns.length,
      userSpokenSeconds: Math.max(15, spokenSeconds),
      summary: report.keyStrengths?.join(' ') || 'Completed mock interview session.',
      turns: report.turns.map((t, idx) => ({
        turnIndex: idx + 1,
        question: t.question,
        userAnswer: t.originalAnswer,
        relevanceScore: t.relevanceScore * 10,
        structureScore: t.logicalStructureScore * 10,
      })),
      metadata: {
        interviewCategory: report.config.category,
        overallRating: report.scores?.overallScore,
      },
    }).catch((err) => console.error('Failed to save interview session to IndexedDB:', err));
  };

  const handleRetake = () => {
    if (activeConfig) {
      setViewMode('session');
      setSessionReport(null);
    } else {
      setViewMode('setup');
    }
  };

  const handleNewInterview = () => {
    setViewMode('setup');
    setActiveConfig(null);
    setSessionReport(null);
  };

  return (
    <div className="space-y-6">
      {viewMode === 'setup' && (
        <InterviewSetup onStartInterview={handleStartInterview} />
      )}

      {viewMode === 'session' && activeConfig && (
        <InterviewSession
          config={activeConfig}
          onEndSession={handleEndSession}
          onRestart={handleNewInterview}
        />
      )}

      {viewMode === 'report' && sessionReport && (
        <InterviewReport
          report={sessionReport}
          onRetake={handleRetake}
          onNewInterview={handleNewInterview}
        />
      )}
    </div>
  );
}
