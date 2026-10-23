/**
 * Yo Siri — Phase 6: Roleplay Studio Types
 */

export type RoleplayScenarioCategory =
  | 'introducing-yourself'
  | 'starting-conversations'
  | 'networking'
  | 'group-discussions'
  | 'professional-meetings'
  | 'disagreeing-politely'
  | 'handling-criticism'
  | 'explaining-technical-projects'
  | 'giving-presentations'
  | 'everyday-social';

export interface RoleplayScenario {
  id: string;
  category: RoleplayScenarioCategory;
  title: string;
  badge: string;
  aiPersona: string;
  aiRoleDescription: string;
  setting: string;
  userRole: string;
  openingLine: string;
  objective: string;
  coachingFocus: string;
  suggestedPhrases: string[];
}

export interface RoleplayTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface RoleplayCoachingReport {
  scenarioId: string;
  scenarioTitle: string;
  aiPersona: string;
  objectiveAchieved: boolean;
  overallScore: number; // 1-100
  coachingSummary: string;
  keyStrengths: string[];
  growthOpportunities: string[];
  diplomacyAndToneNotes: string;
  grammarMistakes: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  fillerWordOccurrences: Array<{
    word: string;
    count: number;
  }>;
  recommendedNextPhrases: Array<{
    phrase: string;
    context: string;
  }>;
}
