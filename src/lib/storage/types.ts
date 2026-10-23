/**
 * Yo Siri — Phase 6: Storage Types (IndexedDB & LocalStorage)
 */

export type StorageSessionMode =
  | 'conversation'
  | 'interview'
  | 'english-lab'
  | 'roleplay'
  | 'challenge';

export interface EvaluatedTurnSummary {
  turnIndex: number;
  question?: string;
  userAnswer: string;
  assistantResponse?: string;
  correctedVersion?: string;
  grammarMistakes?: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  fillerWords?: Array<{
    word: string;
    count: number;
  }>;
  vocabularyUpgrades?: Array<{
    original: string;
    upgrade: string;
    reason: string;
  }>;
  clarityScore?: number;
  relevanceScore?: number;
  structureScore?: number;
}

export interface StoredSession {
  id: string;
  mode: StorageSessionMode;
  title: string;
  startedAt: string; // ISO 8601
  endedAt: string; // ISO 8601
  durationSeconds: number;
  turnsCount: number;
  userSpokenSeconds: number;
  summary: string;
  turns?: EvaluatedTurnSummary[];
  metadata?: {
    scenarioId?: string;
    persona?: string;
    interviewCategory?: string;
    challengeId?: string;
    difficulty?: string;
    retryCount?: number;
    resolvedWeaknesses?: string[];
    [key: string]: unknown;
  };
}

export interface ChallengeCompletionRecord {
  id: string; // e.g. `${date}-${challengeId}`
  challengeId: string;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD
  plan: '10-min' | '15-min' | '30-min';
  durationSeconds: number;
  completedAt: string; // ISO 8601
}

export interface ExportDataPayload {
  application?: string;
  version: 1;
  exportedAt: string;
  sessions: StoredSession[];
  challengeCompletions: ChallengeCompletionRecord[];
  weaknessProfile?: unknown;
  settings?: Record<string, unknown>;
}

export interface StorageAnalyticsReport {
  totalSpeakingTimeSeconds: number;
  totalSpeakingTimeFormatted: string;
  completedSessionsCount: number;
  sessionsByMode: Record<StorageSessionMode, number>;
  interviewQuestionsAnswered: number;
  practiceStreakDays: number;
  commonGrammarMistakes: Array<{
    pattern: string;
    count: number;
    example: string;
  }>;
  topFillerWords: Array<{
    word: string;
    count: number;
  }>;
  averageStructureScore: number;
  averageRelevanceScore: number;
  retryImprovementsCount: number;
  recommendedExercises: Array<{
    id: string;
    title: string;
    reason: string;
    mode: StorageSessionMode;
  }>;
}
