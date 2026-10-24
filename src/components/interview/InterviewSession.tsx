'use client';

import React, { useState, useEffect } from 'react';
import {
  InterviewConfig,
  InterviewTurn,
  TurnEvaluation,
  InterviewSessionReport,
  INTERVIEW_CATEGORIES,
  parseModelEvaluation,
} from '@/lib/interview';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import { PersonalWeaknessTracker } from '@/lib/english-lab/weakness-tracker';
import {
  MicIcon,
  PlayIcon,
  PauseIcon,
  Volume2Icon,
  VolumeXIcon,
  RotateCcwIcon,
  SquareIcon,
  SendIcon,
  SparklesIcon,
  AlertCircleIcon,
  CheckIcon,
} from '@/components/icons';

interface InterviewSessionProps {
  config: InterviewConfig;
  onEndSession: (report: InterviewSessionReport) => void;
  onRestart: () => void;
}

export function InterviewSession({ config, onEndSession, onRestart }: InterviewSessionProps) {
  const [startedAt] = useState<string>(() => new Date().toISOString());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<string>(
    INTERVIEW_CATEGORIES[config.category].firstQuestion
  );
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [currentAnswerInput, setCurrentAnswerInput] = useState<string>('');
  const [isSubmittingTurn, setIsSubmittingTurn] = useState<boolean>(false);
  const [isGeneratingNextQuestion, setIsGeneratingNextQuestion] = useState<boolean>(false);
  const [isFinalizingReport, setIsFinalizingReport] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Live Turn Evaluation (for immediate and combined feedback modes)
  const [lastTurnEvaluation, setLastTurnEvaluation] = useState<TurnEvaluation | null>(null);

  // Active interaction mode (user can toggle between voice and text)
  const [interactionMode, setInteractionMode] = useState<'voice' | 'text'>(config.interactionMode);

  // Hook into Phase 3 Voice Engine
  const {
    state: conversationState,
    startListening,
    stopListening,
    speakResponse,
    pauseSpeech,
    resumeSpeech,
    interrupt,
    cancelSession,
    finalizedTranscript,
    interimTranscript,
    isSpeakingDetected,
    error: voiceError,
    retry,
    isSpeechRecognitionSupported,
  } = useVoiceEngine({
    defaultRate: 1.0,
    onTranscriptComplete: (finalText) => {
      setCurrentAnswerInput(finalText);
    },
  });

  const isSpeaking = conversationState === 'speaking';
  const isPaused = conversationState === 'paused';
  const isListening = conversationState === 'listening';
  const isRecSupported = isSpeechRecognitionSupported;

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Read initial question aloud if voice mode is active
  useEffect(() => {
    if (interactionMode === 'voice' && currentQuestion) {
      const timer = setTimeout(() => {
        speakResponse(currentQuestion);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, interactionMode, speakResponse]);

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Evaluate an answer via API
  const evaluateAnswer = async (
    question: string,
    answer: string,
    turnIndex: number
  ): Promise<TurnEvaluation | null> => {
    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_answer',
          config,
          turnIndex,
          question,
          userAnswer: answer,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.evaluation) return data.evaluation;
      }
      return parseModelEvaluation('', config, turnIndex, question, answer);
    } catch {
      return parseModelEvaluation('', config, turnIndex, question, answer);
    }
  };

  // Fetch next interviewer question via API
  const fetchNextQuestion = async (
    history: Array<{ question: string; answer: string }>,
    questionNum: number
  ): Promise<string> => {
    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'next_question',
          config,
          currentQuestionNumber: questionNum,
          totalQuestions: config.questionCount,
          history,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate follow-up question (HTTP ${res.status})`);
      }

      const data = await res.json();
      return (
        data.spokenQuestion ||
        'Could you give a concrete example illustrating how you handled that situation?'
      );
    } catch {
      return 'Can you elaborate on the technical trade-offs you considered when making that decision?';
    }
  };

  // Finalize session report and transition to report view
  const handleFinalizeReport = async (completedTurns: InterviewTurn[]) => {
    setIsFinalizingReport(true);
    interrupt();
    cancelSession();

    try {
      // Collect turn evaluations (or generate on the fly if needed)
      const evaluatedTurns: TurnEvaluation[] = [];

      for (let i = 0; i < completedTurns.length; i++) {
        const turn = completedTurns[i];
        if (turn.evaluation) {
          evaluatedTurns.push(turn.evaluation);
        } else if (turn.answer) {
          const evalResult = await evaluateAnswer(turn.question, turn.answer, i + 1);
          if (evalResult) {
            evaluatedTurns.push(evalResult);
          }
        }
      }

      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize_report',
          config,
          turns: evaluatedTurns,
          startedAt,
        }),
      });

      if (!res.ok) throw new Error('Failed to assemble session report');

      const data = await res.json();
      if (data.report) {
        if (data.report.topImprovementAreas && Array.isArray(data.report.topImprovementAreas)) {
          data.report.topImprovementAreas.forEach((area: string) => {
            PersonalWeaknessTracker.recordObservation('weak-structure', {
              verbatimExcerpt: `Interview: ${config.targetRole}`,
              sourceType: 'ai-suggestion',
              sessionRef: `interview-${config.category}`,
              contextSentence: area,
            });
          });
        }
        onEndSession(data.report);
      }
    } catch (err: unknown) {
      setSessionError(err instanceof Error ? err.message : 'Could not finalize report.');
      setIsFinalizingReport(false);
    }
  };

  // Submit candidate answer
  const handleSubmitAnswer = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const candidateAnswer = currentAnswerInput.trim();

    if (!candidateAnswer || isSubmittingTurn || isGeneratingNextQuestion || isFinalizingReport) {
      return;
    }

    setIsSubmittingTurn(true);
    setSessionError(null);

    // Stop listening if active
    if (isListening) {
      stopListening();
    }
    interrupt();

    const turnId = `turn-${currentQuestionNumber}-${Date.now()}`;
    const questionText = currentQuestion;

    // Optional turn evaluation for immediate or combined mode
    let evalResult: TurnEvaluation | null = null;
    if (config.feedbackMode === 'immediate' || config.feedbackMode === 'combined') {
      evalResult = await evaluateAnswer(questionText, candidateAnswer, currentQuestionNumber);
      if (evalResult) {
        setLastTurnEvaluation(evalResult);
        if (evalResult.keyWeaknesses && evalResult.keyWeaknesses.length > 0) {
          evalResult.keyWeaknesses.forEach((kw) => {
            PersonalWeaknessTracker.recordObservation('weak-structure', {
              verbatimExcerpt: candidateAnswer.slice(0, 100),
              sourceType: 'transcript',
              sessionRef: `interview-${config.category}`,
              contextSentence: `${evalResult?.explanation || ''} — ${kw}`,
            });
          });
        }
      }
    }

    const completedTurn: InterviewTurn = {
      id: turnId,
      questionNumber: currentQuestionNumber,
      question: questionText,
      answer: candidateAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      evaluation: evalResult || undefined,
    };

    const updatedTurns = [...turns, completedTurn];
    setTurns(updatedTurns);
    setCurrentAnswerInput('');
    setIsSubmittingTurn(false);

    // Check if target question count reached
    if (currentQuestionNumber >= config.questionCount) {
      await handleFinalizeReport(updatedTurns);
      return;
    }

    // Otherwise, generate next contextual question
    setIsGeneratingNextQuestion(true);
    const historyPayload = updatedTurns.map((t) => ({
      question: t.question,
      answer: t.answer || '',
    }));

    const nextQNum = currentQuestionNumber + 1;
    const nextQ = await fetchNextQuestion(historyPayload, nextQNum);

    setCurrentQuestionNumber(nextQNum);
    setCurrentQuestion(nextQ);
    setIsGeneratingNextQuestion(false);
  };

  const handleOrbClick = () => {
    if (isSpeaking) {
      interrupt();
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }
    if (conversationState === 'error') {
      retry();
      return;
    }
    startListening();
  };

  const progressPercent = Math.min(100, (currentQuestionNumber / config.questionCount) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Session Progress Bar */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white capitalize">
              {config.category} Interview
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              {config.targetRole}
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 hidden sm:inline">
              Persona: {config.interviewerPersona}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => handleFinalizeReport(turns)}
              disabled={isFinalizingReport}
              className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800/40 transition-colors"
            >
              {isFinalizingReport ? 'Finalizing...' : 'End & Review'}
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Restart Interview"
            >
              <RotateCcwIcon size={14} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>
              Question <strong className="text-indigo-600 dark:text-indigo-400">{currentQuestionNumber}</strong> of {config.questionCount}
            </span>
            <span>{Math.round(progressPercent)}% Completed</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {sessionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircleIcon size={16} />
            <span>{sessionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSessionError(null)}
            className="text-xs underline hover:no-underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Interviewer Question Card */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              YS
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Interviewer (Yo Siri)</span>
                {isSpeaking && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 animate-pulse font-mono">
                    Speaking aloud...
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 capitalize">
                {config.interviewerPersona} Persona • {config.category}
              </div>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-1.5">
            {isSpeaking ? (
              <button
                type="button"
                onClick={pauseSpeech}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                title="Pause Speech"
              >
                <PauseIcon size={14} />
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={resumeSpeech}
                className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 transition-colors"
                title="Resume Speech"
              >
                <PlayIcon size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => speakResponse(currentQuestion)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                title="Replay Question Audio"
              >
                <Volume2Icon size={14} />
              </button>
            )}

            {isSpeaking && (
              <button
                type="button"
                onClick={interrupt}
                className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                title="Stop / Interrupt Audio"
              >
                <VolumeXIcon size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Current Question Text */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200/80 dark:border-slate-800/80">
          <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
            {isGeneratingNextQuestion ? (
              <span className="text-slate-400 italic flex items-center gap-2">
                <SparklesIcon size={16} className="animate-spin text-indigo-500" />
                Interviewer is analyzing your response and formulating the follow-up question...
              </span>
            ) : (
              currentQuestion
            )}
          </p>
        </div>
      </section>

      {/* Immediate / Combined Feedback Banner (When available from prior turn) */}
      {lastTurnEvaluation && (config.feedbackMode === 'immediate' || config.feedbackMode === 'combined') && (
        <section className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-2xl p-4 shadow-xs space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <SparklesIcon size={14} className="text-indigo-600" />
              Instant Turn Coaching (Question {lastTurnEvaluation.turnIndex})
            </span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Clarity: {lastTurnEvaluation.clarityScore}/10
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                Relevance: {lastTurnEvaluation.relevanceScore}/10
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {lastTurnEvaluation.explanation}
          </p>

          {lastTurnEvaluation.keyWeaknesses.length > 0 && (
            <div className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5 pt-1">
              <span className="font-bold shrink-0">Tip:</span>
              <span>{lastTurnEvaluation.keyWeaknesses[0]}</span>
            </div>
          )}
        </section>
      )}

      {/* Candidate Answer Interaction Zone */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              Your Answer (Question {currentQuestionNumber} of {config.questionCount})
            </h3>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setInteractionMode('voice')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                interactionMode === 'voice'
                  ? 'bg-white dark:bg-[#0B1120] text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MicIcon size={12} />
              <span>Voice</span>
            </button>
            <button
              type="button"
              onClick={() => setInteractionMode('text')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                interactionMode === 'text'
                  ? 'bg-white dark:bg-[#0B1120] text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Text</span>
            </button>
          </div>
        </div>

        {/* Voice Microphone Orb Zone (When in Voice mode) */}
        {interactionMode === 'voice' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <button
              type="button"
              onClick={handleOrbClick}
              disabled={isSubmittingTurn || isGeneratingNextQuestion || isFinalizingReport}
              className={`min-h-[56px] min-w-[56px] w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer ${
                isListening
                  ? 'bg-[#D87558] hover:bg-[#C56346] text-white ring-4 ring-[#D87558]/20 scale-105'
                  : conversationState === 'error'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#244C3B] hover:bg-[#1B3B2E] dark:bg-[#467D60] dark:hover:bg-[#589676] text-white hover:scale-105'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start speaking'}
            >
              {isListening ? (
                <SquareIcon size={24} />
              ) : conversationState === 'error' ? (
                <RotateCcwIcon size={24} />
              ) : (
                <MicIcon size={24} />
              )}
            </button>

            <div className="text-center">
              <span className="text-xs font-semibold text-[var(--text-primary)] block">
                {isListening
                  ? isSpeakingDetected
                    ? 'Transcribing your words live...'
                    : 'Listening... Speak your answer'
                  : conversationState === 'error'
                  ? 'Microphone issue. Tap to retry or use text input below.'
                  : 'Tap microphone to speak your answer'}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                {isRecSupported ? 'Speech Recognition Active' : 'Text input mode'}
              </span>
            </div>

            {isListening && (
              <div className="px-4 py-2 rounded-xl bg-[#E8EFE9]/60 dark:bg-[#25382B]/40 border border-[#78947B]/30 text-xs text-[var(--text-primary)] max-w-md text-center leading-relaxed">
                {finalizedTranscript && <span className="font-medium text-[var(--text-primary)]">{finalizedTranscript} </span>}
                {interimTranscript && <span className="italic text-[#78947B] dark:text-[#8CA890]">{interimTranscript}...</span>}
                {!finalizedTranscript && !interimTranscript && <span className="text-[var(--text-muted)] italic">Listening for speech...</span>}
              </div>
            )}

            {voiceError && (
              <div className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircleIcon size={12} />
                <span>{voiceError.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Answer Text Area (Editable recognized speech or typed input) */}
        <form onSubmit={handleSubmitAnswer} className="space-y-3">
          <div>
            <textarea
              rows={4}
              value={currentAnswerInput}
              onChange={(e) => setCurrentAnswerInput(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening... Your spoken answer streams here in real time. You can edit it anytime.'
                  : 'Formulate your answer here. Take your time to structure your thoughts...'
              }
              disabled={isSubmittingTurn || isGeneratingNextQuestion || isFinalizingReport}
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-slate-400">
              Word Count: <strong className="font-mono text-slate-700 dark:text-slate-300">{currentAnswerInput.trim().split(/\s+/).filter(Boolean).length}</strong> words
              (Suggested: ~50-150 words for concise delivery)
            </span>

            <button
              type="submit"
              disabled={
                !currentAnswerInput.trim() ||
                isSubmittingTurn ||
                isGeneratingNextQuestion ||
                isFinalizingReport
              }
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmittingTurn ? (
                <>
                  <SparklesIcon size={14} className="animate-spin" />
                  <span>Evaluating Answer...</span>
                </>
              ) : isGeneratingNextQuestion ? (
                <>
                  <SparklesIcon size={14} className="animate-spin" />
                  <span>Next Question...</span>
                </>
              ) : currentQuestionNumber >= config.questionCount ? (
                <>
                  <CheckIcon size={14} />
                  <span>Submit Final Answer & Finish</span>
                </>
              ) : (
                <>
                  <SendIcon size={14} />
                  <span>Submit Answer & Continue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Preserved Answer History Drawer */}
      {turns.length > 0 && (
        <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Interview History ({turns.length} Answered)
          </h4>

          <div className="space-y-3">
            {turns.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-xs space-y-2"
              >
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    Question {t.questionNumber}
                  </span>
                  <span>{t.timestamp}</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {t.question}
                </div>
                <div className="text-slate-600 dark:text-slate-300 bg-white dark:bg-[#0B1120] p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 leading-relaxed">
                  <span className="font-bold text-[11px] text-slate-400 block mb-0.5">Your Recorded Answer:</span>
                  {t.answer}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
