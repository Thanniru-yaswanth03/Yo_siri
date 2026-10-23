/**
 * Yo Siri — Phase 3: Voice Engine Types
 * Typed state machine and voice engine interfaces
 */

export type ConversationState =
  | 'idle'
  | 'requestingPermission'
  | 'listening'
  | 'processing'
  | 'generating'
  | 'speaking'
  | 'paused'
  | 'error';

export type SpeechRecognitionErrorType =
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'audio-capture'
  | 'service-not-allowed'
  | 'language-not-supported'
  | 'aborted'
  | 'unsupported'
  | 'unknown';

export interface VoiceEngineError {
  type: SpeechRecognitionErrorType | 'tts-error' | 'ai-error' | 'invalid-transition';
  message: string;
  retryable: boolean;
  advice?: string;
}

export type VoiceEngineEvent =
  | { type: 'REQUEST_MIC' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED'; error: string }
  | { type: 'RECOGNITION_STARTED' }
  | { type: 'TRANSCRIPT_UPDATED'; text: string; isFinal: boolean }
  | { type: 'STOP_LISTENING' }
  | { type: 'RECOGNITION_ERROR'; error: SpeechRecognitionErrorType; message: string }
  | { type: 'SUBMIT_TURN' }
  | { type: 'GENERATION_STARTED' }
  | { type: 'GENERATION_SUCCESS' }
  | { type: 'GENERATION_ERROR'; message: string }
  | { type: 'GENERATION_CANCEL' }
  | { type: 'TTS_STARTED' }
  | { type: 'TTS_PAUSED' }
  | { type: 'TTS_RESUMED' }
  | { type: 'TTS_ENDED' }
  | { type: 'INTERRUPT' }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'ERROR'; error: VoiceEngineError };

export interface SpeechVoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  isDefault: boolean;
  isLocalService: boolean;
}

export interface VoiceSettings {
  autoSpeakResponse: boolean;
  selectedVoiceURI: string | null;
  speechRate: number; // 0.75 - 1.5
  speechPitch: number; // 0.8 - 1.2
}
