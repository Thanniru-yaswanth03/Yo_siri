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
        timestamp: 'Just now',
        audioDurationSec: 6,
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
  }, [messages, voiceState]);

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
        timestamp: 'Just now',
        audioDurationSec: 5,
      },
    ]);
    setActiveFeedback(null);
  };

  // Simulated Speech-to-Text & Assistant Generation
  const simulateVoiceInput = () => {
    if (voiceState === 'listening') {
      // User tapped to finish speaking
      setVoiceState('processing');

      // Sample simulated user utterances based on mode
      const sampleUserTurns: Record<PracticeMode, string> = {
        conversation:
          'I usually enjoy hiking on weekends because it clears my mind and helps me stay refreshed for work.',
        interview:
          'In my last project, I led the migration from a monolithic backend to microservices, which reduced API latency by 40%.',
        'english-lab':
          'If I would have known about the deadline earlier, I will have finished the presentation in time.',
        roleplay:
          'I understand your budget constraints, but based on my contributions and market benchmarks, a 15% adjustment reflects my scope.',
      };

      const spokenContent = sampleUserTurns[mode];

      setTimeout(() => {
        const userMsgId = `user-${Date.now()}`;
        const newUserMsg: ConversationMessage = {
          id: userMsgId,
          role: 'user',
          content: spokenContent,
          timestamp: formatTime(secondsElapsed),
        };

        // Formulate feedback
        const sampleFeedback: TurnFeedback =
          mode === 'english-lab'
            ? {
                grammar: [
                  {
                    original: 'If I would have known... I will have finished',
                    corrected: 'If I had known... I would have finished',
                    explanation: 'Third conditional requires "had + past participle" in the if-clause and "would have + past participle" in the main clause.',
                  },
                ],
                vocabulary: [
                  {
                    original: 'finished in time',
                    upgrade: 'delivered ahead of schedule',
                    reason: 'More professional and impact-driven phrasing.',
                  },
                ],
                fluencyTip: 'Good sentence rhythm, but pause slightly after conditional clauses for added clarity.',
                clarityScore: 78,
                pacingNote: '128 WPM (Optimal cadence)',
              }
            : {
                grammar: [],
                vocabulary: [
                  {
                    original: 'clears my mind',
                    upgrade: 'rejuvenates mental focus',
                    reason: 'Adds professional articulation.',
                  },
                ],
                fluencyTip: 'Great natural delivery! You sounded confident and articulate without filler words.',
                clarityScore: 94,
                pacingNote: '135 WPM (Engaging flow)',
              };

        // Formulate assistant response
        const sampleReplies: Record<PracticeMode, string> = {
          conversation:
            'Hiking is a fantastic way to reset. Which trail or landscape do you find most scenic when you want to disconnect?',
          interview:
            'That is a measurable latency reduction. How did you ensure data consistency between services during that transition phase?',
          'english-lab':
            'Notice the third conditional structure here: "If I had known about the deadline earlier, I would have delivered the presentation ahead of schedule." Try saying that back to me!',
          roleplay:
            'I appreciate you laying out those benchmarks. Let’s look at how we can balance that with the quarterly department cap—could we tie part of it to performance milestones?',
        };

        const assistantMsgId = `asst-${Date.now()}`;
        const newAssistantMsg: ConversationMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: sampleReplies[mode],
          timestamp: formatTime(secondsElapsed + 2),
          audioDurationSec: 5,
          feedback: sampleFeedback,
        };

        setMessages((prev) => [...prev, newUserMsg, newAssistantMsg]);
        setActiveFeedback(sampleFeedback);
        setVoiceState('speaking');

        // Simulate speaking duration
        setTimeout(() => {
          setVoiceState('idle');
        }, 4000);
      }, 1200);
    } else if (voiceState === 'idle') {
      // Start listening
      setVoiceState('listening');
    } else if (voiceState === 'speaking') {
      // User interrupts speaking
      setVoiceState('idle');
    }
  };

  // Text message submission fallback
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !sessionActive) return;

    const userText = textInput.trim();
    setTextInput('');

    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: ConversationMessage = {
      id: userMsgId,
      role: 'user',
      content: userText,
      timestamp: formatTime(secondsElapsed),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setVoiceState('processing');

    // Simulate assistant reply with coaching feedback
    setTimeout(() => {
      const assistantMsgId = `asst-${Date.now()}`;
      const feedback: TurnFeedback = {
        grammar: [],
        vocabulary: [
          {
            original: 'think about',
            upgrade: 'deliberate on / evaluate',
            reason: 'Demonstrates deeper technical consideration.',
          },
        ],
        fluencyTip: 'Clear expression. For added impact in spoken communication, lead with your conclusion first.',
        clarityScore: 88,
        pacingNote: 'Text-mode submission',
      };

      const newAssistantMsg: ConversationMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: `Thank you for sharing that perspective. When explaining this to a stakeholder, what would be the primary trade-off you highlight first?`,
        timestamp: formatTime(secondsElapsed + 1),
        audioDurationSec: 4,
        feedback,
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
      setActiveFeedback(feedback);
      setVoiceState('speaking');

      setTimeout(() => {
        setVoiceState('idle');
      }, 3500);
    }, 1000);
  };

  // Simulated audio playback for any message
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

          {/* Session Timer & Status Controls */}
          <div className="flex items-center gap-2">
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

        {/* Scenario Details Objective Banner (if provided) */}
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

          {voiceState === 'processing' && (
            <div className="flex gap-3 max-w-md mr-auto">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <BotIcon size={16} />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-[#172033] text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                <span>Formulating response & grammar analysis...</span>
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
                onClick={simulateVoiceInput}
                disabled={!sessionActive}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/50 ${
                  voiceState === 'listening'
                    ? 'bg-rose-600 text-white scale-110 shadow-rose-500/40 ring-4 ring-rose-500/20'
                    : voiceState === 'speaking'
                    ? 'bg-violet-600 text-white shadow-violet-500/40 ring-4 ring-violet-500/20'
                    : voiceState === 'processing'
                    ? 'bg-amber-600 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 shadow-indigo-500/30'
                }`}
                aria-label={
                  voiceState === 'listening'
                    ? 'Stop listening'
                    : voiceState === 'speaking'
                    ? 'Interrupt assistant'
                    : 'Tap to speak'
                }
              >
                {voiceState === 'listening' ? (
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
                  voiceState === 'listening' || voiceState === 'speaking'
                    ? 'h-5 bg-indigo-500 animate-voice-bar-1'
                    : 'h-1.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking'
                    ? 'h-6 bg-indigo-500 animate-voice-bar-2'
                    : 'h-2 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking'
                    ? 'h-4 bg-indigo-500 animate-voice-bar-3'
                    : 'h-3 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking'
                    ? 'h-6 bg-indigo-500 animate-voice-bar-4'
                    : 'h-2 bg-slate-300 dark:bg-slate-700'
                }`}
              />
              <span
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening' || voiceState === 'speaking'
                    ? 'h-3 bg-indigo-500 animate-voice-bar-5'
                    : 'h-1.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>

            {/* Status Label */}
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {voiceState === 'listening'
                  ? 'Listening... (Speak or tap again to finish)'
                  : voiceState === 'processing'
                  ? 'Analyzing & formulating answer...'
                  : voiceState === 'speaking'
                  ? 'Yo Siri speaking... (Tap orb to interrupt)'
                  : 'Tap orb to speak'}
              </p>
              <p className="text-[10px] text-slate-400">
                Phase 1 UI Prototype • Voice & Ollama simulated for interface testing
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
              disabled={!sessionActive}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || !sessionActive}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Send message"
            >
              <SendIcon size={18} />
            </button>
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
                    Awaiting your first spoken response
                  </p>
                  <p className="text-[11px]">
                    Tap the microphone orb and speak. Yo Siri will analyze grammar, pacing, and vocabulary in real time.
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
              <span>Minimize filler words (&quot;um&quot;, &quot;like&quot;, &quot;you know&quot;)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>Use precise technical verbs when explaining architecture</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>Maintain steady breathing and pauses between thoughts</span>
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
              Great practice session! You demonstrated good conversational momentum. Today&apos;s speaking time will be credited to your daily target once live tracking starts in Phase 2.
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
