'use client';

import React, { useState } from 'react';
import {
  InterviewConfig,
  InterviewSessionReport,
} from '@/lib/interview';
import { InterviewSetup } from '@/components/interview/InterviewSetup';
import { InterviewSession } from '@/components/interview/InterviewSession';
import { InterviewReport } from '@/components/interview/InterviewReport';

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
