'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PracticeMode, ConversationMessage } from '@/types';
import { AITroubleshootingGuide, GenerateTurnResponse } from '@/lib/ai/types';

export type AIEngineStatus =
  | 'idle'
  | 'checking'
  | 'generating'
  | 'error'
  | 'offline'
  | 'cancelled';

interface UseAIEngineOptions {
  mode: PracticeMode;
  scenarioContext?: {
    topic: string;
    objective: string;
    difficulty?: string;
  };
  preferredModel?: string;
  preferredEndpoint?: string;
}

export function useAIEngine({
  mode,
  scenarioContext,
  preferredModel,
  preferredEndpoint,
}: UseAIEngineOptions) {
  const [status, setStatus] = useState<AIEngineStatus>('idle');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [activeModel, setActiveModel] = useState<string>(preferredModel || 'llama3.2:1b');
  const [error, setError] = useState<string | null>(null);
  const [troubleshooting, setTroubleshooting] = useState<AITroubleshootingGuide | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastMessagesRef = useRef<ConversationMessage[] | null>(null);

  // Health check
  const checkHealth = useCallback(async () => {
    await Promise.resolve();
    setStatus('checking');
    try {
      const endpoint = preferredEndpoint || 'http://127.0.0.1:11434';
      const model = preferredModel || activeModel || 'llama3.2:1b';
      const res = await fetch(
        `/api/ai/health?endpoint=${encodeURIComponent(endpoint)}&model=${encodeURIComponent(model)}`
      );
      const data = await res.json();

      setIsAvailable(data.isAvailable);
      setInstalledModels(data.installedModels || []);
      if (data.activeModel) {
        setActiveModel(data.activeModel);
      }

      if (data.isAvailable) {
        setStatus('idle');
        setError(null);
        setTroubleshooting(null);
      } else {
        setStatus(data.status === 'daemon_offline' ? 'offline' : 'error');
        setError(data.errorMessage || 'Local AI engine is unavailable');
        setTroubleshooting(data.troubleshooting || null);
      }
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reach AI health endpoint';
      setIsAvailable(false);
      setStatus('offline');
      setError(msg);
      setTroubleshooting({
        title: 'Connection Error',
        explanation: 'Could not contact the local Next.js proxy server or Ollama daemon.',
        command: 'ollama serve',
      });
      return null;
    }
  }, [preferredEndpoint, preferredModel, activeModel]);

  // Initial health check on mount
  useEffect(() => {
    let ignore = false;
    const probe = async () => {
      const endpoint = preferredEndpoint || 'http://127.0.0.1:11434';
      const model = preferredModel || activeModel || 'llama3.2:1b';
      try {
        const res = await fetch(
          `/api/ai/health?endpoint=${encodeURIComponent(endpoint)}&model=${encodeURIComponent(model)}`
        );
        const data = await res.json();
        if (ignore) return;
        setIsAvailable(data.isAvailable);
        setInstalledModels(data.installedModels || []);
        if (data.activeModel) {
          setActiveModel(data.activeModel);
        }
        if (data.isAvailable) {
          setStatus('idle');
          setError(null);
          setTroubleshooting(null);
        } else {
          setStatus(data.status === 'daemon_offline' ? 'offline' : 'error');
          setError(data.errorMessage || 'Local AI engine is unavailable');
          setTroubleshooting(data.troubleshooting || null);
        }
      } catch (err: unknown) {
        if (ignore) return;
        const msg = err instanceof Error ? err.message : 'Failed to reach AI health endpoint';
        setIsAvailable(false);
        setStatus('offline');
        setError(msg);
        setTroubleshooting({
          title: 'Connection Error',
          explanation: 'Could not contact the local Next.js proxy server or Ollama daemon.',
          command: 'ollama serve',
        });
      }
    };
    probe();
    return () => {
      ignore = true;
    };
  }, [preferredEndpoint, preferredModel, activeModel]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus('cancelled');
    }
  }, []);

  // Send turn to local AI model
  const sendTurn = useCallback(
    async (
      messagesHistory: ConversationMessage[],
      strictness: 'supportive' | 'balanced' | 'rigorous' = 'balanced',
      difficulty: string = 'Intermediate'
    ): Promise<GenerateTurnResponse | null> => {
      lastMessagesRef.current = messagesHistory;
      setError(null);
      setTroubleshooting(null);
      setStatus('generating');

      // Create new AbortController
      abortControllerRef.current = new AbortController();

      try {
        const payload = {
          mode,
          messages: messagesHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          difficulty,
          coachStrictness: strictness,
          scenarioContext,
          model: activeModel,
          endpoint: preferredEndpoint || 'http://127.0.0.1:11434',
        };

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Server returned HTTP ${response.status}`);
        }

        setStatus('idle');
        setLatencyMs(data.latencyMs || null);
        return data as GenerateTurnResponse;
      } catch (err: unknown) {
        if (
          (err instanceof DOMException && err.name === 'AbortError') ||
          (err instanceof Error && err.name === 'AbortError')
        ) {
          setStatus('cancelled');
          return null;
        }

        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus('error');

        if (msg.includes('Ollama daemon is not reachable')) {
          setTroubleshooting({
            title: 'Start Ollama',
            explanation: 'The Ollama daemon is offline. Start it in your terminal or launch the Ollama app.',
            command: 'ollama serve',
          });
        } else if (msg.includes('exceeds available system memory')) {
          setTroubleshooting({
            title: 'Switch to a Smaller Model',
            explanation: 'The selected model is too large for your laptop RAM. Use llama3.2:1b for fast voice chat.',
            command: 'ollama run llama3.2:1b',
          });
        }

        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [mode, scenarioContext, activeModel, preferredEndpoint]
  );

  // Retry last failed turn
  const retryLastTurn = useCallback(
    async (
      strictness: 'supportive' | 'balanced' | 'rigorous' = 'balanced',
      difficulty: string = 'Intermediate'
    ) => {
      if (lastMessagesRef.current && lastMessagesRef.current.length > 0) {
        return sendTurn(lastMessagesRef.current, strictness, difficulty);
      }
      return null;
    },
    [sendTurn]
  );

  return {
    status,
    isAvailable,
    installedModels,
    activeModel,
    setActiveModel,
    error,
    troubleshooting,
    latencyMs,
    sendTurn,
    cancelGeneration,
    retryLastTurn,
    checkHealth,
  };
}
