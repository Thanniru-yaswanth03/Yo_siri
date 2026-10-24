'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LabCategory,
  LabTurnEvaluation,
  RetryComparison,
  AdaptiveDrill,
  PersonalWeaknessTracker,
} from '@/lib/english-lab';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import {
  LabFeedbackCard,
  AttemptComparisonModal,
  WeaknessTrackerPanel,
  OneMinuteChallengeTimer,
} from '@/components/english-lab';
import { MicIcon, MicOffIcon, Volume2Icon, RotateCcwIcon } from '@/components/icons';
import { AppStorage } from '@/lib/storage';
import { assessAnswerQuality } from '@/lib/evaluation';

interface LabModuleConfig {
  id: LabCategory;
  title: string;
  subtitle: string;
  badge: string;
  defaultPrompt: string;
  focusHint: string;
  isTimed?: boolean;
  timerDuration?: number;
}

const LAB_MODULES: LabModuleConfig[] = [
  {
    id: 'grammar',
    title: 'Grammar Clinic',
    subtitle: 'Conditionals, tenses, and verb agreements',
    badge: 'Grammar Precision',
    defaultPrompt:
      'Imagine an outage happened yesterday because automated tests were skipped. Complete and speak this thought: "If we had run the test suite before deploying to production, we would have..." and explain what the outcome would have been.',
    focusHint: 'Maintain strict third-conditional structure (If + had + past participle, would have + past participle).',
  },
  {
    id: 'natural-phrasing',
    title: 'Natural Phrasing',
    subtitle: 'Idiomatic expressions & conversational flow',
    badge: 'Native Phrasing',
    defaultPrompt:
      'Describe how your team resolves architectural disagreements. Instead of literal word-for-word translation, use natural expressions like "we hash it out", "meet in the middle", or "weigh the trade-offs".',
    focusHint: 'Focus on natural spoken English idioms without sounding overly formal or rigid.',
  },
  {
    id: 'vocabulary',
    title: 'Vocabulary Boost',
    subtitle: 'Impact verbs & precise terminology',
    badge: 'Professional Lexicon',
    defaultPrompt:
      'Explain a recent performance optimization or refactor. Replace basic phrases like "I made the code fast" with high-impact verbs like "diagnosed", "streamlined", "mitigated", or "refactored".',
    focusHint: 'Incorporate at least two distinct professional upgrade verbs naturally.',
  },
  {
    id: 'conversational',
    title: 'Conversational Fluency',
    subtitle: 'Casual confidence, warmth & transitions',
    badge: 'Social & Chat',
    defaultPrompt:
      'You are meeting a new colleague at a tech conference mixer. Introduce yourself, mention what you are currently building, and ask an open-ended question to kick off an engaging chat.',
    focusHint: 'Speak with warmth, conversational transitions, and natural interpersonal rhythm.',
  },
  {
    id: 'conciseness',
    title: 'Conciseness Training',
    subtitle: 'Eliminate fluff, state thoughts in 2-3 sentences',
    badge: 'Economy of Words',
    defaultPrompt:
      'Explain the fundamental difference between relational and document databases in exactly two or three crisp sentences. No filler words or unnecessary background.',
    focusHint: 'Deliver your complete definition in under 45 words.',
    isTimed: true,
    timerDuration: 45,
  },
  {
    id: 'filler-elimination',
    title: 'Filler-Word Elimination',
    subtitle: 'Replace "um", "uh", "like" with purposeful pauses',
    badge: 'Vocal Presence',
    defaultPrompt:
      'Walk me through your morning startup routine before you begin your deep work. Train inserting a 1-second silent pause between distinct thoughts instead of using "and then", "like", or "uh".',
    focusHint: 'Take purposeful, silent breaths instead of verbal crutches.',
  },
  {
    id: 'sentence-structure',
    title: 'Sentence Structure',
    subtitle: 'Vary sentence lengths & active voice',
    badge: 'Syntactic Variety',
    defaultPrompt:
      'Explain why continuous integration is valuable. Deliberately start your response with a short punchy sentence, follow with a compound sentence explaining the mechanism, and conclude with a result.',
    focusHint: 'Vary rhythm: short sentence → compound sentence → concluding sentence.',
  },
  {
    id: 'one-minute-challenge',
    title: '1-Minute Challenge',
    subtitle: 'Timed 60-second structured speaking sprint',
    badge: 'Sprint Drill',
    defaultPrompt:
      'Pitch your favorite open-source library or developer tool. You have exactly 60 seconds: explain what problem it solves, why you love using it, and who should adopt it today.',
    focusHint: 'Aim for 100-130 spoken words with a distinct beginning, middle, and end before the timer expires.',
    isTimed: true,
    timerDuration: 60,
  },
  {
    id: 'adaptive-drill',
    title: 'Adaptive Drill',
    subtitle: 'Generated from your personal weakness profile',
    badge: 'Personalized',
    defaultPrompt:
      'Explain a complex technical concept you mastered recently using the 4-part structure: 1. The Core Problem, 2. Your Specific Approach, 3. Measurable Result, 4. Key Takeaways.',
    focusHint: 'Tailored specifically to address recurring mistakes recorded in your profile.',
  },
];

export default function EnglishLabPage() {
  const [activeTab, setActiveTab] = useState<'practice' | 'profile'>('practice');
  const [selectedModule, setSelectedModule] = useState<LabModuleConfig>(LAB_MODULES[0]);
  const [promptText, setPromptText] = useState<string>(LAB_MODULES[0].defaultPrompt);
  const [userAnswerInput, setUserAnswerInput] = useState<string>('');

  // Evaluation & Retry States
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<LabTurnEvaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Retry Loop states
  const [isRetryMode, setIsRetryMode] = useState<boolean>(false);
  const [attempt1Answer, setAttempt1Answer] = useState<string>('');
  const [retryComparison, setRetryComparison] = useState<RetryComparison | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);

  // 1-Minute Challenge Timer state
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Session reference for auditable evidence
  const sessionRef = useRef<string>('session-lab');

  useEffect(() => {
    sessionRef.current = `session-${Date.now().toString(36)}`;
  }, []);

  // Hook into Phase 3 Voice Engine
  const {
    state: conversationState,
    startListening,
    stopListening,
    speakResponse,
    isSpeechRecognitionSupported,
  } = useVoiceEngine({
    defaultRate: 1.0,
    onTranscriptComplete: (finalText) => {
      setUserAnswerInput(finalText);
    },
  });

  const isListening = conversationState === 'listening';

  // Synchronize prompt when switching preset module
  const handleSelectModule = (mod: LabModuleConfig) => {
    setSelectedModule(mod);
    setPromptText(mod.defaultPrompt);
    setUserAnswerInput('');
    setCurrentEvaluation(null);
    setIsRetryMode(false);
    setIsTimerRunning(false);
  };

  // Launch targeted adaptive drill from WeaknessTrackerPanel
  const handleSelectAdaptiveDrill = (drill: AdaptiveDrill) => {
    const adaptiveMod = LAB_MODULES.find((m) => m.id === 'adaptive-drill') || LAB_MODULES[0];
    setSelectedModule({
      ...adaptiveMod,
      title: drill.title,
      defaultPrompt: drill.promptQuestion,
      focusHint: drill.targetObjective,
      isTimed: Boolean(drill.timerSeconds),
      timerDuration: drill.timerSeconds || 60,
    });
    setPromptText(drill.promptQuestion);
    setUserAnswerInput('');
    setCurrentEvaluation(null);
    setIsRetryMode(false);
    setIsTimerRunning(false);
    setActiveTab('practice');
  };

  // Submit Answer for Evaluation
  const handleSubmitAnswer = async () => {
    const answer = userAnswerInput.trim();
    if (!answer) {
      setErrorMsg('Please speak or type an answer before requesting evaluation.');
      return;
    }

    setErrorMsg(null);
    setIsEvaluating(true);
    if (isListening) stopListening();
    if (isTimerRunning) setIsTimerRunning(false);

    try {
      // 1. If in Retry Mode, compare Attempt 1 vs Attempt 2
      if (isRetryMode && attempt1Answer) {
        const compRes = await fetch('/api/ai/english-lab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'compare_retry',
            question: promptText,
            attempt1: attempt1Answer,
            attempt2: answer,
          }),
        });

        if (compRes.ok) {
          const compData = await compRes.json();
          setRetryComparison(compData.comparison);
          setShowComparisonModal(true);

          // Update weakness profile with retry resolution
          if (selectedModule.id === 'grammar') {
            PersonalWeaknessTracker.markResolved('tense-errors');
            PersonalWeaknessTracker.markResolved('subject-verb-agreement');
          } else if (selectedModule.id === 'conciseness' || selectedModule.id === 'filler-elimination') {
            PersonalWeaknessTracker.markResolved('filler-words');
            PersonalWeaknessTracker.markResolved('rambling-answers');
          }
        }
      }

      // 2. Perform Standard Turn Evaluation (produces the 6 required items)
      const evalRes = await fetch('/api/ai/english-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          category: selectedModule.id,
          question: promptText,
          userAnswer: answer,
        }),
      });

      if (!evalRes.ok) {
        throw new Error(`Evaluation failed with status ${evalRes.status}`);
      }

      const evalData = await evalRes.json();
      const evaluation: LabTurnEvaluation = evalData.evaluation;
      setCurrentEvaluation(evaluation);

      // Record evidence into Personal Weakness Tracker
      if (evaluation.identifiedWeaknesses && evaluation.identifiedWeaknesses.length > 0) {
        for (const item of evaluation.identifiedWeaknesses) {
          PersonalWeaknessTracker.recordObservation(item.category, {
            verbatimExcerpt: item.verbatimExcerpt,
            sourceType: item.category === 'filler-words' ? 'transcript' : 'ai-suggestion',
            sessionRef: sessionRef.current,
            contextSentence: answer.slice(0, 100),
          });
        }
      }

      const quality = assessAnswerQuality(promptText, answer);
      const honestStructureScore = Math.max(0, Math.min(100, quality.structureScore * 10));
      const honestRelevanceScore = Math.max(0, Math.min(100, quality.relevanceScore * 10));

      // Save practice session to IndexedDB
      AppStorage.saveSession({
        id: `session-lab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        mode: 'english-lab',
        title: `English Lab: ${selectedModule.title}`,
        startedAt: new Date(Date.now() - 30000).toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: 30,
        turnsCount: 1,
        userSpokenSeconds: evaluation.concisenessMetrics?.estimatedSpokenSeconds || 20,
        summary: evaluation.clearExplanation,
        turns: [
          {
            turnIndex: 1,
            question: promptText,
            userAnswer: answer,
            correctedVersion: evaluation.correctedVersion,
            grammarMistakes: evaluation.mainMistakes.map((m) => ({
              original: m.originalSegment,
              corrected: m.correctedSegment,
              explanation: m.explanation,
            })),
            fillerWords: evaluation.fillerWordAnalysis?.fillers,
            vocabularyUpgrades: evaluation.vocabularyUpgrades.map((v) => ({
              original: v.originalWord,
              upgrade: v.upgradeWord,
              reason: v.reason,
            })),
            structureScore: honestStructureScore,
            relevanceScore: honestRelevanceScore,
          },
        ],
        metadata: {
          category: selectedModule.id,
          retryMode: isRetryMode,
        },
      }).catch((err) => console.error('Failed to save lab session to IndexedDB:', err));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to evaluate answer. Please try again.';
      console.error('Submission Error:', err);
      setErrorMsg(msg);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Trigger Retry Mode for the current question
  const handleStartRetry = (question: string, attempt1: string) => {
    setIsRetryMode(true);
    setAttempt1Answer(attempt1);
    setUserAnswerInput('');
    setIsTimerRunning(false);

    // Scroll to input smoothly
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Phase 5: Coaching Lab
            </span>
            <span className="text-xs text-slate-400">Verbatim Evidence • Retry Loop</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight mt-1">
            English Lab & Personalized Coaching
          </h1>
        </div>

        {/* Tab Switcher: Practice Drills vs Weakness Tracker Profile */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'practice'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Practice Drills
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Weakness Tracker Profile
          </button>
        </div>
      </div>

      {/* VIEW 1: PRACTICE DRILLS */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          {/* Module Selector Chips */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Choose Practice Focus
              </span>
              <span className="text-[11px] font-medium text-violet-400">
                Current: {selectedModule.badge}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {LAB_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleSelectModule(mod)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                    selectedModule.id === mod.id
                      ? 'bg-violet-950/40 border-violet-500 text-violet-200 ring-1 ring-violet-500'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold truncate">{mod.title}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{mod.subtitle}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Drill Arena Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            {/* Prompt Header */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    {selectedModule.title}
                  </span>
                  {isRetryMode && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <RotateCcwIcon size={10} />
                      Retry Mode (Attempt 2)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => speakResponse(promptText)}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Volume2Icon size={14} />
                  Hear Prompt
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80">
                <p className="text-sm font-medium text-slate-100 leading-relaxed">
                  {promptText}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>💡 Focus: {selectedModule.focusHint}</span>
                  {isRetryMode && (
                    <button
                      type="button"
                      onClick={() => setIsRetryMode(false)}
                      className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                    >
                      Cancel Retry
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 60-Second Challenge Timer (when timed) */}
            {selectedModule.isTimed && (
              <OneMinuteChallengeTimer
                durationSeconds={selectedModule.timerDuration || 60}
                isRunning={isTimerRunning}
                onToggleRunning={(running) => setIsTimerRunning(running)}
                onTimeUp={() => {
                  setIsTimerRunning(false);
                  if (isListening) stopListening();
                }}
              />
            )}

            {/* Speaking / Input Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  {isRetryMode ? 'Your Attempt 2 Response:' : 'Your Spoken Response:'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {userAnswerInput.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  value={userAnswerInput}
                  onChange={(e) => setUserAnswerInput(e.target.value)}
                  placeholder={
                    isSpeechRecognitionSupported
                      ? 'Click the microphone button to speak your answer, or type directly here...'
                      : 'Type your answer here...'
                  }
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-sans leading-relaxed resize-none"
                />

                {isListening && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-semibold text-rose-300 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Listening...
                  </div>
                )}
              </div>

              {/* Action Buttons: Voice Mic + Submit */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  {isSpeechRecognitionSupported ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (isListening) {
                          stopListening();
                        } else {
                          startListening();
                          if (selectedModule.isTimed && !isTimerRunning) {
                            setIsTimerRunning(true);
                          }
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isListening
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isListening ? <MicOffIcon size={16} /> : <MicIcon size={16} />}
                      {isListening ? 'Stop Recording' : 'Speak Your Answer'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      (Browser speech recognition unavailable — text input enabled)
                    </span>
                  )}

                  {userAnswerInput && (
                    <button
                      type="button"
                      onClick={() => setUserAnswerInput('')}
                      className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={isEvaluating || !userAnswerInput.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  {isEvaluating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Evaluating Answer...
                    </>
                  ) : isRetryMode ? (
                    'Submit Attempt 2 & Compare'
                  ) : (
                    'Review & Get 6-Point Feedback →'
                  )}
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>

          {/* 6-Item Feedback Card */}
          {currentEvaluation && (
            <div className="animate-fade-in">
              <LabFeedbackCard
                evaluation={currentEvaluation}
                onRetryQuestion={handleStartRetry}
                isRetrying={isRetryMode}
              />
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PERSONAL WEAKNESS TRACKER & PERSISTENT PROFILE */}
      {activeTab === 'profile' && (
        <div className="animate-fade-in">
          <WeaknessTrackerPanel onSelectAdaptiveDrill={handleSelectAdaptiveDrill} />
        </div>
      )}

      {/* Attempt Comparison Modal (Side-by-Side Attempt 1 vs Attempt 2) */}
      {showComparisonModal && retryComparison && (
        <AttemptComparisonModal
          question={promptText}
          comparison={retryComparison}
          onClose={() => setShowComparisonModal(false)}
          onRetryAgain={() => {
            setShowComparisonModal(false);
            setUserAnswerInput('');
          }}
        />
      )}
    </div>
  );
}
