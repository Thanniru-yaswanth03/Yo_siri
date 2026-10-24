/**
 * Yo Siri — Evaluation Engine & Scoring Integrity Module
 * Main entry point for honest, evidence-based assessment.
 */

export * from './types';
export * from './quality-gate';

import { QualityAssessment } from './types';

/**
 * Checks if a cited excerpt actually exists as a substring in the user's answer.
 * Prevents evaluator hallucination and fabricated quotations.
 */
export function verifyEvidenceExists(excerpt: string | undefined, answer: string): boolean {
  if (!excerpt || !excerpt.trim()) return false;
  const cleanExcerpt = excerpt.trim().toLowerCase().replace(/["']/g, '');
  const cleanAnswer = answer.toLowerCase().replace(/["']/g, '');
  return cleanAnswer.includes(cleanExcerpt);
}

/**
 * Enforces scoring integrity bounds by combining deterministic quality gates
 * with model evaluation, strictly preventing hallucinated scores for garbage submissions.
 */
export function applyQualityGateToScores(
  quality: QualityAssessment,
  modelScores: {
    relevanceScore?: number;
    completenessScore?: number;
    clarityScore?: number;
    logicalStructureScore?: number;
    grammarScore?: number;
    vocabularyScore?: number;
    concisenessScore?: number;
    technicalCorrectnessScore?: number;
  }
): {
  relevanceScore: number;
  completenessScore: number;
  clarityScore: number;
  logicalStructureScore: number;
  grammarScore: number;
  vocabularyScore: number;
  concisenessScore: number;
  technicalCorrectnessScore?: number;
} {
  const clamp = (val: unknown, minVal: number, maxVal: number, fallback: number) => {
    const num = typeof val === 'number' ? val : Number(val);
    if (isNaN(num)) return fallback;
    return Math.max(minVal, Math.min(maxVal, Math.round(num)));
  };

  // Stage 1: Absolute non-answers (Empty, Nonsensical, Blatantly Off-Topic, Refusal)
  if (
    quality.status === 'empty' ||
    quality.status === 'nonsensical' ||
    quality.status === 'refusal' ||
    quality.status === 'irrelevant'
  ) {
    const baseCap = quality.status === 'empty' ? 0 : quality.status === 'nonsensical' ? 1 : 2;
    return {
      relevanceScore: Math.min(baseCap, quality.relevanceScore),
      completenessScore: Math.min(baseCap, quality.completenessScore),
      clarityScore: Math.min(quality.status === 'nonsensical' ? 1 : 3, quality.clarityScore),
      logicalStructureScore: Math.min(baseCap, quality.structureScore),
      grammarScore: quality.status === 'empty' || quality.status === 'nonsensical' ? 1 : 3,
      vocabularyScore: quality.status === 'empty' || quality.status === 'nonsensical' ? 1 : 2,
      concisenessScore: quality.status === 'empty' ? 0 : 2,
      technicalCorrectnessScore: modelScores.technicalCorrectnessScore !== undefined ? 0 : undefined,
    };
  }

  // Stage 2: Keyword stuffing / Unsupported self-praise / Insufficient fragments
  if (
    quality.status === 'keyword_stuffing' ||
    quality.status === 'unsupported_claims' ||
    quality.status === 'insufficient'
  ) {
    return {
      relevanceScore: Math.min(3, clamp(modelScores.relevanceScore, 1, 3, quality.relevanceScore)),
      completenessScore: Math.min(2, clamp(modelScores.completenessScore, 1, 2, quality.completenessScore)),
      clarityScore: Math.min(4, clamp(modelScores.clarityScore, 1, 5, quality.clarityScore)),
      logicalStructureScore: Math.min(2, clamp(modelScores.logicalStructureScore, 1, 3, quality.structureScore)),
      grammarScore: clamp(modelScores.grammarScore, 2, 7, 5),
      vocabularyScore: quality.status === 'keyword_stuffing' ? 2 : clamp(modelScores.vocabularyScore, 2, 6, 4),
      concisenessScore: clamp(modelScores.concisenessScore, 1, 6, 3),
      technicalCorrectnessScore: modelScores.technicalCorrectnessScore !== undefined ? 2 : undefined,
    };
  }

  // Stage 3: Partially relevant answers
  if (quality.status === 'partially_relevant') {
    return {
      relevanceScore: clamp(modelScores.relevanceScore, 2, 6, quality.relevanceScore),
      completenessScore: clamp(modelScores.completenessScore, 2, 6, quality.completenessScore),
      clarityScore: clamp(modelScores.clarityScore, 3, 8, quality.clarityScore),
      logicalStructureScore: clamp(modelScores.logicalStructureScore, 2, 7, quality.structureScore),
      grammarScore: clamp(modelScores.grammarScore, 2, 10, 7),
      vocabularyScore: clamp(modelScores.vocabularyScore, 2, 10, 6),
      concisenessScore: clamp(modelScores.concisenessScore, 2, 8, 6),
      technicalCorrectnessScore:
        modelScores.technicalCorrectnessScore !== undefined
          ? clamp(modelScores.technicalCorrectnessScore, 2, 6, 4)
          : undefined,
    };
  }

  // Stage 4: Valid answers
  return {
    relevanceScore: clamp(modelScores.relevanceScore, 3, 10, quality.relevanceScore),
    completenessScore: clamp(modelScores.completenessScore, 2, 10, quality.completenessScore),
    clarityScore: clamp(modelScores.clarityScore, 3, 10, quality.clarityScore),
    logicalStructureScore: clamp(modelScores.logicalStructureScore, 2, 10, quality.structureScore),
    grammarScore: clamp(modelScores.grammarScore, 3, 10, 8),
    vocabularyScore: clamp(modelScores.vocabularyScore, 3, 10, 7),
    concisenessScore: clamp(modelScores.concisenessScore, 2, 10, 8),
    technicalCorrectnessScore:
      modelScores.technicalCorrectnessScore !== undefined
        ? clamp(modelScores.technicalCorrectnessScore, 2, 10, 7)
        : undefined,
  };
}

/**
 * Builds evidence-based feedback strictly matching the awarded scores.
 */
export function buildHonestCoachingFeedback(
  quality: QualityAssessment,
  scores: {
    relevanceScore: number;
    completenessScore: number;
    clarityScore: number;
    logicalStructureScore: number;
  },
  question: string,
  userAnswer: string
): {
  keyWeaknesses: string[];
  explanation: string;
  improvedAnswer: string;
  suggestedFollowUpExercise: string;
} {
  const answerSnippet = userAnswer.trim().slice(0, 30);

  // Case 1: Empty or nonsensical
  if (quality.status === 'empty' || quality.status === 'nonsensical') {
    return {
      keyWeaknesses: [
        'No evaluable answer was provided.',
        'The input contained empty or unintelligible characters.',
      ],
      explanation: 'Your submission could not be evaluated because it did not contain intelligible words addressing the question.',
      improvedAnswer: `To answer this question effectively: articulate a direct 1-sentence answer, provide a concrete example, and highlight the outcome.`,
      suggestedFollowUpExercise: 'Speak in full, complete sentences for at least 30 seconds addressing the core prompt.',
    };
  }

  // Case 2: Refusal or "I don't know"
  if (quality.status === 'refusal') {
    return {
      keyWeaknesses: [
        'Candidate declined to answer or stated lack of knowledge.',
        'Did not provide relevant context or attempt an approximation.',
      ],
      explanation: 'While honesty is appreciated, in an interview or professional discussion, walk through how you would reason about the problem or find the answer rather than stopping at "I don\'t know".',
      improvedAnswer: `While I haven't directly encountered this exact scenario, here is how I would reason about it: first, break down the core constraints, consult relevant documentation or teammates, and prototype a minimal test solution.`,
      suggestedFollowUpExercise: 'Practice bridging from unfamiliar questions by explaining your problem-solving process.',
    };
  }

  // Case 3: Blatantly off-topic / Irrelevant
  if (quality.status === 'irrelevant') {
    return {
      keyWeaknesses: [
        'Response did not address the question asked.',
        `Discussed unrelated topics instead of answering "${question.slice(0, 50)}...".`,
      ],
      explanation: `Your answer was completely off-topic and did not demonstrate competence on the prompt. No credit could be awarded for the target skills.`,
      improvedAnswer: `Directly address the question first. For example, start with: "When handling ${question.slice(0, 30)}..., my primary approach is..."`,
      suggestedFollowUpExercise: 'Listen carefully to the prompt and state your core thesis in the very first sentence before expanding.',
    };
  }

  // Case 4: Keyword stuffing
  if (quality.status === 'keyword_stuffing') {
    return {
      keyWeaknesses: [
        'Overused buzzwords without sentence structure or narrative coherence.',
        'Did not describe a concrete scenario, action, or measurable result.',
      ],
      explanation: 'Listing competency keywords does not demonstrate competence. Interviewers look for concrete actions and outcomes rather than buzzwords.',
      improvedAnswer: `Instead of listing keywords, share a specific story: "In my last team, when we faced conflicting priorities, I scheduled a 15-minute alignment sync where we mapped out user impact..."`,
      suggestedFollowUpExercise: 'Practice telling a 60-second story without using any abstract buzzwords—focus purely on what you did.',
    };
  }

  // Case 5: Unsupported self-praise
  if (quality.status === 'unsupported_claims') {
    return {
      keyWeaknesses: [
        'Made unsupported claims of high capability without concrete evidence.',
        'Lacked verifiable examples, trade-offs, or measurable results.',
      ],
      explanation: 'Asserting that you are an expert or exceptional leader without backing examples undermines credibility. Let your actions and results speak for your skills.',
      improvedAnswer: `Replace claims with evidence: "Rather than simply asserting leadership, in our Q3 migration I led a squad of 4 engineers to deliver 2 weeks ahead of schedule..."`,
      suggestedFollowUpExercise: 'Rewrite your answer removing all self-praising adjectives and replacing them with specific metrics or outcomes.',
    };
  }

  // Case 6: Insufficient brief fragment
  if (quality.status === 'insufficient') {
    return {
      keyWeaknesses: [
        'Answer was too brief to demonstrate the requested skill.',
        'Omitted background context, specific actions, and final outcome.',
      ],
      explanation: answerSnippet
        ? `A brief response like "${answerSnippet}" does not give the interviewer enough substance to assess your depth or thought process.`
        : 'A one-phrase or one-sentence answer does not give the interviewer enough substance to assess your depth or thought process.',
      improvedAnswer: `Expand using the Headline → Action → Result formula to give a complete 40-70 word response.`,
      suggestedFollowUpExercise: 'Practice expanding 5-word answers into 3 complete sentences covering context, action, and results.',
    };
  }

  // Case 7: Valid answers
  const weaknesses: string[] = [];
  if (scores.logicalStructureScore < 6) {
    weaknesses.push('Strengthen logical progression from challenge to resolution.');
  }
  if (scores.completenessScore < 6) {
    weaknesses.push('Include more quantifiable impact or specific trade-offs.');
  }
  if (weaknesses.length === 0) {
    weaknesses.push('Elevate impact further by highlighting long-term takeaways or lessons learned.');
  }

  return {
    keyWeaknesses: weaknesses,
    explanation:
      scores.relevanceScore >= 8 && scores.completenessScore >= 8
        ? 'Well-structured, highly relevant answer with clear reasoning and evidence.'
        : 'Solid attempt that addresses the core prompt, but can be made more compelling with sharper metrics and structural flow.',
    improvedAnswer: `In my experience, when faced with this challenge, I first established the objective. Specifically, I executed the key action steps and delivered a measurable outcome.`,
    suggestedFollowUpExercise: 'Practice delivering this answer in 60-90 seconds using crisp transitions between your actions and results.',
  };
}
