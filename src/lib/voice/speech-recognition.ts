/**
 * Yo Siri — Phase 3: Speech Recognition Service
 * Native Web Speech API integration (window.SpeechRecognition / window.webkitSpeechRecognition)
 */

import { SpeechRecognitionErrorType } from './types';

interface ISpeechRecognitionResult {
  isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}

interface ISpeechRecognitionResultList {
  readonly length: number;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

// Extend window interface for Webkit speech recognition
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export async function checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return 'unsupported';
  }

  try {
    if (navigator.permissions && navigator.permissions.query) {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return status.state; // 'granted' | 'denied' | 'prompt'
    }
  } catch {
    // Some browsers don't support query for microphone
  }

  return 'prompt';
}

export async function requestMicrophoneAccess(): Promise<{ granted: boolean; error?: string }> {
  if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      granted: false,
      error: 'Audio capture is not supported by your browser.',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Release tracks immediately so SpeechRecognition can bind to audio input
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : String(err);
    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
      return {
        granted: false,
        error: 'Microphone permission was denied. Please allow microphone access in your browser address bar settings to speak.',
      };
    }
    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
      return {
        granted: false,
        error: 'No microphone was found on this device. Please connect a microphone or use text input.',
      };
    }
    return {
      granted: false,
      error: `Could not access microphone: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export interface SpeechRecognizerHandlers {
  onStart: () => void;
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (type: SpeechRecognitionErrorType, message: string) => void;
  onEnd: () => void;
}

export function getSpeechRecognitionAdvice(errType: SpeechRecognitionErrorType): string {
  switch (errType) {
    case 'not-allowed':
      return 'Microphone permission was blocked. Check site permissions in your browser address bar.';
    case 'no-speech':
      return 'No speech was detected. Tap the microphone and speak clearly into your mic.';
    case 'audio-capture':
      return 'No microphone device was detected. Ensure your microphone is connected and not muted.';
    case 'network':
      return 'Network error during speech recognition. Check your connection or use text input.';
    case 'aborted':
      return 'Speech recognition was stopped.';
    default:
      return 'Recognition failed. Please try again or type your message.';
  }
}

export class BrowserSpeechRecognizer {
  private recognition: ISpeechRecognition | null = null;
  private isListeningActive = false;
  private lang = 'en-US';

  constructor(lang = 'en-US') {
    this.lang = lang;
  }

  public isSupported(): boolean {
    return isSpeechRecognitionSupported();
  }

  public start(handlers: SpeechRecognizerHandlers): boolean {
    if (!this.isSupported()) {
      handlers.onError('unsupported', 'Speech Recognition is not supported by this browser. Text input remains available.');
      return false;
    }

    try {
      this.stop(); // cancel previous instance if any

      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        handlers.onError('unsupported', 'Speech recognition constructor not found.');
        return false;
      }

      this.recognition = new SpeechRecognitionClass();

      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.lang;

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        handlers.onStart();
      };

      this.recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        const isFinal = Boolean(finalTranscript);
        handlers.onTranscript(currentText, isFinal);
      };

      this.recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        this.isListeningActive = false;
        const errType: SpeechRecognitionErrorType =
          event.error === 'not-allowed'
            ? 'not-allowed'
            : event.error === 'no-speech'
            ? 'no-speech'
            : event.error === 'audio-capture'
            ? 'audio-capture'
            : event.error === 'network'
            ? 'network'
            : event.error === 'aborted'
            ? 'aborted'
            : 'unknown';

        const userAdvice = getSpeechRecognitionAdvice(errType);
        handlers.onError(errType, userAdvice);
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        handlers.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: unknown) {
      this.isListeningActive = false;
      handlers.onError('unknown', `Failed to start speech recognition: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  public stop(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.isListeningActive = false;
  }

  public abort(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.isListeningActive = false;
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  public setLanguage(lang: string): void {
    this.lang = lang;
  }
}
