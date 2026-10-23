'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ConversationState,
  VoiceEngineError,
  SpeechVoiceOption,
  getNextConversationState,
  canStartListening,
  getStateLabel,
  isSpeechRecognitionSupported,
  checkMicrophonePermission,
  requestMicrophoneAccess,
  BrowserSpeechRecognizer,
  isSpeechSynthesisSupported,
  BrowserSpeechSynthesizer,
} from '@/lib/voice';

interface UseVoiceEngineOptions {
  onTranscriptComplete?: (finalText: string) => void;
  onTranscriptChange?: (liveText: string, isFinal: boolean) => void;
  defaultRate?: number;
}

export function useVoiceEngine(options?: UseVoiceEngineOptions) {
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [finalizedTranscript, setFinalizedTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isSpeakingDetected, setIsSpeakingDetected] = useState<boolean>(false);
  const [isUserEdited, setIsUserEdited] = useState<boolean>(false);
  const [isFinalTranscript, setIsFinalTranscript] = useState<boolean>(false);
  const [error, setError] = useState<VoiceEngineError | null>(null);
  const [permission, setPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  
  // Voice Synthesis State
  const [availableVoices, setAvailableVoices] = useState<SpeechVoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [speechRate, setSpeechRateState] = useState<number>(options?.defaultRate || 1.0);
  const [autoSpeak, setAutoSpeakState] = useState<boolean>(true);

  // References
  const recognizerRef = useRef<BrowserSpeechRecognizer | null>(null);
  const synthesizerRef = useRef<BrowserSpeechSynthesizer | null>(null);
  const optionsRef = useRef(options);
  const isUserEditedRef = useRef(false);
  const latestFullTranscriptRef = useRef('');

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize recognizer and synthesizer instances
  useEffect(() => {
    let ignore = false;

    // Initialize instances
    recognizerRef.current = new BrowserSpeechRecognizer('en-US');
    synthesizerRef.current = new BrowserSpeechSynthesizer();

    // Check support and load initial permissions & preferences
    const initVoiceEngine = async () => {
      await Promise.resolve();
      if (ignore) return;

      const perm = await checkMicrophonePermission();
      if (!ignore) setPermission(perm);

      // Load saved preferences
      try {
        const savedRate = localStorage.getItem('yo-siri-rate');
        if (savedRate) {
          const parsed = parseFloat(savedRate);
          if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
            setSpeechRateState(parsed);
            synthesizerRef.current?.setRate(parsed);
          }
        }

        const savedVoice = localStorage.getItem('yo-siri-voice');
        if (savedVoice) {
          setSelectedVoiceURI(savedVoice);
          synthesizerRef.current?.setVoiceURI(savedVoice);
        }

        const savedAutoSpeak = localStorage.getItem('yo-siri-autospeak');
        if (savedAutoSpeak !== null) {
          setAutoSpeakState(savedAutoSpeak === 'true');
        }
      } catch {
        // localStorage unavailable
      }

      // Load voices
      if (synthesizerRef.current) {
        const voices = synthesizerRef.current.getEnglishVoices();
        if (!ignore && voices.length > 0) {
          setAvailableVoices(voices);
        }
      }
    };

    initVoiceEngine();

    // Listen for voice list updates in browser
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const handleVoicesChanged = () => {
        if (synthesizerRef.current && !ignore) {
          const voices = synthesizerRef.current.getEnglishVoices();
          setAvailableVoices(voices);
        }
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      return () => {
        ignore = true;
        window.speechSynthesis?.removeEventListener('voiceschanged', handleVoicesChanged);
        recognizerRef.current?.abort();
        synthesizerRef.current?.cancel();
      };
    }

    return () => {
      ignore = true;
      recognizerRef.current?.abort();
      synthesizerRef.current?.cancel();
    };
  }, []);

  // Update voice selection
  const setVoiceURI = useCallback((uri: string | null) => {
    setSelectedVoiceURI(uri);
    synthesizerRef.current?.setVoiceURI(uri);
    try {
      if (uri) localStorage.setItem('yo-siri-voice', uri);
      else localStorage.removeItem('yo-siri-voice');
    } catch {
      // ignore
    }
  }, []);

  // Update speech rate
  const setSpeechRate = useCallback((rate: number) => {
    setSpeechRateState(rate);
    synthesizerRef.current?.setRate(rate);
    try {
      localStorage.setItem('yo-siri-rate', String(rate));
    } catch {
      // ignore
    }
  }, []);

  // Update auto-speak
  const setAutoSpeak = useCallback((enabled: boolean) => {
    setAutoSpeakState(enabled);
    try {
      localStorage.setItem('yo-siri-autospeak', String(enabled));
    } catch {
      // ignore
    }
  }, []);

  // Dispatch transition event
  const dispatch = useCallback((event: import('@/lib/voice').VoiceEngineEvent) => {
    setConversationState((current) => {
      const next = getNextConversationState(current, event);
      if (next === null) {
        // Invalid transition ignored to prevent inconsistent UI states
        return current;
      }
      return next;
    });
  }, []);

  // Set explicit error
  const reportError = useCallback((err: VoiceEngineError) => {
    setError(err);
    setConversationState('error');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setConversationState('idle');
  }, []);

  // Start Listening
  const startListening = useCallback(async () => {
    if (!canStartListening(conversationState)) {
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      reportError({
        type: 'unsupported',
        message: 'Speech Recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari, or use text input.',
        retryable: false,
        advice: 'Text input is active and fully functional below.',
      });
      return;
    }

    // If currently speaking, interrupt it first
    if (synthesizerRef.current?.isSpeaking()) {
      synthesizerRef.current.cancel();
    }

    setError(null);
    setIsFinalTranscript(false);

    // Request microphone permission
    dispatch({ type: 'REQUEST_MIC' });

    const permissionResult = await requestMicrophoneAccess();
    if (!permissionResult.granted) {
      setPermission('denied');
      reportError({
        type: 'not-allowed',
        message: permissionResult.error || 'Microphone access denied.',
        retryable: true,
        advice: 'Click the camera/mic icon in your browser address bar to allow microphone access, then retry.',
      });
      return;
    }

    setPermission('granted');

    // Reset live transcript state for fresh recording unless already edited
    if (!isUserEditedRef.current) {
      setFinalizedTranscript('');
      setInterimTranscript('');
      setTranscript('');
      latestFullTranscriptRef.current = '';
    }

    const started = recognizerRef.current?.start({
      onStart: () => {
        setIsSpeakingDetected(false);
        dispatch({ type: 'RECOGNITION_STARTED' });
      },
      onSpeechStart: () => {
        setIsSpeakingDetected(true);
      },
      onSpeechEnd: () => {
        setIsSpeakingDetected(false);
      },
      onTranscript: (result) => {
        setFinalizedTranscript(result.finalizedText);
        setInterimTranscript(result.interimText);
        setIsFinalTranscript(result.isFinal);
        latestFullTranscriptRef.current = result.fullTranscript;

        if (!isUserEditedRef.current) {
          setTranscript(result.fullTranscript);
          optionsRef.current?.onTranscriptChange?.(result.fullTranscript, result.isFinal);
        }
      },
      onError: (errType, message) => {
        setIsSpeakingDetected(false);
        reportError({
          type: errType,
          message,
          retryable: errType !== 'unsupported',
          advice: errType === 'no-speech' ? 'Speak closer to the microphone or type your response below.' : undefined,
        });
      },
      onEnd: () => {
        setIsSpeakingDetected(false);
        setConversationState((current) => (current === 'listening' ? 'idle' : current));
        const committedText = latestFullTranscriptRef.current.trim();
        if (committedText && !isUserEditedRef.current) {
          optionsRef.current?.onTranscriptComplete?.(committedText);
        }
      },
    });

    if (!started) {
      reportError({
        type: 'unknown',
        message: 'Could not initialize speech recognition.',
        retryable: true,
      });
    }
  }, [conversationState, dispatch, reportError]);

  // Stop Listening
  const stopListening = useCallback(() => {
    recognizerRef.current?.stop();
    setIsSpeakingDetected(false);
    dispatch({ type: 'STOP_LISTENING' });
  }, [dispatch]);

  // Handle manual transcript editing by user
  const handleSetTranscript = useCallback((text: string) => {
    setTranscript(text);
    isUserEditedRef.current = true;
    setIsUserEdited(true);
    latestFullTranscriptRef.current = text;
  }, []);

  // Clear all transcript buffers
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setFinalizedTranscript('');
    setInterimTranscript('');
    setIsSpeakingDetected(false);
    setIsUserEdited(false);
    isUserEditedRef.current = false;
    latestFullTranscriptRef.current = '';
  }, []);

  // Reset user-edited flag for a new recording turn
  const resetUserEdit = useCallback(() => {
    setIsUserEdited(false);
    isUserEditedRef.current = false;
  }, []);

  // Speak AI Response
  const speakResponse = useCallback(
    (text: string, onEndCallback?: () => void) => {
      if (!isSpeechSynthesisSupported() || !autoSpeak || !text.trim()) {
        onEndCallback?.();
        return;
      }

      // Interrupt any prior speech
      synthesizerRef.current?.cancel();

      dispatch({ type: 'TTS_STARTED' });

      synthesizerRef.current?.speak(text, {
        onStart: () => {
          dispatch({ type: 'TTS_STARTED' });
        },
        onPause: () => {
          dispatch({ type: 'TTS_PAUSED' });
        },
        onResume: () => {
          dispatch({ type: 'TTS_RESUMED' });
        },
        onEnd: () => {
          dispatch({ type: 'TTS_ENDED' });
          onEndCallback?.();
        },
        onError: (errMessage) => {
          dispatch({ type: 'TTS_ENDED' });
          console.warn('[SpeechSynthesis]', errMessage);
          onEndCallback?.();
        },
      });
    },
    [autoSpeak, dispatch]
  );

  // Pause speech
  const pauseSpeech = useCallback(() => {
    synthesizerRef.current?.pause();
    dispatch({ type: 'TTS_PAUSED' });
  }, [dispatch]);

  // Resume speech
  const resumeSpeech = useCallback(() => {
    synthesizerRef.current?.resume();
    dispatch({ type: 'TTS_RESUMED' });
  }, [dispatch]);

  // Interrupt active speech / listening
  const interrupt = useCallback(() => {
    if (synthesizerRef.current?.isSpeaking() || synthesizerRef.current?.isPaused()) {
      synthesizerRef.current.cancel();
    }
    if (recognizerRef.current?.isListening()) {
      recognizerRef.current.abort();
    }
    setIsSpeakingDetected(false);
    dispatch({ type: 'INTERRUPT' });
  }, [dispatch]);

  // Cancel entire session voice state
  const cancelSession = useCallback(() => {
    synthesizerRef.current?.cancel();
    recognizerRef.current?.abort();
    setTranscript('');
    setFinalizedTranscript('');
    setInterimTranscript('');
    setIsSpeakingDetected(false);
    setIsUserEdited(false);
    isUserEditedRef.current = false;
    latestFullTranscriptRef.current = '';
    setError(null);
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  // Retry after error
  const retry = useCallback(() => {
    clearError();
    startListening();
  }, [clearError, startListening]);

  return {
    state: conversationState,
    stateLabel: getStateLabel(conversationState),
    // Live Word-by-word transcription states
    transcript,
    finalizedTranscript,
    interimTranscript,
    isSpeakingDetected,
    isUserEdited,
    isFinalTranscript,
    // Transcript Actions
    setTranscript: handleSetTranscript,
    clearTranscript,
    resetUserEdit,
    // Error & Permissions
    error,
    clearError,
    permission,
    isSpeechRecognitionSupported: isSpeechRecognitionSupported(),
    isSpeechSynthesisSupported: isSpeechSynthesisSupported(),
    // Voice preferences
    availableVoices,
    selectedVoiceURI,
    setVoiceURI,
    speechRate,
    setSpeechRate,
    autoSpeak,
    setAutoSpeak,
    // Actions
    startListening,
    stopListening,
    speakResponse,
    pauseSpeech,
    resumeSpeech,
    interrupt,
    cancelSession,
    retry,
    dispatch,
    setConversationState,
  };
}
