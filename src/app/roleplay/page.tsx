'use client';

import React, { useState } from 'react';
import {
  RoleplayScenario,
  ROLEPLAY_SCENARIOS,
  RoleplayTurn,
  RoleplayCoachingReport,
} from '@/lib/roleplay';
import {
  RoleplayScenarioSelector,
  RoleplaySessionRoom,
  RoleplayCoachingReportView,
} from '@/components/roleplay';

type RoleplayView = 'select' | 'session' | 'coaching';

export default function RoleplayPage() {
  const [view, setView] = useState<RoleplayView>('select');
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario>(ROLEPLAY_SCENARIOS[0]);
  const [completedTurns, setCompletedTurns] = useState<RoleplayTurn[]>([]);
  const [coachingReport, setCoachingReport] = useState<RoleplayCoachingReport | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  const handleStartScenario = () => {
    setView('session');
    setSessionStartTime(Date.now());
    setCoachingReport(null);
  };

  const handleEndSession = (turns: RoleplayTurn[], report: RoleplayCoachingReport) => {
    const elapsed = Math.max(15, Math.round((Date.now() - sessionStartTime) / 1000));
    setDurationSeconds(elapsed);
    setCompletedTurns(turns);
    setCoachingReport(report);
    setView('coaching');
  };

  const handleRestart = () => {
    setView('session');
    setSessionStartTime(Date.now());
    setCoachingReport(null);
  };

  const handleChooseNew = () => {
    setView('select');
    setCoachingReport(null);
  };

  return (
    <div className="space-y-6">
      {view === 'select' && (
        <RoleplayScenarioSelector
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
          onStartScenario={handleStartScenario}
        />
      )}

      {view === 'session' && (
        <RoleplaySessionRoom
          scenario={selectedScenario}
          onEndSession={handleEndSession}
          onExit={handleChooseNew}
        />
      )}

      {view === 'coaching' && coachingReport && (
        <RoleplayCoachingReportView
          report={coachingReport}
          turns={completedTurns}
          durationSeconds={durationSeconds}
          onRestartScenario={handleRestart}
          onChooseNewScenario={handleChooseNew}
        />
      )}
    </div>
  );
}
