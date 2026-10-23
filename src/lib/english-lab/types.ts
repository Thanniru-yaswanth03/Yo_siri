/**
 * Yo Siri — Phase 5: English Lab & Personalized Coaching Types
 */

export type LabCategory =
  | 'grammar'
  | 'natural-phrasing'
  | 'vocabulary'
  | 'conversational'
  | 'conciseness'
  | 'filler-elimination'
  | 'sentence-structure'
  | 'one-minute-challenge'
  | 'adaptive-drill';

export type WeaknessCategory =
  | 'tense-errors'
  | 'articles-prepositions'
  | 'subject-verb-agreement'
  | 'repetitive-vocabulary'
  | 'filler-words'
  | 'rambling-answers'
  | 'weak-structure'
  | 'missing-examples'
  | 'unclear-explanations';

export interface WeaknessEvidence {
  verbatimExcerpt: string;
  sourceType: 'transcript' | 'ai-suggestion';
  sessionRef: string;
  timestamp: string;
  contextSentence?: string;
}

export interface WeaknessPattern {
  id: string;
  category: WeaknessCategory;
  title: string;
  description: string;
  frequency: number;
  firstObserved: string;
  lastObserved: string;
  evidence: WeaknessEvidence[];
  isDismissed: boolean;
  dismissedAt?: string;
  resolvedAt?: string;
}

export interface GrammarMistakeItem {
  originalSegment: string;
  correctedSegment: string;
  explanation: string;
  isStylisticPreference?: boolean;
}

export interface VocabularyUpgradeItem {
  originalWord: string;
  upgradeWord: string;
  reason: string;
}

export interface FillerWordOccurrence {
  word: string;
  count: number;
  locations: string[];
}

export interface LabTurnEvaluation {
  id: string;
  turnIndex: number;
  drillCategory: LabCategory;
  question: string;
  originalAnswer: string;
  correctedVersion: string;
  mainMistakes: GrammarMistakeItem[];
  clearExplanation: string;
  naturalAlternative: string;
  shortPracticeExercise: {
    prompt: string;
    targetFocus: string;
    hint?: string;
  };
  vocabularyUpgrades: VocabularyUpgradeItem[];
  fillerWordAnalysis?: {
    totalFillers: number;
    fillers: FillerWordOccurrence[];
    advice: string;
  };
  concisenessMetrics?: {
    wordCount: number;
    estimatedSpokenSeconds: number;
    isRambling: boolean;
    suggestedMaxWords: number;
  };
  identifiedWeaknesses: Array<{
    category: WeaknessCategory;
    title: string;
    verbatimExcerpt: string;
  }>;
}

export interface RetryComparison {
  attempt1: {
    answer: string;
    wordCount: number;
    fillerCount: number;
    mistakeCount: number;
  };
  attempt2: {
    answer: string;
    wordCount: number;
    fillerCount: number;
    mistakeCount: number;
  };
  improvements: string[];
  remainingGaps: string[];
  coachingSummary: string;
}

export interface AdaptiveDrill {
  id: string;
  weaknessCategory: WeaknessCategory;
  title: string;
  instruction: string;
  promptQuestion: string;
  targetObjective: string;
  recommendedConstraint?: string; // e.g. "Answer in under 3 sentences", "60-second limit"
  timerSeconds?: number;
}
