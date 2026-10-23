'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  PracticeMode,
  ConversationMessage,
  TurnFeedback,
} from '@/types';
import {
  MicIcon,
  MicOffIcon,
  PlayIcon,
  PauseIcon,
  RotateCcwIcon,
  SquareIcon,
  SendIcon,
  SparklesIcon,
  ClockIcon,
  CheckIcon,
  AlertCircleIcon,
  BotIcon,
  UserIcon,
  InfoIcon,
  Volume2Icon,
  VolumeXIcon,
} from '@/components/icons';
import { useAIEngine } from '@/hooks/useAIEngine';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import { canSubmitInput } from '@/lib/voice';
import { AppStorage, StorageSessionMode } from '@/lib/storage';
import { PersonalWeaknessTracker } from '@/lib/english-lab/weakness-tracker';
import { compareAttempts, RetryComparisonResult } from '@/lib/conversation/retry-comparison';

interface ConversationRoomProps {
  mode: PracticeMode;
  modeTitle: string;
  modeBadge: string;
  initialQuestion: string;
  initialMessages?: ConversationMessage[];
  scenarioDetails?: {
    topic: string;
    objective: string;
    difficulty: string;
  };
}

export function ConversationRoom({
  mode,
  modeTitle,
  modeBadge,
  initialQuestion,
  initialMessages = [],
  scenarioDetails,
}: ConversationRoomProps) {
  // Session State
  const [sessionActive, setSessionActive] = useState<boolean>(true);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);

  // Transcript / Messages
  const [messages, setMessages] = useState<ConversationMessage[]>(() => {
    if (initialMessages.length > 0) return initialMessages;
    return [
      {
        id: 'msg-init',
        role: 'assistant',
        content: initialQuestion,
        timestamp: '00:00',
        audioDurationSec: 5,
      },
    ];
  });

  // Current Input & Review State
  const [textInput, setTextInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Active Feedback & Retry Comparison State
  const [activeFeedback, setActiveFeedback] = useState<TurnFeedback | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const [sessionSummaryOpen, setSessionSummaryOpen] = useState(false);
  const [activeAudioMessageId, setActiveAudioMessageId] = useState<string | null>(null);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState<boolean>(false);

  // Retry state tracking
  const [retryTargetQuestion, setRetryTargetQuestion] = useState<string | null>(null);
  const [originalAttemptText, setOriginalAttemptText] = useState<string | null>(null);
  const [originalAttemptFeedback, setOriginalAttemptFeedback] = useState<TurnFeedback | null>(null);
  const [comparisonResult, setComparisonResult] = useState<RetryComparisonResult | null>(null);

  const transcriptBottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Engine Hook
  const {
    status: aiStatus,
    isAvailable: aiAvailable,
    activeModel,
    error: aiError,
    troubleshooting,
    latencyMs,
    sendTurn,
    cancelGeneration,
    retryLastTurn,
    checkHealth,
  } = useAIEngine({
    mode,
    scenarioContext: scenarioDetails,
  });

  // Voice Engine Hook
  const {
    state: voiceState,
    stateLabel: voiceStateLabel,
    transcript: liveTranscript,
    finalizedTranscript,
    interimTranscript,
    isSpeakingDetected,
    isUserEdited,
    setTranscript: setLiveTranscript,
    clearTranscript,
    resetUserEdit,
    error: voiceError,
    clearError: clearVoiceError,
    isSpeechRecognitionSupported: isRecSupported,
    isSpeechSynthesisSupported: isSynthSupported,
    availableVoices,
    selectedVoiceURI,
    setVoiceURI,
    speechRate,
    setSpeechRate,
    autoSpeak,
    setAutoSpeak,
    startListening,
    stopListening,
    speakResponse,
    pauseSpeech,
    resumeSpeech,
    interrupt,
    cancelSession: cancelVoiceSession,
    retry: retryVoice,
    setConversationState,
  } = useVoiceEngine({
    onTranscriptChange: (liveText) => {
      if (!isUserEdited) {
        setTextInput(liveText);
      }
    },
    onTranscriptComplete: (finalText) => {
      // Keep in editable review box when finished
      if (finalText && !isUserEdited) {
        setTextInput(finalText);
      }
    },
  });

  // Live Timer
  useEffect(() => {
    if (timerRunning && sessionActive) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, sessionActive]);

  // Auto-scroll transcript on new messages
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceState, aiStatus]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  // Toggle Session Start / Pause
  const togglePauseSession = () => {
    setTimerRunning(!timerRunning);
  };

  // End Session and Save
  const handleEndSession = () => {
    setTimerRunning(false);
    setSessionActive(false);
    cancelVoiceSession();
    setActiveAudioMessageId(null);
    setSessionSummaryOpen(true);

    const userMsgs = messages.filter((m) => m.role === 'user');
    const userWords = userMsgs.reduce(
      (acc, m) => acc + m.content.split(/\s+/).filter(Boolean).length,
      0
    );
    const spokenSeconds = Math.round((userWords / 130) * 60);

    const storageMode: StorageSessionMode = mode;

    AppStorage.saveSession({
      id: `session-${mode}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      mode: storageMode,
      title: modeTitle,
      startedAt: new Date(Date.now() - secondsElapsed * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: secondsElapsed,
      turnsCount: messages.length,
      userSpokenSeconds: Math.max(5, spokenSeconds),
      summary: `Completed ${modeTitle} session with ${messages.length} total messages.`,
      turns: userMsgs.map((m, idx) => ({
        turnIndex: idx + 1,
        userAnswer: m.content,
      })),
    }).catch((err) => console.error('Failed to save conversation session to IndexedDB:', err));
  };

  // Reset Session
  const handleResetSession = () => {
    setSecondsElapsed(0);
    setTimerRunning(true);
    setSessionActive(true);
    cancelVoiceSession();
    clearTranscript();
    setTextInput('');
    setValidationError(null);
    setActiveAudioMessageId(null);
    setSessionSummaryOpen(false);
    setRetryTargetQuestion(null);
    setOriginalAttemptText(null);
    setOriginalAttemptFeedback(null);
    setComparisonResult(null);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: initialQuestion,
        timestamp: '00:00',
        audioDurationSec: 5,
      },
    ]);
    setActiveFeedback(null);
  };

  // Dispatch turn to local AI model with validation, record to weakness tracker, and compare retry
  const executeTurn = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) {
      setValidationError('Please speak or type a response first before submitting.');
      return;
    }
    setValidationError(null);

    if (!sessionActive || !canSubmitInput(voiceState)) return;

    // Halt active speech or recognition immediately
    stopListening();
    interrupt();
    setActiveAudioMessageId(null);

    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: ConversationMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      timestamp: formatTime(secondsElapsed),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setTextInput('');
    clearTranscript();
    setConversationState('processing');

    // Retrieve preferences
    let strictness: 'supportive' | 'balanced' | 'rigorous' = 'balanced';
    try {
      const saved = localStorage.getItem('yo-siri-strictness');
      if (saved === 'supportive' || saved === 'balanced' || saved === 'rigorous') {
        strictness = saved;
      }
    } catch {
      // fallback
    }

    setConversationState('generating');
    const aiResult = await sendTurn(
      updatedMessages,
      strictness,
      scenarioDetails?.difficulty || 'Intermediate'
    );

    if (aiResult) {
      const assistantMsgId = `asst-${Date.now()}`;
      const newAssistantMsg: ConversationMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: aiResult.spokenResponse,
        timestamp: formatTime(secondsElapsed + 1),
        audioDurationSec: Math.max(3, Math.round(aiResult.spokenResponse.split(' ').length / 2.5)),
        feedback: aiResult.coaching,
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
      setActiveFeedback(aiResult.coaching);

      // Connect turn feedback to Personal Weakness Tracker
      if (aiResult.coaching?.grammar && aiResult.coaching.grammar.length > 0) {
        aiResult.coaching.grammar.forEach((g) => {
          PersonalWeaknessTracker.recordObservation('tense-errors', {
            verbatimExcerpt: g.original,
            sourceType: 'transcript',
            sessionRef: `conv-${mode}`,
            contextSentence: `Corrected: "${g.corrected}" — ${g.explanation}`,
          });
        });
      }

      if (aiResult.coaching?.vocabulary && aiResult.coaching.vocabulary.length > 0) {
        aiResult.coaching.vocabulary.forEach((v) => {
          PersonalWeaknessTracker.recordObservation('repetitive-vocabulary', {
            verbatimExcerpt: v.original,
            sourceType: 'transcript',
            sessionRef: `conv-${mode}`,
            contextSentence: `Upgrade: "${v.upgrade}" — ${v.reason}`,
          });
        });
      }

      // If this was a retry attempt against a preserved previous attempt, compute before/after comparison
      if (originalAttemptText && retryTargetQuestion) {
        const comparison = compareAttempts(
          originalAttemptText,
          trimmed,
          originalAttemptFeedback,
          aiResult.coaching
        );
        setComparisonResult(comparison);

        // If weaknesses were resolved, mark resolved
        if (comparison.improvements.length > 0) {
          comparison.improvements.forEach(() => {
            PersonalWeaknessTracker.markResolved('tense-errors');
          });
        }
      }

      // Auto-speak response using browser SpeechSynthesis
      if (autoSpeak && isSynthSupported) {
        setActiveAudioMessageId(assistantMsgId);
        speakResponse(aiResult.spokenResponse, () => {
          setActiveAudioMessageId(null);
        });
      } else {
        setConversationState('idle');
      }
    } else {
      setConversationState('error');
    }
  };

  // Start a Retry for the last question
  const handleStartRetry = (targetQuestion: string, originalAnswer: string, feedback: TurnFeedback | null) => {
    setRetryTargetQuestion(targetQuestion);
    setOriginalAttemptText(originalAnswer);
    setOriginalAttemptFeedback(feedback);
    setComparisonResult(null);
    clearTranscript();
    resetUserEdit();
    setTextInput('');
    setValidationError(null);
    startListening();
  };

  // Handle Voice / Mic button click
  const handleMicClick = () => {
    setValidationError(null);

    // 1. If generating or processing, cancel generation
    if (voiceState === 'generating' || voiceState === 'processing' || aiStatus === 'generating') {
      cancelGeneration();
      cancelVoiceSession();
      setConversationState('idle');
      return;
    }

    // 2. If speaking or paused, interrupt speech
    if (voiceState === 'speaking' || voiceState === 'paused') {
      interrupt();
      setActiveAudioMessageId(null);
      return;
    }

    // 3. If currently listening, stop recognition and leave transcript in review box
    if (voiceState === 'listening') {
      stopListening();
      const currentRecognized = liveTranscript.trim() || textInput.trim();
      if (currentRecognized) {
        setTextInput(currentRecognized);
      }
      return;
    }

    // 4. If in error, retry
    if (voiceState === 'error') {
      retryVoice();
      return;
    }

    // 5. If idle, start listening
    if (voiceState === 'idle') {
      startListening();
    }
  };

  // Handle Text input submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTurn(textInput);
  };

  // Handle Retry
  const handleRetry = async () => {
    setConversationState('processing');
    const aiResult = await retryLastTurn();
    if (aiResult) {
      const assistantMsgId = `asst-${Date.now()}`;
      const newAssistantMsg: ConversationMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: aiResult.spokenResponse,
        timestamp: formatTime(secondsElapsed),
        audioDurationSec: Math.max(3, Math.round(aiResult.spokenResponse.split(' ').length / 2.5)),
        feedback: aiResult.coaching,
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
      setActiveFeedback(aiResult.coaching);
      if (autoSpeak && isSynthSupported) {
        setActiveAudioMessageId(assistantMsgId);
        speakResponse(aiResult.spokenResponse, () => {
          setActiveAudioMessageId(null);
        });
      } else {
        setConversationState('idle');
      }
    } else {
      setConversationState('error');
    }
  };

  // Real audio playback for any assistant message
  const handlePlayAudioMessage = (msg: ConversationMessage) => {
    if (activeAudioMessageId === msg.id && voiceState === 'speaking') {
      pauseSpeech();
    } else if (activeAudioMessageId === msg.id && voiceState === 'paused') {
      resumeSpeech();
    } else {
      interrupt();
      setActiveAudioMessageId(msg.id);
      speakResponse(msg.content, () => {
        setActiveAudioMessageId(null);
      });
    }
  };

  // Find the last assistant message (the current question)
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-9rem)]">
      {/* Left/Main Column: Practice Room */}
      <div className="flex-1 flex flex-col bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 sm:px-6 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-elevated)]/60">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#E8EFE9] dark:bg-[#25382B] text-[#244C3B] dark:text-[#E2F0E6] border border-[#78947B]/30">
              {modeBadge}
            </span>
            <h1 className="text-base sm:text-lg font-serif font-bold text-[var(--text-primary)]">
              {modeTitle}
            </h1>
          </div>

          {/* Model Status Badge & Session Timer */}
          <div className="flex items-center gap-2">
            {/* Active AI model & latency pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-mono ${
                aiAvailable
                  ? 'bg-[#E8EFE9] dark:bg-[#25382B] border-[#78947B]/40 text-[#244C3B] dark:text-[#E2F0E6]'
                  : 'bg-[#FBF0EC] dark:bg-[#3D2924] border-[#D87558]/40 text-[#D87558] dark:text-[#EDA089]'
              }`}
              title={aiAvailable ? `Local AI Model: ${activeModel}` : 'Ollama Offline'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  aiStatus === 'generating'
                    ? 'bg-[#D87558] animate-ping'
                    : aiAvailable
                    ? 'bg-[#244C3B] dark:bg-[#467D60]'
                    : 'bg-[#D87558]'
                }`}
              />
              <span>{activeModel}</span>
              {latencyMs && (
                <span className="text-[10px] opacity-75 font-sans">• {latencyMs}ms</span>
              )}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono font-medium text-[var(--text-primary)]">
              <ClockIcon size={14} className="text-[#244C3B] dark:text-[#467D60]" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>

            {/* Voice Mute / Unmute Button */}
            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl border text-xs transition-colors ${
                autoSpeak
                  ? 'bg-[#E8EFE9] dark:bg-[#25382B] border-[#78947B]/50 text-[#244C3B] dark:text-[#E2F0E6]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
              title={autoSpeak ? 'Voice output enabled' : 'Voice output muted'}
              aria-label={autoSpeak ? 'Mute AI voice output' : 'Enable AI voice output'}
            >
              {autoSpeak ? <Volume2Icon size={16} /> : <VolumeXIcon size={16} />}
            </button>

            {/* Voice Settings Dropdown Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setVoiceSettingsOpen(!voiceSettingsOpen)}
                className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-xs font-mono font-medium transition-colors ${
                  voiceSettingsOpen
                    ? 'bg-[#244C3B] dark:bg-[#467D60] text-white border-transparent'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
                title="Adjust speech rate and voice"
                aria-label="Voice settings"
              >
                <span>{speechRate}x</span>
              </button>

              {/* Quick Voice Settings Tray */}
              {voiceSettingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl z-50 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block mb-1.5">
                      Speech Rate
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setSpeechRate(rate)}
                          className={`min-h-[36px] py-1 rounded-lg text-center font-mono font-semibold transition-colors ${
                            speechRate === rate
                              ? 'bg-[#244C3B] dark:bg-[#467D60] text-white'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-base)]'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {availableVoices.length > 0 && (
                    <div>
                      <span className="font-semibold text-[var(--text-primary)] block mb-1.5">
                        Assistant Voice
                      </span>
                      <select
                        value={selectedVoiceURI || ''}
                        onChange={(e) => setVoiceURI(e.target.value || null)}
                        className="w-full px-2 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:ring-2 focus:ring-[#244C3B]"
                      >
                        <option value="">Default Natural Voice</option>
                        {availableVoices.slice(0, 8).map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            {v.name.slice(0, 24)} ({v.lang})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={togglePauseSession}
              disabled={!sessionActive}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              title={timerRunning ? 'Pause session' : 'Resume session'}
              aria-label={timerRunning ? 'Pause session' : 'Resume session'}
            >
              {timerRunning ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            </button>

            <button
              type="button"
              onClick={handleResetSession}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              title="Reset session"
              aria-label="Reset session"
            >
              <RotateCcwIcon size={16} />
            </button>

            <button
              type="button"
              onClick={handleEndSession}
              disabled={!sessionActive}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-[#FBF0EC] dark:bg-[#3D2924] text-[#D87558] dark:text-[#EDA089] border border-[#D87558]/30 text-xs font-semibold hover:bg-[#F3E3DD] transition-colors flex items-center gap-1.5"
            >
              <SquareIcon size={12} />
              <span>End</span>
            </button>
          </div>
        </div>

        {/* Microphone and Speech Error Banner */}
        {voiceError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3.5 rounded-2xl bg-[#FBF0EC] border border-[#D87558]/30 text-xs flex items-center justify-between text-[#D87558]">
            <div className="flex items-center gap-2">
              <AlertCircleIcon size={14} className="shrink-0" />
              <span>{voiceError.message}</span>
            </div>
            <div className="flex items-center gap-2">
              {voiceError.retryable && (
                <button
                  type="button"
                  onClick={retryVoice}
                  className="font-semibold underline hover:no-underline"
                >
                  Retry Mic
                </button>
              )}
              <button
                type="button"
                onClick={clearVoiceError}
                className="text-xs opacity-75 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* AI Health & Generation Error Banner */}
        {aiError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3.5 rounded-2xl bg-[#FBF0EC] border border-[#D87558]/30 text-xs flex items-center justify-between text-[#D87558]">
            <div className="flex items-center gap-2">
              <AlertCircleIcon size={14} className="shrink-0" />
              <span>{troubleshooting?.title || aiError}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="font-semibold underline hover:no-underline"
              >
                Retry Turn
              </button>
              <button
                type="button"
                onClick={checkHealth}
                className="text-xs opacity-75 hover:opacity-100"
              >
                Check Ollama
              </button>
            </div>
          </div>
        )}

        {/* Current Active Question Spotlight Banner (Mobile priority #1) */}
        {lastAssistantMessage && (
          <div className="p-4 sm:p-5 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#244C3B] dark:bg-[#467D60] flex items-center justify-center text-white shrink-0 mt-0.5">
              <BotIcon size={16} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#78947B] dark:text-[#8CA890]">
                  Coach Question
                </span>
                <button
                  type="button"
                  onClick={() => handlePlayAudioMessage(lastAssistantMessage)}
                  className="text-xs text-[#244C3B] dark:text-[#E2F0E6] flex items-center gap-1 font-medium hover:underline"
                >
                  <PlayIcon size={12} />
                  <span>Listen</span>
                </button>
              </div>
              <p className="text-sm sm:text-base font-serif font-medium text-[var(--text-primary)] leading-snug">
                &ldquo;{lastAssistantMessage.content}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Status Indicator (Mobile priority #2) */}
        <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                voiceState === 'listening'
                  ? isSpeakingDetected
                    ? 'bg-[#D87558] animate-ping'
                    : 'bg-[#D87558]'
                  : voiceState === 'speaking'
                  ? 'bg-[#78947B] animate-pulse'
                  : voiceState === 'processing' || voiceState === 'generating'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-[#78947B]'
              }`}
            />
            <span className="font-medium text-[var(--text-primary)]">
              {voiceState === 'listening' && isSpeakingDetected
                ? 'Speech detected — transcribing...'
                : voiceStateLabel}
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {isRecSupported ? 'Speech Recognition Online' : 'Text Fallback Mode'}
          </span>
        </div>

        {/* Transcript Conversation Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 min-h-[160px] max-h-[38vh] lg:max-h-[44vh]">
          {messages.map((msg) => {
            const isAsst = msg.role === 'assistant';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${
                  isAsst ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white text-xs ${
                    isAsst ? 'bg-[#244C3B] dark:bg-[#467D60]' : 'bg-[#78947B]'
                  }`}
                >
                  {isAsst ? <BotIcon size={14} /> : <UserIcon size={14} />}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-md">
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed border ${
                      isAsst
                        ? 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-sm'
                        : 'bg-[#244C3B] dark:bg-[#467D60] border-transparent text-white rounded-tr-sm'
                    }`}
                  >
                    <p>{msg.content}</p>

                    {isAsst && msg.feedback && (
                      <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFeedback(msg.feedback!);
                            setFeedbackOpen(true);
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#244C3B] dark:text-[#E2F0E6] hover:underline"
                        >
                          <SparklesIcon size={12} className="text-[#D87558]" />
                          <span>View Coaching Analysis</span>
                        </button>

                        {/* Retry this answer action */}
                        {lastUserMessage && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStartRetry(msg.content, lastUserMessage.content, msg.feedback || null)
                            }
                            className="text-[11px] font-semibold text-[#D87558] hover:underline flex items-center gap-1"
                          >
                            <RotateCcwIcon size={10} />
                            <span>Try Again</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] text-[var(--text-muted)] px-1 ${
                      isAsst ? 'text-left' : 'text-right'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          <div ref={transcriptBottomRef} />
        </div>

        {/* Live Word-by-Word Streaming Box & Review Textarea (Mobile priority #3 & #5) */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
          {/* Live speech preview during active listening */}
          {voiceState === 'listening' && (
            <div className="p-3.5 rounded-2xl bg-[#E8EFE9]/50 dark:bg-[#25382B]/40 border border-[#78947B]/40 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#244C3B] dark:text-[#E2F0E6]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D87558] animate-ping" />
                  <span>Recognizing words live:</span>
                </div>
                <span className="font-mono text-[10px]">interim + committed</span>
              </div>
              <p className="text-sm font-sans leading-relaxed text-[var(--text-primary)]">
                {finalizedTranscript && (
                  <span className="font-medium text-[var(--text-primary)]">{finalizedTranscript} </span>
                )}
                {interimTranscript && (
                  <span className="italic text-[#78947B] dark:text-[#8CA890]">
                    {interimTranscript}...
                  </span>
                )}
                {!finalizedTranscript && !interimTranscript && (
                  <span className="text-[var(--text-muted)] italic">Speak clearly into your microphone...</span>
                )}
              </p>
            </div>
          )}

          {/* Validation Error banner */}
          {validationError && (
            <div className="p-2.5 rounded-xl bg-[#FBF0EC] border border-[#D87558]/40 text-xs text-[#D87558] flex items-center gap-2">
              <AlertCircleIcon size={14} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Answer Review & Edit Form */}
          <form onSubmit={handleTextSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <label htmlFor="answer-review" className="font-semibold text-[var(--text-secondary)]">
                  {voiceState === 'listening' ? 'Live Transcript (Editable)' : 'Review Your Spoken Answer'}
                </label>
                {textInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setTextInput('');
                      clearTranscript();
                      setValidationError(null);
                    }}
                    className="text-[11px] text-[#D87558] hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <textarea
                id="answer-review"
                rows={2}
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setLiveTranscript(e.target.value);
                  setValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit(e);
                  }
                }}
                placeholder={
                  voiceState === 'listening'
                    ? 'Listening... words will stream here. You can also edit them directly.'
                    : 'Speak using the microphone below or type your answer here (Enter to submit)...'
                }
                className="w-full p-3 rounded-xl text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#244C3B] resize-none"
              />
            </div>

            {/* Main Controls: Large Microphone Button & Submit Actions (Mobile priority #4) */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Main Microphone Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={!sessionActive}
                  className={`min-h-[52px] min-w-[52px] rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-[#244C3B]/30 ${
                    voiceState === 'listening'
                      ? 'bg-[#D87558] hover:bg-[#C56346] text-white ring-4 ring-[#D87558]/20 scale-105'
                      : voiceState === 'speaking'
                      ? 'bg-[#78947B] hover:bg-[#68826B] text-white'
                      : voiceState === 'generating' || voiceState === 'processing'
                      ? 'bg-amber-600 text-white animate-pulse'
                      : 'bg-[#244C3B] hover:bg-[#1B3B2E] dark:bg-[#467D60] dark:hover:bg-[#589676] text-white hover:scale-105'
                  }`}
                  aria-label={
                    voiceState === 'listening'
                      ? 'Stop listening'
                      : voiceState === 'speaking'
                      ? 'Interrupt audio'
                      : 'Start speaking'
                  }
                >
                  {voiceState === 'listening' ? (
                    <SquareIcon size={20} />
                  ) : voiceState === 'speaking' ? (
                    <MicOffIcon size={20} />
                  ) : (
                    <MicIcon size={22} />
                  )}
                </button>

                <div className="hidden sm:block text-xs">
                  <span className="font-semibold text-[var(--text-primary)] block">
                    {voiceState === 'listening' ? 'Tap to finish speaking' : 'Tap to speak'}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {voiceState === 'listening' ? 'Stops mic & keeps review text' : 'Continuous live recognition'}
                  </span>
                </div>
              </div>

              {/* Submit Answer Action */}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!textInput.trim() || !sessionActive || voiceState === 'generating'}
                  className="min-h-[48px] px-5 rounded-xl bg-[#244C3B] hover:bg-[#1B3B2E] dark:bg-[#467D60] dark:hover:bg-[#589676] disabled:opacity-40 text-white font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
                >
                  <SendIcon size={16} />
                  <span>Submit Answer</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Coaching Feedback & Before/After Comparison */}
      <div className="w-full lg:w-88 flex flex-col gap-4">
        {/* Before/After Retry Comparison Panel */}
        {comparisonResult && (
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[#78947B]/40 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="text-base">🔄</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#244C3B] dark:text-[#E2F0E6]">
                  Before & After Comparison
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6]">
                Attempt 2 Analyzed
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {comparisonResult.summary}
            </p>

            {comparisonResult.improvements.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                  ✓ What Improved:
                </span>
                {comparisonResult.improvements.map((imp, idx) => (
                  <div key={idx} className="text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-1.5">
                    <span>•</span>
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            )}

            {comparisonResult.remainingIssues.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">
                  ⚠️ Remaining Considerations:
                </span>
                {comparisonResult.remainingIssues.map((rem, idx) => (
                  <div key={idx} className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                    <span>•</span>
                    <span>{rem}</span>
                  </div>
                ))}
              </div>
            )}

            {comparisonResult.newIssues.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#D87558] block">
                  ℹ️ New Considerations:
                </span>
                {comparisonResult.newIssues.map((ni, idx) => (
                  <div key={idx} className="text-xs text-[#D87558] flex items-start gap-1.5">
                    <span>•</span>
                    <span>{ni}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Real-Time Communication Feedback Panel */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <SparklesIcon size={18} className="text-[#244C3B] dark:text-[#467D60]" />
              <h2 className="text-sm font-serif font-bold text-[var(--text-primary)]">
                Coaching Feedback
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackOpen(!feedbackOpen)}
              className="text-xs text-[#244C3B] dark:text-[#E2F0E6] font-medium hover:underline"
            >
              {feedbackOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {feedbackOpen && (
            <div className="pt-4 space-y-4">
              {activeFeedback ? (
                <>
                  {/* Clarity Score Card */}
                  {activeFeedback.clarityScore !== undefined && (
                    <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                          Clarity & Delivery
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {activeFeedback.pacingNote || 'Well paced'}
                        </span>
                      </div>
                      <div className="text-xl font-bold font-mono text-[#244C3B] dark:text-[#E2F0E6]">
                        {activeFeedback.clarityScore}
                        <span className="text-xs text-[var(--text-muted)]">/100</span>
                      </div>
                    </div>
                  )}

                  {/* Fluency Tip */}
                  {activeFeedback.fluencyTip && (
                    <div className="p-3.5 rounded-xl bg-[#E8EFE9]/60 dark:bg-[#25382B]/30 border border-[#78947B]/30 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-[#244C3B] dark:text-[#E2F0E6] mb-1">
                        <CheckIcon size={14} />
                        <span>Fluency & Pacing</span>
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        {activeFeedback.fluencyTip}
                      </p>
                    </div>
                  )}

                  {/* Grammar Corrections */}
                  {activeFeedback.grammar && activeFeedback.grammar.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D87558]">
                        <AlertCircleIcon size={14} />
                        <span>Grammar Evidence & Refinements</span>
                      </div>
                      {activeFeedback.grammar.map((g, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#FBF0EC]/60 dark:bg-[#3D2924]/30 border border-[#D87558]/30 text-xs space-y-1.5"
                        >
                          <div className="line-through text-[#D87558]">
                            &ldquo;{g.original}&rdquo;
                          </div>
                          <div className="font-semibold text-[#244C3B] dark:text-[#E2F0E6]">
                            ✓ &ldquo;{g.corrected}&rdquo;
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)]">
                            {g.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vocabulary Upgrades */}
                  {activeFeedback.vocabulary && activeFeedback.vocabulary.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-[#244C3B] dark:text-[#E2F0E6] block">
                        Vocabulary Variations
                      </span>
                      {activeFeedback.vocabulary.map((v, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs space-y-1"
                        >
                          <div className="text-[var(--text-muted)]">Instead of: &quot;{v.original}&quot;</div>
                          <div className="font-semibold text-[#244C3B] dark:text-[#E2F0E6]">
                            Try: &quot;{v.upgrade}&quot;
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)]">{v.reason}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-2 border border-dashed border-[var(--border-subtle)] rounded-xl">
                  <InfoIcon size={24} className="mx-auto text-[var(--text-muted)]" />
                  <p className="font-medium text-[var(--text-primary)]">
                    Awaiting your response
                  </p>
                  <p className="text-[11px]">
                    Speak or type your answer. Yo Siri will transcribe your speech word by word and evaluate grammar, clarity, and vocabulary with evidence.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* End Session Summary Modal */}
      {sessionSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-serif font-bold text-[var(--text-primary)]">
                Session Complete
              </h3>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#E8EFE9] text-[#244C3B] dark:bg-[#25382B] dark:text-[#E2F0E6]">
                Saved
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <span className="text-[11px] text-[var(--text-muted)] block">Speaking Duration</span>
                <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  {formatTime(secondsElapsed)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <span className="text-[11px] text-[var(--text-muted)] block">Turns Completed</span>
                <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  {messages.length}
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Great practice session! All spoken answers, grammar observations, and speaking metrics have been securely saved to your local profile.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetSession}
                className="flex-1 min-h-[44px] py-2 px-4 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                Practice Again
              </button>
              <Link
                href="/progress"
                className="flex-1 min-h-[44px] py-2 px-4 rounded-xl bg-[#244C3B] hover:bg-[#1B3B2E] dark:bg-[#467D60] text-center text-xs font-semibold text-white transition-colors flex items-center justify-center"
              >
                View Weakness Radar
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
