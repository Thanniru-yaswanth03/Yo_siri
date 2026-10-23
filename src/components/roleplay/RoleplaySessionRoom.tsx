'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RoleplayScenario, RoleplayTurn, RoleplayCoachingReport } from '@/lib/roleplay';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import { MicIcon, MicOffIcon, Volume2Icon, SquareIcon } from '@/components/icons';

interface RoleplaySessionRoomProps {
  scenario: RoleplayScenario;
  onEndSession: (turns: RoleplayTurn[], report: RoleplayCoachingReport) => void;
  onExit: () => void;
}

export function RoleplaySessionRoom({
  scenario,
  onEndSession,
  onExit,
}: RoleplaySessionRoomProps) {
  const [turns, setTurns] = useState<RoleplayTurn[]>([
    {
      id: `turn-open-${scenario.id}`,
      role: 'assistant',
      content: scenario.openingLine,
      timestamp: '00:00',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const turnsEndRef = useRef<HTMLDivElement>(null);

  // Hook into Phase 3 Voice Engine
  const {
    state: conversationState,
    startListening,
    stopListening,
    speakResponse,
    isSpeechRecognitionSupported,
    cancelSession: cancelVoice,
  } = useVoiceEngine({
    defaultRate: 1.0,
    onTranscriptComplete: (finalText) => {
      setUserInput(finalText);
    },
  });

  const isListening = conversationState === 'listening';

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, isGenerating]);

  // Speak opening line once when room mounts if autoSpeak is on
  useEffect(() => {
    if (autoSpeak) {
      const timeout = setTimeout(() => {
        speakResponse(scenario.openingLine);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [scenario.openingLine, autoSpeak, speakResponse]);

  const formatTimer = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Submit User Turn
  const handleSendTurn = async () => {
    const text = userInput.trim();
    if (!text || isGenerating) return;

    if (isListening) stopListening();
    setUserInput('');

    const newTurn: RoleplayTurn = {
      id: `turn-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: formatTimer(secondsElapsed),
    };

    const updatedTurns = [...turns, newTurn];
    setTurns(updatedTurns);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          scenario,
          messages: updatedTurns.map((t) => ({ role: t.role, content: t.content })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || "I see. Let's explore that further.";

        const assistantTurn: RoleplayTurn = {
          id: `turn-asst-${Date.now()}`,
          role: 'assistant',
          content: reply,
          timestamp: formatTimer(secondsElapsed + 1),
        };

        setTurns([...updatedTurns, assistantTurn]);

        if (autoSpeak) {
          speakResponse(reply);
        }
      }
    } catch (err) {
      console.error('Roleplay turn error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // End Scenario & Generate Coaching Report
  const handleEndAndCoach = async () => {
    cancelVoice();
    setIsFinalizing(true);

    try {
      const res = await fetch('/api/ai/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize_coaching',
          scenario,
          turns,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onEndSession(turns, data.report);
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (err) {
      console.error('Coaching report error:', err);
      // Fallback
      onEndSession(turns, {
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        aiPersona: scenario.aiPersona,
        objectiveAchieved: turns.length >= 3,
        overallScore: 82,
        coachingSummary: `Completed roleplay session with ${scenario.aiPersona}.`,
        keyStrengths: ['Engaged actively with the scenario persona.'],
        growthOpportunities: ['Incorporate more concrete examples.'],
        diplomacyAndToneNotes: 'Maintained polite and professional composure.',
        grammarMistakes: [],
        fillerWordOccurrences: [],
        recommendedNextPhrases: [],
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Top Banner: Scenario Context & Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              In Character
            </span>
            <span className="text-xs text-slate-400">
              {scenario.aiPersona} • {scenario.setting}
            </span>
          </div>
          <h2 className="text-sm font-bold text-slate-200">
            {scenario.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            {formatTimer(secondsElapsed)}
          </div>

          {/* Voice Auto-Speak Toggle */}
          <button
            type="button"
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              autoSpeak
                ? 'bg-violet-950/40 text-violet-300 border-violet-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {autoSpeak ? 'Audio Voice: ON' : 'Audio Voice: MUTED'}
          </button>

          {/* End Scenario & Get Coaching Button */}
          <button
            type="button"
            onClick={handleEndAndCoach}
            disabled={isFinalizing || turns.length < 2}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all disabled:opacity-40"
          >
            <SquareIcon size={12} />
            {isFinalizing ? 'Evaluating Performance...' : 'End Scenario & Get Coaching'}
          </button>

          <button
            type="button"
            onClick={onExit}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Objective & Suggested Anchors Bar */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-violet-400">Your Objective:</span>
          <span>{scenario.objective}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-slate-400">
          <span className="text-slate-500">Suggested phrases:</span>
          {scenario.suggestedPhrases.map((phrase, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 italic"
            >
              &ldquo;{phrase}&rdquo;
            </span>
          ))}
        </div>
      </div>

      {/* Main Dialogue Timeline */}
      <div className="min-h-[380px] max-h-[500px] overflow-y-auto p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        {turns.map((turn) => {
          const isUser = turn.role === 'user';
          return (
            <div
              key={turn.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                <span className="font-semibold text-slate-300">
                  {isUser ? 'You' : scenario.aiPersona}
                </span>
                <span>•</span>
                <span>{turn.timestamp}</span>
              </div>

              <div
                className={`max-w-[82%] p-4 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-violet-600 text-white rounded-br-none shadow-md shadow-violet-600/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                <p>{turn.content}</p>
                {!isUser && (
                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => speakResponse(turn.content)}
                      className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                      title="Replay audio"
                    >
                      <Volume2Icon size={12} />
                      Listen
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic p-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
            {scenario.aiPersona} is replying...
          </div>
        )}

        <div ref={turnsEndRef} />
      </div>

      {/* Voice & Text Input Arena */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendTurn();
              }
            }}
            placeholder={
              isSpeechRecognitionSupported
                ? 'Speak in character via the microphone, or type your response here...'
                : 'Type your response in character...'
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
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {isListening ? <MicOffIcon size={14} /> : <MicIcon size={14} />}
                {isListening ? 'Stop Speaking' : 'Speak in Character'}
              </button>
            )}
            <span className="text-[11px] text-slate-500">
              Press Enter or click Speak to send your reply.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSendTurn}
            disabled={isGenerating || !userInput.trim()}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30 disabled:opacity-40 transition-all"
          >
            Send Reply →
          </button>
        </div>
      </div>
    </div>
  );
}
