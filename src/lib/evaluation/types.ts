/**
 * Yo Siri — Evaluation Engine & Scoring Integrity System
 * Core types for multi-stage answer validity, competence verification, and honest scoring.
 */

export type AnswerValidityStatus =
  | 'empty'
  | 'nonsensical'
  | 'refusal'
  | 'irrelevant'
  | 'insufficient'
  | 'keyword_stuffing'
  | 'unsupported_claims'
  | 'partially_relevant'
  | 'valid';

export interface QualityAssessment {
  status: AnswerValidityStatus;
  isEvaluable: boolean;
  relevanceScore: number; // 0 - 10
  meaningfulnessScore: number; // 0 - 10
  completenessScore: number; // 0 - 10
  clarityScore: number; // 0 - 10
  structureScore: number; // 0 - 10
  detectedFlags: string[];
  diagnosticExplanation: string;
  sanitizedAnswer: string;
  isPromptInjection: boolean;
  isConciseQuestion: boolean;
}

export interface CompetencyScoreItem {
  competency: string;
  score: number; // 0 - 10 (0 = unassessed or no evidence, 1-2 = weak, 5-6 = competent, 8-10 = strong)
  explanation: string;
  citedExcerpt?: string;
  missingEvidence: string;
  improvementTip: string;
  isDemonstrated: boolean;
}

export interface RobustEvaluationOutput {
  quality: QualityAssessment;
  overallScore: number; // 0 - 100 honestly aggregated
  competencies: Record<string, CompetencyScoreItem>;
  keyWeaknesses: string[];
  keyStrengths: string[];
  explanation: string;
  improvedAnswer: string;
  suggestedFollowUpExercise: string;
  evaluationReliability: 'verified' | 'rule_based' | 'model_evaluated' | 'failed';
}
