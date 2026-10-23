/**
 * Yo Siri — Phase 6: Daily Speaking Challenges Types
 */

export type ChallengeType =
  | 'one-minute-topic'
  | 'self-introduction'
  | 'hr-question-of-day'
  | 'explain-a-concept'
  | 'concise-answer'
  | 'vocabulary-practice'
  | 'recurring-mistakes-revision';

export type DailyPlanTier = '10-min' | '15-min' | '30-min';

export interface DailyChallengeDefinition {
  id: string;
  type: ChallengeType;
  title: string;
  badge: string;
  durationSeconds: number;
  objective: string;
  promptQuestion: string;
  focusHint: string;
  targetCriteria: string[];
}

export interface DailyPlanConfig {
  tier: DailyPlanTier;
  title: string;
  durationMinutes: number;
  description: string;
  challengeIds: ChallengeType[];
}
