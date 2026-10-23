'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  PracticeMode,
  SessionVoiceState,
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
} from '@/components/icons';
import { useAIEngine } from '@/hooks/useAIEngine';

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
  const [voiceState, setVoiceState] = useState<SessionVoiceState>('idle');
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
    setVoiceState('idle');
    setSessionSummaryOpen(true);
  };

  // Reset Session
  const handleResetSession = () => {
    setSecondsElapsed(0);
    setTimerRunning(true);
    setSessionActive(true);
    setVoiceState('idle');
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
    if (!userText.trim() || !sessionActive) return;

    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: ConversationMessage = {
      id: userMsgId,
      role: 'user',
      content: userText.trim(),
      timestamp: formatTime(secondsElapsed),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setVoiceState('processing');

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
      setVoiceState('speaking');

      // Visual waveform indicator
      setTimeout(() => {
        setVoiceState('idle');
      }, 3500);
    } else {
      // Generation failed or was cancelled
      setVoiceState('idle');
    }
  };

  // Handle Voice / Mic button click
  const handleMicClick = () => {
    if (aiStatus === 'generating') {
      cancelGeneration();
      setVoiceState('idle');
      return;
    }

    if (voiceState === 'listening') {
      // Finished speaking prompt (in Phase 2 this submits a test spoken turn)
      setVoiceState('processing');
      const sampleSpokenTurns: Record<PracticeMode, string> = {
        conversation:
          'I really enjoy building software with local AI because it guarantees data privacy and works completely offline.',
        interview:
          'In my previous role, I designed a caching layer that reduced database load by 35% during peak traffic spikes.',
        'english-lab':
          'If I would have known about the deadline earlier, I will have finished the presentation in time.',
        roleplay:
          'I understand the budget constraints, but based on my recent delivery of the auth system, a 10% raise reflects my contribution.',
      };

      executeTurn(sampleSpokenTurns[mode]);
    } else if (voiceState === 'idle') {
      setVoiceState('listening');
    } else if (voiceState === 'speaking') {
      setVoiceState('idle');
    }
  };

  // Handle Text input submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !sessionActive || aiStatus === 'generating') return;
    const text = textInput;
    setTextInput('');
    executeTurn(text);
  };

  // Handle Retry
  const handleRetry = async () => {
    setVoiceState('processing');
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
      setVoiceState('speaking');
      setTimeout(() => {
        setVoiceState('idle');
      }, 3500);
    } else {
      setVoiceState('idle');
    }
  };

  // Simulated audio replay for any message
  const playAudioSimulation = (messageId: string) => {
    setActiveAudioMessageId(messageId);
    setVoiceState('speaking');
    setTimeout(() => {
      setActiveAudioMessageId(null);
      setVoiceState('idle');
    }, 3000);
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

                    {/* Audio replay button for assistant */}
                    {isAsst && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => playAudioSimulation(msg.id)}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
                        >
                          <PlayIcon size={12} className={isPlayingThis ? 'text-emerald-500' : ''} />
                          <span>{isPlayingThis ? 'Playing audio...' : 'Replay audio'}</span>
                        </button>
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

          {/* Voice State Indicator Bubble (when listening/processing) */}
          {voiceState === 'listening' && (
            <div className="flex gap-3 max-w-md ml-auto flex-row-reverse animate-pulse">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white shrink-0">
                <MicIcon size={16} />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tr-sm bg-violet-600/10 border border-violet-500/30 text-violet-700 dark:text-violet-300 text-xs">
                Listening to speech... (Tap microphone orb again to send)
              </div>
            </div>
          )}

          {(voiceState === 'processing' || aiStatus === 'generating') && (
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
                  onClick={cancelGeneration}
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
                <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full bg-indigo-500/20 animate-ping" />
              )}
              {voiceState === 'speaking' && (
                <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full bg-violet-500/20 animate-pulse" />
              )}

              {/* Main Microphone Button */}
              <button
                type="button"
                onClick={handleMicClick}
                disabled={!sessionActive}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/50 ${
                  aiStatus === 'generating'
                    ? 'bg-amber-600 text-white animate-pulse'
                    : voiceState === 'listening'
                    ? 'bg-rose-600 text-white scale-110 shadow-rose-500/40 ring-4 ring-rose-500/20'
                    : voiceState === 'speaking'
                    ? 'bg-violet-600 text-white shadow-violet-500/40 ring-4 ring-violet-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 shadow-indigo-500/30'
                }`}
                aria-label={
                  aiStatus === 'generating'
                    ? 'Cancel generation'
                    : voiceState === 'listening'
                    ? 'Stop listening'
                    : voiceState === 'speaking'
                    ? 'Interrupt assistant'
                    : 'Tap to speak'
                }
              >
                {aiStatus === 'generating' ? (
                  <SquareIcon size={20} />
                ) : voiceState === 'listening' ? (
                  <SquareIcon size={24} />
                ) : voiceState === 'speaking' ? (
                  <MicOffIcon size={24} />
                ) : (
                  <MicIcon size={24} />
                )}
              </button>
            </div>

            {/* Audio Waveform Simulator Bars */}
            <div className="flex items-center gap-1 h-6">
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking' || aiStatus === 'generating'
                    ? 'h-5 bg-indigo-500 animate-voice-bar-1'
                    : 'h-1.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking' || aiStatus === 'generating'
                    ? 'h-6 bg-indigo-500 animate-voice-bar-2'
                    : 'h-2 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking' || aiStatus === 'generating'
                    ? 'h-4 bg-indigo-500 animate-voice-bar-3'
                    : 'h-3 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking' || aiStatus === 'generating'
                    ? 'h-6 bg-indigo-500 animate-voice-bar-4'
                    : 'h-2 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking' || aiStatus === 'generating'
                    ? 'h-3 bg-indigo-500 animate-voice-bar-5'
                    : 'h-1.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>

            {/* Status Label */}
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {aiStatus === 'generating'
                  ? `Thinking with ${activeModel}... (Click orb to cancel)`
                  : voiceState === 'listening'
                  ? 'Listening... (Speak or tap again to send)'
                  : voiceState === 'speaking'
                  ? 'Yo Siri speaking... (Tap orb to interrupt)'
                  : 'Tap orb to speak'}
              </p>
              <p className="text-[10px] text-slate-400">
                Connected to local Ollama ({activeModel}) • 100% offline & private
              </p>
            </div>
          </div>

          {/* Text Input Fallback Bar */}
          <form
            onSubmit={handleTextSubmit}
            className="w-full max-w-xl flex items-center gap-2 mt-1"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type your spoken response here..."
              disabled={!sessionActive || aiStatus === 'generating'}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors disabled:opacity-50"
            />
            {aiStatus === 'generating' ? (
              <button
                type="button"
                onClick={cancelGeneration}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 flex items-center gap-1.5"
              >
                <SquareIcon size={14} />
                <span>Cancel</span>
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
