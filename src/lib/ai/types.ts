import { PracticeMode, TurnFeedback } from '@/types';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type AIDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | string;
export type AICoachStrictness = 'supportive' | 'balanced' | 'rigorous';

export interface GenerateTurnRequest {
  mode: PracticeMode;
  messages: AIMessage[];
  difficulty?: AIDifficulty;
  coachStrictness?: AICoachStrictness;
  scenarioContext?: {
    topic: string;
    objective: string;
    difficulty?: string;
  };
  model?: string;
  endpoint?: string;
  timeoutMs?: number;
}

export interface GenerateTurnResponse {
  spokenResponse: string;
  coaching: TurnFeedback;
  rawContent: string;
  modelUsed: string;
  latencyMs: number;
}

export interface AITroubleshootingGuide {
  title: string;
  explanation: string;
  command?: string;
  docUrl?: string;
}

export interface AIAvailabilityResult {
  isAvailable: boolean;
  status: 'ready' | 'daemon_offline' | 'model_missing' | 'out_of_memory' | 'error';
  endpoint: string;
  installedModels: string[];
  activeModel: string;
  errorMessage?: string;
  troubleshooting?: AITroubleshootingGuide;
}

export interface AIProvider {
  name: string;
  checkAvailability(endpoint?: string, model?: string): Promise<AIAvailabilityResult>;
  listModels(endpoint?: string): Promise<string[]>;
  generateTurn(
    request: GenerateTurnRequest,
    signal?: AbortSignal
  ): Promise<GenerateTurnResponse>;
}
