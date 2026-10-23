/**
 * Yo Siri — Phase 3: Conversation State Machine
 * Pure deterministic state transition rules enforcing exact state flow and preventing duplicate submissions
 */

import { ConversationState, VoiceEngineEvent } from './types';

// Valid transitions dictionary
const TRANSITION_TABLE: Record<ConversationState, Partial<Record<VoiceEngineEvent['type'], ConversationState>>> = {
  idle: {
    REQUEST_MIC: 'requestingPermission',
    RECOGNITION_STARTED: 'listening',
    SUBMIT_TURN: 'processing',
    GENERATION_STARTED: 'generating',
    TTS_STARTED: 'speaking',
    ERROR: 'error',
    RESET: 'idle',
  },
  requestingPermission: {
    PERMISSION_GRANTED: 'listening',
    PERMISSION_DENIED: 'error',
    RECOGNITION_STARTED: 'listening',
    STOP_LISTENING: 'idle',
    RESET: 'idle',
    ERROR: 'error',
  },
  listening: {
    STOP_LISTENING: 'idle',
    SUBMIT_TURN: 'processing',
    RECOGNITION_ERROR: 'error',
    RESET: 'idle',
    ERROR: 'error',
  },
  processing: {
    GENERATION_STARTED: 'generating',
    GENERATION_ERROR: 'error',
    GENERATION_CANCEL: 'idle',
    RESET: 'idle',
    ERROR: 'error',
  },
  generating: {
    GENERATION_SUCCESS: 'idle',
    TTS_STARTED: 'speaking',
    GENERATION_ERROR: 'error',
    GENERATION_CANCEL: 'idle',
    RESET: 'idle',
    ERROR: 'error',
  },
  speaking: {
    TTS_PAUSED: 'paused',
    TTS_ENDED: 'idle',
    INTERRUPT: 'idle',
    REQUEST_MIC: 'listening',
    RECOGNITION_STARTED: 'listening',
    SUBMIT_TURN: 'processing',
    RESET: 'idle',
    ERROR: 'error',
  },
  paused: {
    TTS_RESUMED: 'speaking',
    TTS_ENDED: 'idle',
    INTERRUPT: 'idle',
    REQUEST_MIC: 'listening',
    SUBMIT_TURN: 'processing',
    RESET: 'idle',
    ERROR: 'error',
  },
  error: {
    RETRY: 'idle',
    REQUEST_MIC: 'requestingPermission',
    RECOGNITION_STARTED: 'listening',
    SUBMIT_TURN: 'processing',
    RESET: 'idle',
    ERROR: 'error',
  },
};

/**
 * Checks if a state transition is valid
 */
export function canTransition(current: ConversationState, eventType: VoiceEngineEvent['type']): boolean {
  return Boolean(TRANSITION_TABLE[current]?.[eventType]);
}

/**
 * Computes the next state given the current state and an event.
 * Returns null if the transition is invalid.
 */
export function getNextConversationState(
  current: ConversationState,
  event: VoiceEngineEvent
): ConversationState | null {
  const next = TRANSITION_TABLE[current]?.[event.type];
  return next ?? null;
}

/**
 * Guard preventing duplicate submission while already processing or generating
 */
export function canSubmitInput(state: ConversationState): boolean {
  return state !== 'processing' && state !== 'generating' && state !== 'requestingPermission';
}

/**
 * Guard indicating if user can initiate speech recognition
 */
export function canStartListening(state: ConversationState): boolean {
  return state === 'idle' || state === 'speaking' || state === 'paused' || state === 'error';
}

/**
 * Guard indicating if user can interrupt speech output
 */
export function canInterruptSpeech(state: ConversationState): boolean {
  return state === 'speaking' || state === 'paused';
}

/**
 * Human-friendly state label for accessibility and UI displays
 */
export function getStateLabel(state: ConversationState): string {
  switch (state) {
    case 'idle':
      return 'Ready';
    case 'requestingPermission':
      return 'Requesting microphone permission...';
    case 'listening':
      return 'Listening... Speak now';
    case 'processing':
      return 'Preparing response...';
    case 'generating':
      return 'AI is thinking...';
    case 'speaking':
      return 'AI speaking...';
    case 'paused':
      return 'Voice paused';
    case 'error':
      return 'Error';
  }
}
