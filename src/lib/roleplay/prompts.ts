/**
 * Yo Siri — Phase 6: Roleplay Prompts & Coaching Evaluator
 */

import { RoleplayScenario, RoleplayCoachingReport, RoleplayTurn } from './types';
import { scanTranscriptFillers } from '@/lib/english-lab';

export function buildRoleplayActorPrompt(scenario: RoleplayScenario): string {
  return `You are roleplaying as: ${scenario.aiPersona} (${scenario.aiRoleDescription})
Setting: ${scenario.setting}
User's Role: ${scenario.userRole}
Scenario Objective: ${scenario.objective}

=== CRITICAL ROLEPLAY RULES (STRICTLY ENFORCED) ===
1. STAY 100% IN CHARACTER: You are NOT an AI assistant or coach during this dialogue. You are ${scenario.aiPersona}. Do NOT break character under any circumstances.
2. CONCISE SPOKEN CONVERSATION: Keep each of your spoken responses between 2 and 4 natural, engaging sentences (35-70 words maximum). This is a fast, conversational voice roleplay.
3. REALISTIC REACTION: React authentically to what the user says. If they make a great point, acknowledge it. If their answer is vague, push back or ask for clarification just as your persona would.
4. NO META COACHING DURING DIALOGUE: Do not correct grammar or give feedback while in character. Coaching happens only after the session concludes.
5. ADVANCE THE CONVERSATION: End your turn with a natural question, response, or reaction that invites the user to reply.`;
}

export function buildRoleplayCoachingPrompt(
  scenario: RoleplayScenario,
  turns: RoleplayTurn[]
): string {
  const formattedTranscript = turns
    .map((t) => `${t.role === 'user' ? 'Candidate' : scenario.aiPersona}: "${t.content}"`)
    .join('\n\n');

  return `You are Yo Siri, expert executive communication coach.
The candidate just completed a realistic workplace roleplay scenario:
Scenario: "${scenario.title}"
AI Persona: ${scenario.aiPersona}
Target Objective: ${scenario.objective}
Coaching Focus: ${scenario.coachingFocus}

=== ROLEPLAY TRANSCRIPT ===
${formattedTranscript}

=== COACHING INSTRUCTIONS ===
Evaluate the candidate's performance across:
1. Did they achieve the scenario objective?
2. Tone & diplomacy (warmth, assertiveness, emotional composure, collaboration).
3. Clarity and structure of their spoken communication.
4. Grammatical precision and word economy.

=== REQUIRED JSON OUTPUT SCHEMA ===
Respond ONLY with a valid JSON object matching this structure:
{
  "objectiveAchieved": true,
  "overallScore": 88,
  "coachingSummary": "2-3 sentence overview of their performance in this roleplay scenario.",
  "keyStrengths": [
    "Specific strength 1 with reference to transcript",
    "Specific strength 2"
  ],
  "growthOpportunities": [
    "Constructive improvement 1",
    "Constructive improvement 2"
  ],
  "diplomacyAndToneNotes": "Observations on their interpersonal diplomacy, posture, and tone during the interaction.",
  "grammarMistakes": [
    {
      "original": "exact spoken phrase",
      "corrected": "polished grammatical alternative",
      "explanation": "straightforward grammar rule"
    }
  ],
  "recommendedNextPhrases": [
    {
      "phrase": "e.g., 'I completely see your point regarding SaaS costs, however...'",
      "context": "Use when acknowledging executive pushback before introducing the trade-off."
    }
  ]
}`;
}

interface RawRoleplayCoaching {
  objectiveAchieved?: boolean;
  overallScore?: number;
  coachingSummary?: string;
  keyStrengths?: string[];
  growthOpportunities?: string[];
  diplomacyAndToneNotes?: string;
  grammarMistakes?: Array<{
    original?: string;
    corrected?: string;
    explanation?: string;
  }>;
  recommendedNextPhrases?: Array<{
    phrase?: string;
    context?: string;
  }>;
}

/**
 * Parse coaching report with deterministic fallback
 */
export function parseRoleplayCoachingReport(
  rawJsonOrText: string,
  scenario: RoleplayScenario,
  turns: RoleplayTurn[]
): RoleplayCoachingReport {
  // Aggregate user text for transcript filler analysis
  const userText = turns
    .filter((t) => t.role === 'user')
    .map((t) => t.content)
    .join(' ');
  const fillerAnalysis = scanTranscriptFillers(userText);

  let parsed: RawRoleplayCoaching | null = null;
  try {
    const jsonMatch = rawJsonOrText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]) as RawRoleplayCoaching;
    }
  } catch {
    // fallback
  }

  const objectiveAchieved =
    typeof parsed?.objectiveAchieved === 'boolean'
      ? parsed.objectiveAchieved
      : turns.length >= 3;

  const overallScore =
    typeof parsed?.overallScore === 'number'
      ? Math.max(50, Math.min(100, Math.round(parsed.overallScore)))
      : 84;

  const coachingSummary =
    parsed?.coachingSummary ||
    `You completed the "${scenario.title}" scenario with ${scenario.aiPersona}. Your responses demonstrated clear engagement with the scenario objective while maintaining a professional presence.`;

  const keyStrengths: string[] = Array.isArray(parsed?.keyStrengths) && parsed.keyStrengths.length > 0
    ? parsed.keyStrengths.map(String)
    : [
        'Maintained composure and engaged directly with the persona’s prompt.',
        'Spoke with clear intent and professional vocabulary.',
      ];

  const growthOpportunities: string[] = Array.isArray(parsed?.growthOpportunities) && parsed.growthOpportunities.length > 0
    ? parsed.growthOpportunities.map(String)
    : [
        'Incorporate more specific metrics or concrete examples to back up high-level assertions.',
        'Use the "Agree & Pivot" technique to validate stakeholder concerns before presenting counterarguments.',
      ];

  const diplomacyAndToneNotes =
    parsed?.diplomacyAndToneNotes ||
    'Your tone remained respectful and collaborative throughout the scenario. Continuing to balance confidence with curiosity will elevate your executive presence.';

  const grammarMistakes: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }> = Array.isArray(parsed?.grammarMistakes)
    ? parsed.grammarMistakes.map((m) => ({
        original: String(m.original || ''),
        corrected: String(m.corrected || ''),
        explanation: String(m.explanation || 'Refine for grammatical precision.'),
      }))
    : [];

  const recommendedNextPhrases: Array<{
    phrase: string;
    context: string;
  }> = Array.isArray(parsed?.recommendedNextPhrases) && parsed.recommendedNextPhrases.length > 0
    ? parsed.recommendedNextPhrases.map((p) => ({
        phrase: String(p.phrase || ''),
        context: String(p.context || ''),
      }))
    : scenario.suggestedPhrases.map((phrase) => ({
        phrase,
        context: 'Use this conversational anchor to drive clarity and rapport.',
      }));

  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    aiPersona: scenario.aiPersona,
    objectiveAchieved,
    overallScore,
    coachingSummary,
    keyStrengths,
    growthOpportunities,
    diplomacyAndToneNotes,
    grammarMistakes,
    fillerWordOccurrences: fillerAnalysis.fillers.map((f) => ({
      word: f.word,
      count: f.count,
    })),
    recommendedNextPhrases,
  };
}
