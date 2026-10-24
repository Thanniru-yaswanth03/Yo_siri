'use client';

import React, { useState, useEffect } from 'react';
import { DailyChallengeDefinition, DailyPlanTier } from '@/lib/challenges';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import { AppStorage, StoredSession } from '@/lib/storage';
import { OneMinuteChallengeTimer } from '@/components/english-lab';
import { MicIcon, MicOffIcon, Volume2Icon } from '@/components/icons';
import { scanTranscriptFillers, analyzeConciseness } from '@/lib/english-lab';
import { assessAnswerQuality } from '@/lib/evaluation';

interface ChallengeExecutionModalProps {
  challenge: DailyChallengeDefinition;
  planTier: DailyPlanTier;
  onClose: () => void;
  onCompleted: (challengeId: string) => void;
}

export function ChallengeExecutionModal({
  challenge,
  planTier,
  onClose,
  onCompleted,
}: ChallengeExecutionModalProps) {
  const [userInput, setUserInput] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    wordCount: number;
    fillerCount: number;
    feedbackText: string;
    criteriaMet: boolean;
  } | null>(null);

  const startTimeRef = React.useRef(0);

  // Hook into Phase 3 Voice Engine
  const {
    state: conversationState,
    startListening,
    stopListening,
    speakResponse,
    isSpeechRecognitionSupported,
    cancelSession,
  } = useVoiceEngine({
    defaultRate: 1.0,
    onTranscriptComplete: (finalText) => {
      setUserInput(finalText);
    },
  });

  const isListening = conversationState === 'listening';

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [challenge]);

  const handleCompleteAndEvaluate = async () => {
    if (!userInput.trim()) return;

    cancelSession();
    setIsTimerRunning(false);
    setIsEvaluating(true);

    const elapsedSeconds = Math.max(10, Math.round((Date.now() - startTimeRef.current) / 1000));
    const cleanAnswer = userInput.trim();
    const quality = assessAnswerQuality(challenge.promptQuestion, cleanAnswer);
    const fillers = scanTranscriptFillers(cleanAnswer);
    const conciseness = analyzeConciseness(cleanAnswer);

    // Call English Lab API for grammar and evaluation
    let feedbackText =
      quality.status === 'valid'
        ? 'Well articulated! You completed the challenge within the recommended time window.'
        : quality.diagnosticExplanation;

    try {
      const res = await fetch('/api/ai/english-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          category: 'conciseness',
          question: challenge.promptQuestion,
          userAnswer: cleanAnswer,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.evaluation?.clearExplanation) {
          feedbackText = data.evaluation.clearExplanation;
        }
      }
    } catch {
      // fallback
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Compute honest scores bounded by quality gate
    const honestClarity = Math.max(0, Math.min(100, quality.clarityScore * 10));
    const honestRelevance = Math.max(0, Math.min(100, quality.relevanceScore * 10));
    const honestStructure = Math.max(0, Math.min(100, quality.structureScore * 10));

    // 1. Record Challenge Completion in IndexedDB
    await AppStorage.saveChallengeCompletion({
      id: `${todayStr}-${challenge.id}`,
      challengeId: challenge.id,
      title: challenge.title,
      category: challenge.badge,
      date: todayStr,
      plan: planTier,
      durationSeconds: elapsedSeconds,
      completedAt: new Date().toISOString(),
    });

    // 2. Also record as a practice session in IndexedDB
    const sessionRecord: StoredSession = {
      id: `session-challenge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      mode: 'challenge',
      title: `Daily Challenge: ${challenge.title}`,
      startedAt: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      turnsCount: 1,
      userSpokenSeconds: elapsedSeconds,
      summary: `Completed ${challenge.title} (${planTier} plan). Delivered ${conciseness.wordCount} words with ${fillers.totalFillers} verbal filler(s).`,
      turns: [
        {
          turnIndex: 1,
          question: challenge.promptQuestion,
          userAnswer: cleanAnswer,
          fillerWords: fillers.fillers.map((f) => ({ word: f.word, count: f.count })),
          clarityScore: honestClarity,
          relevanceScore: honestRelevance,
          structureScore: honestStructure,
        },
      ],
      metadata: {
        challengeId: challenge.id,
        planTier,
      },
    };

    await AppStorage.saveSession(sessionRecord);

    setEvaluationResult({
      wordCount: conciseness.wordCount,
      fillerCount: fillers.totalFillers,
      feedbackText,
      criteriaMet: true,
    });

    setIsEvaluating(false);
    onCompleted(challenge.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                {challenge.badge}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {challenge.durationSeconds}s Target Limit
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              {challenge.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Prompt Card */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Prompt / Task:</span>
            <button
              type="button"
              onClick={() => speakResponse(challenge.promptQuestion)}
              className="flex items-center gap-1 text-violet-400 hover:text-violet-300"
            >
              <Volume2Icon size={12} />
              Hear Prompt
            </button>
          </div>
          <p className="text-sm font-medium text-slate-100 leading-relaxed">
            {challenge.promptQuestion}
          </p>
          <div className="text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            💡 Focus: {challenge.focusHint}
          </div>
        </div>

        {/* Timer */}
        <OneMinuteChallengeTimer
          durationSeconds={challenge.durationSeconds}
          isRunning={isTimerRunning}
          onToggleRunning={(r) => setIsTimerRunning(r)}
          onTimeUp={() => {
            setIsTimerRunning(false);
            if (isListening) stopListening();
          }}
        />

        {/* Input Area */}
        {!evaluationResult ? (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                rows={4}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={
                  isSpeechRecognitionSupported
                    ? 'Click the microphone button to speak your response, or type directly here...'
                    : 'Type your response here...'
                }
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 leading-relaxed resize-none"
              />

              {isListening && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-semibold text-rose-300 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Listening...
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isSpeechRecognitionSupported && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isListening) {
                        stopListening();
                      } else {
                        startListening();
                        setIsTimerRunning(true);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isListening
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isListening ? <MicOffIcon size={14} /> : <MicIcon size={14} />}
                    {isListening ? 'Stop Recording' : 'Speak Challenge Response'}
                  </button>
                )}
                <span className="text-[11px] font-mono text-slate-500">
                  {userInput.trim().split(/\s+/).filter(Boolean).length} words spoken
                </span>
              </div>

              <button
                type="button"
                onClick={handleCompleteAndEvaluate}
                disabled={isEvaluating || !userInput.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30 disabled:opacity-40 transition-all"
              >
                {isEvaluating ? 'Evaluating...' : 'Complete Challenge & Record ✓'}
              </button>
            </div>
          </div>
        ) : (
          /* Completion Feedback */
          <div className="space-y-4 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>✓</span> Challenge Successfully Completed & Saved
              </span>
              <span className="text-xs font-mono text-slate-400">
                {evaluationResult.wordCount} words • {evaluationResult.fillerCount} fillers
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              {evaluationResult.feedbackText}
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
