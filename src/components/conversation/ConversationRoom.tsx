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

  // Current Input & Feedback
  const [textInput, setTextInput] = useState('');
  const [activeFeedback, setActiveFeedback] = useState<TurnFeedback | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const [sessionSummaryOpen, setSessionSummaryOpen] = useState(false);
  const [activeAudioMessageId, setActiveAudioMessageId] = useState<string | null>(null);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState<boolean>(false);

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
    setTranscript: setLiveTranscript,
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
    onTranscriptComplete: (finalText) => {
      setTextInput(finalText);
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

  // End Session
  const handleEndSession = () => {
    setTimerRunning(false);
    setSessionActive(false);
    cancelVoiceSession();
    setActiveAudioMessageId(null);
    setSessionSummaryOpen(true);
  };

  // Reset Session
  const handleResetSession = () => {
    setSecondsElapsed(0);
    setTimerRunning(true);
    setSessionActive(true);
    cancelVoiceSession();
    setActiveAudioMessageId(null);
    setSessionSummaryOpen(false);
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

  // Dispatch turn to local AI model
  const executeTurn = async (userText: string) => {
    if (!userText.trim() || !sessionActive || !canSubmitInput(voiceState)) return;

    // Halt active speech or recognition immediately
    stopListening();
    interrupt();
    setActiveAudioMessageId(null);

    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: ConversationMessage = {
      id: userMsgId,
      role: 'user',
      content: userText.trim(),
      timestamp: formatTime(secondsElapsed),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setTextInput('');
    setLiveTranscript('');
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

  // Handle Voice / Mic button click
  const handleMicClick = () => {
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

    // 3. If currently listening, stop recognition and send if there's text
    if (voiceState === 'listening') {
      stopListening();
      const textToSend = textInput.trim() || liveTranscript.trim();
      if (textToSend) {
        executeTurn(textToSend);
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
    if (!textInput.trim() || !sessionActive || !canSubmitInput(voiceState)) return;
    const text = textInput;
    setTextInput('');
    executeTurn(text);
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* Left/Main Column: Practice Room */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#161F30]/50">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
              {modeBadge}
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {modeTitle}
            </h1>
          </div>

          {/* Model Status Badge & Session Timer */}
          <div className="flex items-center gap-2">
            {/* Active AI model & latency pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono ${
                aiAvailable
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/40 text-rose-700 dark:text-rose-300'
              }`}
              title={aiAvailable ? `Local AI Model: ${activeModel}` : 'Ollama Offline'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  aiStatus === 'generating'
                    ? 'bg-amber-400 animate-ping'
                    : aiAvailable
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
              />
              <span>{activeModel}</span>
              {latencyMs && (
                <span className="text-[10px] opacity-75 font-sans">• {latencyMs}ms</span>
              )}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium text-slate-700 dark:text-slate-200">
              <ClockIcon size={14} className="text-indigo-500" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>

            {/* Voice Mute / Unmute Button */}
            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                autoSpeak
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
              title={autoSpeak ? 'Voice output enabled (click to mute)' : 'Voice output muted (click to speak responses aloud)'}
              aria-label={autoSpeak ? 'Mute AI voice output' : 'Enable AI voice output'}
            >
              {autoSpeak ? <Volume2Icon size={16} /> : <VolumeXIcon size={16} />}
            </button>

            {/* Voice Settings Dropdown Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setVoiceSettingsOpen(!voiceSettingsOpen)}
                className={`px-2 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
                  voiceSettingsOpen
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Adjust speech rate and voice"
                aria-label="Voice settings"
              >
                <span>{speechRate}x</span>
              </button>

              {/* Quick Voice Settings Tray */}
              {voiceSettingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl bg-white dark:bg-[#172033] border border-slate-200 dark:border-slate-700 shadow-xl z-50 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block mb-1.5">
                      Speech Rate
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            setSpeechRate(rate);
                          }}
                          className={`py-1 rounded text-center font-mono font-semibold transition-colors ${
                            speechRate === rate
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {availableVoices.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block mb-1.5">
                        Assistant Voice
                      </span>
                      <select
                        value={selectedVoiceURI || ''}
                        onChange={(e) => setVoiceURI(e.target.value || null)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Default Natural Voice</option>
                        {availableVoices.slice(0, 10).map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            {v.name.slice(0, 28)} ({v.lang})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
                    <span>Speech Synthesis</span>
                    <span className="text-emerald-500 font-medium">Ready</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={togglePauseSession}
              disabled={!sessionActive}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              title={timerRunning ? 'Pause session' : 'Resume session'}
              aria-label={timerRunning ? 'Pause session' : 'Resume session'}
            >
              {timerRunning ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            </button>

            <button
              type="button"
              onClick={handleResetSession}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset session"
              aria-label="Reset session"
            >
              <RotateCcwIcon size={16} />
            </button>

            <button
              type="button"
              onClick={handleEndSession}
              disabled={!sessionActive}
              className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors flex items-center gap-1.5"
            >
              <SquareIcon size={12} />
              <span>End</span>
            </button>
          </div>
        </div>

        {/* Objective Banner */}
        {scenarioDetails && (
          <div className="px-6 py-2.5 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-100/60 dark:border-indigo-900/30 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                Objective:
              </span>
              <span>{scenarioDetails.objective}</span>
            </div>
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Level: {scenarioDetails.difficulty}
            </span>
          </div>
        )}

        {/* Unsupported Speech Recognition Notice */}
        {!isRecSupported && (
          <div className="px-6 py-2 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <InfoIcon size={14} className="text-indigo-500 shrink-0" />
              <span>
                Speech recognition is not supported in this browser. Text mode is fully active, and assistant responses will still be spoken aloud.
              </span>
            </div>
          </div>
        )}

        {/* Voice Recognition Error Banner */}
        {voiceError && (
          <div className="m-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertCircleIcon size={16} />
                <span>Microphone / Speech Notice</span>
              </div>
              <div className="flex items-center gap-2">
                {voiceError.retryable && (
                  <button
                    type="button"
                    onClick={retryVoice}
                    className="px-2.5 py-1 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Retry Mic
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearVoiceError}
                  className="px-2 py-1 rounded border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300">{voiceError.message}</p>
            {voiceError.advice && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                💡 {voiceError.advice}
              </p>
            )}
          </div>
        )}

        {/* AI Error & Troubleshooting Notification Banner */}
        {aiError && (
          <div className="m-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                <AlertCircleIcon size={16} />
                <span>{troubleshooting?.title || 'AI Engine Error'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors"
                >
                  Retry Turn
                </button>
                <button
                  type="button"
                  onClick={checkHealth}
                  className="px-2 py-1 rounded border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                >
                  Check Ollama
                </button>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              {troubleshooting?.explanation || aiError}
            </p>
            {troubleshooting?.command && (
              <div className="font-mono text-[11px] bg-slate-900 text-slate-100 p-2 rounded-lg flex items-center justify-between">
                <span>{troubleshooting.command}</span>
                <span className="text-[10px] text-slate-400">Run in terminal</span>
              </div>
            )}
          </div>
        )}

        {/* Transcript Conversation Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[50vh] lg:max-h-[52vh]">
          {messages.map((msg) => {
            const isAsst = msg.role === 'assistant';
            const isPlayingThis = activeAudioMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${
                  isAsst ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
                    isAsst ? 'bg-indigo-600' : 'bg-slate-600 dark:bg-slate-700'
                  }`}
                >
                  {isAsst ? <BotIcon size={16} /> : <UserIcon size={16} />}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col gap-1">
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isAsst
                        ? 'bg-slate-100 dark:bg-[#172033] text-slate-900 dark:text-slate-100 rounded-tl-sm'
                        : 'bg-indigo-600 text-white rounded-tr-sm'
                    }`}
                  >
                    <p>{msg.content}</p>

                    {/* Audio playback controls for assistant */}
                    {isAsst && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePlayAudioMessage(msg)}
                            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
                            aria-label={
                              isPlayingThis && voiceState === 'speaking'
                                ? 'Pause speech'
                                : isPlayingThis && voiceState === 'paused'
                                ? 'Resume speech'
                                : 'Play response aloud'
                            }
                          >
                            {isPlayingThis && voiceState === 'speaking' ? (
                              <>
                                <PauseIcon size={12} className="text-amber-500" />
                                <span className="font-semibold text-amber-500">Pause voice</span>
                              </>
                            ) : isPlayingThis && voiceState === 'paused' ? (
                              <>
                                <PlayIcon size={12} className="text-emerald-500" />
                                <span className="font-semibold text-emerald-500">Resume voice</span>
                              </>
                            ) : (
                              <>
                                <PlayIcon size={12} />
                                <span>Play aloud</span>
                              </>
                            )}
                          </button>

                          {isPlayingThis && (
                            <button
                              type="button"
                              onClick={interrupt}
                              className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                              title="Stop speech"
                            >
                              <SquareIcon size={10} />
                              <span>Stop</span>
                            </button>
                          )}
                        </div>

                        {msg.feedback && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFeedback(msg.feedback!);
                              setFeedbackOpen(true);
                            }}
                            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-500"
                          >
                            <SparklesIcon size={12} className="text-amber-400" />
                            <span>View Coaching Notes</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] text-slate-400 px-1 ${
                      isAsst ? 'text-left' : 'text-right'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Live Voice Recognition interim bubble */}
          {voiceState === 'listening' && (
            <div className="flex gap-3 max-w-md ml-auto flex-row-reverse animate-pulse">
              <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/30">
                <MicIcon size={16} />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tr-sm bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                <p className="font-semibold text-[11px] mb-1">Live voice recognition:</p>
                <p className="italic font-medium">{liveTranscript || 'Listening... Speak into your microphone'}</p>
                <p className="text-[10px] opacity-75 mt-1.5">Tap microphone orb or press Enter to send</p>
              </div>
            </div>
          )}

          {voiceState === 'requestingPermission' && (
            <div className="flex gap-3 max-w-md ml-auto flex-row-reverse animate-pulse">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0">
                <MicIcon size={16} />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tr-sm bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
                Requesting microphone permission from your browser...
              </div>
            </div>
          )}

          {(voiceState === 'processing' || voiceState === 'generating' || aiStatus === 'generating') && (
            <div className="flex gap-3 max-w-md mr-auto">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <BotIcon size={16} />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-[#172033] text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                <span>Yo Siri ({activeModel}) is thinking...</span>
                <button
                  type="button"
                  onClick={() => {
                    cancelGeneration();
                    cancelVoiceSession();
                    setConversationState('idle');
                  }}
                  className="ml-2 text-[11px] underline text-rose-500 hover:text-rose-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div ref={transcriptBottomRef} />
        </div>

        {/* Voice Interaction & Input Control Bar */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/70 dark:bg-[#131B2E]/70 flex flex-col items-center gap-4">
          {/* Prominent Voice Orb Interaction Area */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring in listening / speaking state */}
              {voiceState === 'listening' && (
                <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full bg-rose-500/20 animate-ping" />
              )}
              {voiceState === 'speaking' && (
                <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full bg-violet-500/20 animate-pulse" />
              )}
              {voiceState === 'requestingPermission' && (
                <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full bg-amber-500/20 animate-pulse" />
              )}

              {/* Main Microphone Button representing all 8 states */}
              <button
                type="button"
                onClick={handleMicClick}
                disabled={!sessionActive}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/50 ${
                  voiceState === 'generating' || aiStatus === 'generating'
                    ? 'bg-amber-600 text-white animate-pulse'
                    : voiceState === 'requestingPermission'
                    ? 'bg-amber-500 text-white animate-bounce'
                    : voiceState === 'listening'
                    ? 'bg-rose-600 text-white scale-110 shadow-rose-500/40 ring-4 ring-rose-500/20'
                    : voiceState === 'speaking'
                    ? 'bg-violet-600 text-white shadow-violet-500/40 ring-4 ring-violet-500/20'
                    : voiceState === 'paused'
                    ? 'bg-amber-600 text-white'
                    : voiceState === 'error'
                    ? 'bg-rose-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 shadow-indigo-500/30'
                }`}
                aria-label={
                  voiceState === 'generating' || aiStatus === 'generating'
                    ? 'Cancel AI generation'
                    : voiceState === 'listening'
                    ? 'Stop listening and submit'
                    : voiceState === 'speaking'
                    ? 'Interrupt assistant speech'
                    : voiceState === 'paused'
                    ? 'Resume assistant speech'
                    : voiceState === 'error'
                    ? 'Retry microphone'
                    : 'Tap to speak'
                }
              >
                {voiceState === 'generating' || aiStatus === 'generating' ? (
                  <SquareIcon size={20} />
                ) : voiceState === 'requestingPermission' ? (
                  <MicIcon size={24} className="animate-pulse" />
                ) : voiceState === 'listening' ? (
                  <SquareIcon size={24} />
                ) : voiceState === 'speaking' ? (
                  <MicOffIcon size={24} />
                ) : voiceState === 'paused' ? (
                  <PlayIcon size={24} />
                ) : voiceState === 'error' ? (
                  <RotateCcwIcon size={24} />
                ) : (
                  <MicIcon size={24} />
                )}
              </button>
            </div>

            {/* Audio Waveform Simulator Bars */}
            <div className="flex items-center gap-1 h-6">
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'generating' || aiStatus === 'generating'
                    ? 'h-5 bg-indigo-500 animate-voice-bar-1'
                    : 'h-1.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'generating' || aiStatus === 'generating'
                    ? 'h-6 bg-indigo-500 animate-voice-bar-2'
                    : 'h-2 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'generating' || aiStatus === 'generating'
                    ? 'h-4 bg-indigo-500 animate-voice-bar-3'
                    : 'h-3 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'generating' || aiStatus === 'generating'
                    ? 'h-6 bg-indigo-500 animate-voice-bar-4'
                    : 'h-2 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'generating' || aiStatus === 'generating'
                    ? 'h-3 bg-indigo-500 animate-voice-bar-5'
                    : 'h-1.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>

            {/* Status Label */}
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {voiceStateLabel}
              </p>
              <p className="text-[10px] text-slate-400">
                {isRecSupported ? 'Speech recognition ready' : 'Text input mode'} • {isSynthSupported ? `Voice synthesis active (${speechRate}x)` : 'Audio output unavailable'}
              </p>
            </div>
          </div>

          {/* Text Input Fallback & Live Transcript Bar */}
          <form
            onSubmit={handleTextSubmit}
            className="w-full max-w-xl flex items-center gap-2 mt-1"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                setLiveTranscript(e.target.value);
              }}
              placeholder={
                voiceState === 'listening'
                  ? 'Listening... Your words appear here (or edit while speaking)...'
                  : 'Type your spoken response or question here...'
              }
              disabled={!sessionActive || voiceState === 'generating' || aiStatus === 'generating'}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors disabled:opacity-50"
            />
            {voiceState === 'generating' || aiStatus === 'generating' ? (
              <button
                type="button"
                onClick={() => {
                  cancelGeneration();
                  cancelVoiceSession();
                  setConversationState('idle');
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 flex items-center gap-1.5"
              >
                <SquareIcon size={14} />
                <span>Cancel</span>
              </button>
            ) : voiceState === 'speaking' ? (
              <button
                type="button"
                onClick={interrupt}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 flex items-center gap-1.5"
                title="Interrupt AI voice"
              >
                <MicOffIcon size={14} />
                <span>Interrupt</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!textInput.trim() || !sessionActive}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Send message"
              >
                <SendIcon size={18} />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Right Column: Real-Time Communication Feedback Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1E293B]">
            <div className="flex items-center gap-2">
              <SparklesIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Coaching Feedback
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackOpen(!feedbackOpen)}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
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
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Clarity Score
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {activeFeedback.pacingNote || 'Well paced'}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {activeFeedback.clarityScore}
                        <span className="text-xs text-slate-400">/100</span>
                      </div>
                    </div>
                  )}

                  {/* Fluency Tip */}
                  {activeFeedback.fluencyTip && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/40 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                        <CheckIcon size={14} />
                        <span>Fluency & Pacing</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {activeFeedback.fluencyTip}
                      </p>
                    </div>
                  )}

                  {/* Grammar Corrections */}
                  {activeFeedback.grammar && activeFeedback.grammar.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        <AlertCircleIcon size={14} />
                        <span>Grammar Refinement</span>
                      </div>
                      {activeFeedback.grammar.map((g, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 text-xs space-y-1.5"
                        >
                          <div className="line-through text-rose-600/80 dark:text-rose-400/80">
                            {g.original}
                          </div>
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                            ✓ {g.corrected}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {g.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vocabulary Upgrades */}
                  {activeFeedback.vocabulary && activeFeedback.vocabulary.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block">
                        Vocabulary Upgrade
                      </span>
                      {activeFeedback.vocabulary.map((v, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/40 text-xs space-y-1"
                        >
                          <div className="text-slate-500">Instead of: &quot;{v.original}&quot;</div>
                          <div className="font-semibold text-indigo-700 dark:text-indigo-300">
                            Try: &quot;{v.upgrade}&quot;
                          </div>
                          <div className="text-[11px] text-slate-400">{v.reason}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <InfoIcon size={24} className="mx-auto text-slate-400" />
                  <p className="font-medium text-slate-600 dark:text-slate-300">
                    Awaiting your response
                  </p>
                  <p className="text-[11px]">
                    Speak or type your answer. Yo Siri ({activeModel}) will respond naturally and give immediate grammar, pacing, and vocabulary feedback.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Practice Objectives Card */}
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] p-5 shadow-sm text-xs space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white">Active Focus Areas</h3>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>Listen actively and answer the specific question asked</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>Use precise verbs and keep responses to 2-3 sentences</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>Notice grammar corrections and reuse the upgraded phrases</span>
            </li>
          </ul>
        </div>
      </div>

      {/* End Session Summary Modal */}
      {sessionSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Session Complete
              </h3>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Completed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Speaking Duration</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatTime(secondsElapsed)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Turns Completed</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {messages.length}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Great practice session with <strong>{activeModel}</strong>! You maintained good conversational momentum. Your speaking time and feedback will be logged for your streak.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetSession}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Practice Again
              </button>
              <Link
                href="/"
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-center text-xs font-semibold text-white transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
