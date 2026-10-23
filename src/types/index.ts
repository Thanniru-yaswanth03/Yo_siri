export type PracticeMode =
  | 'conversation'
  | 'interview'
  | 'english-lab'
  | 'roleplay';

export type SessionVoiceState =
  | 'idle'
  | 'requestingPermission'
  | 'listening'
  | 'processing'
  | 'generating'
  | 'speaking'
  | 'paused'
  | 'error';

export type ConversationState = SessionVoiceState;

export interface GrammarFeedback {
  original: string;
  corrected: string;
  explanation: string;
}

export interface VocabularyFeedback {
  original: string;
  upgrade: string;
  reason: string;
}

export interface TurnFeedback {
  grammar?: GrammarFeedback[];
  vocabulary?: VocabularyFeedback[];
  fluencyTip?: string;
  clarityScore?: number; // 1-100
  pacingNote?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  audioDurationSec?: number;
  feedback?: TurnFeedback;
}

export interface PracticeSessionRecord {
  id: string;
  mode: PracticeMode;
  title: string;
  date: string;
  durationMinutes: number;
  turns: number;
  summary: string;
}

export interface CommonMistakePattern {
  id: string;
  category: 'grammar' | 'vocabulary' | 'clarity' | 'filler-words';
  pattern: string;
  example: string;
  recommendedFix: string;
  frequency: number;
}

export interface DailyChallengeItem {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationMinutes: number;
  description: string;
  prompt: string;
  objective: string;
  practiceMode: PracticeMode;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  speakingPace: 'slow' | 'normal' | 'fast';
  voiceStyle: 'natural' | 'expressive' | 'calm';
  coachStrictness: 'supportive' | 'balanced' | 'rigorous';
  dailyGoalMinutes: number;
  targetAccent: string;
  ollamaEndpoint: string;
  ollamaModel: string;
}
