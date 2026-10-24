/**
 * Yo Siri — Phase 4: Interview Evaluator & Scoring Integrity
 * Computes deterministic coaching metrics, enforces quality gates, and parses LLM evaluation outputs.
 */

import {
  InterviewConfig,
  TurnEvaluation,
  OverallCoachingScores,
  InterviewSessionReport,
} from './types';
import {
  assessAnswerQuality,
  applyQualityGateToScores,
  buildHonestCoachingFeedback,
} from '@/lib/evaluation';

export function calculateTurnHeuristics(
  question: string,
  answer: string
): {
  concisenessScore: number;
  clarityScore: number;
  relevanceScore: number;
  completenessScore: number;
  logicalStructureScore: number;
  starKeywords: { situation: boolean; task: boolean; action: boolean; result: boolean };
} {
  const quality = assessAnswerQuality(question, answer);
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // STAR keywords check
  const starKeywords = {
    situation: /\b(when|while|working at|project|context|situation|background)\b/i.test(answer),
    task: /\b(task|goal|needed to|assigned|objective|responsible|challenge)\b/i.test(answer),
    action: /\b(i decided|i implemented|i built|i initiated|i wrote|my approach|i designed)\b/i.test(answer),
    result: /\b(result|results|resulted|outcome|outcomes|increased|reduced|reduction|improved|delivered|achieved|saved|percent)\b|%/i.test(answer),
  };

  // If answer failed quality gate (empty, nonsensical, refusal, irrelevant), do not award high scores
  if (
    quality.status === 'empty' ||
    quality.status === 'nonsensical' ||
    quality.status === 'refusal' ||
    quality.status === 'irrelevant'
  ) {
    return {
      concisenessScore: quality.status === 'empty' ? 0 : 2,
      clarityScore: quality.clarityScore,
      relevanceScore: quality.relevanceScore,
      completenessScore: quality.completenessScore,
      logicalStructureScore: quality.structureScore,
      starKeywords: { situation: false, task: false, action: false, result: false },
    };
  }

  // Conciseness evaluation: sweet spot for interview answers is ~40-150 words (30-90 seconds spoken)
  let conciseness = 8;
  if (quality.isConciseQuestion) {
    conciseness = wordCount <= 20 ? 9 : 6;
  } else if (wordCount < 15) {
    conciseness = 4; // too brief / incomplete
  } else if (wordCount < 30) {
    conciseness = 6;
  } else if (wordCount <= 160) {
    conciseness = 9;
  } else if (wordCount <= 220) {
    conciseness = 7;
  } else {
    conciseness = 5; // rambling / too long
  }

  // Clarity: check for excessive filler words
  const lower = answer.toLowerCase();
  const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'sort of', 'kind of'];
  let fillerCount = 0;
  for (const f of fillers) {
    const matches = lower.match(new RegExp(`\\b${f}\\b`, 'g'));
    if (matches) fillerCount += matches.length;
  }
  const clarity = Math.max(3, Math.min(10, 10 - fillerCount * 1.5));

  return {
    concisenessScore: conciseness,
    clarityScore: Math.round(clarity),
    relevanceScore: quality.relevanceScore,
    completenessScore: quality.completenessScore,
    logicalStructureScore: quality.structureScore,
    starKeywords,
  };
}

export function parseModelEvaluation(
  rawText: string,
  config: InterviewConfig,
  turnIndex: number,
  question: string,
  originalAnswer: string
): TurnEvaluation {
  const quality = assessAnswerQuality(question, originalAnswer);
  const heuristics = calculateTurnHeuristics(question, originalAnswer);

  let parsed: Record<string, unknown> | null = null;
  try {
    let jsonStr = rawText.trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      parsed = JSON.parse(jsonStr);
    }
  } catch {
    // LLM parsing failed or returned invalid json
  }

  // Pass model scores through the Quality Gate to enforce scoring integrity
  const boundedScores = applyQualityGateToScores(quality, {
    relevanceScore: typeof parsed?.relevanceScore === 'number' ? parsed.relevanceScore : heuristics.relevanceScore,
    completenessScore: typeof parsed?.completenessScore === 'number' ? parsed.completenessScore : heuristics.completenessScore,
    clarityScore: typeof parsed?.clarityScore === 'number' ? parsed.clarityScore : heuristics.clarityScore,
    logicalStructureScore: typeof parsed?.logicalStructureScore === 'number' ? parsed.logicalStructureScore : heuristics.logicalStructureScore,
    grammarScore: typeof parsed?.grammarScore === 'number' ? parsed.grammarScore : undefined,
    vocabularyScore: typeof parsed?.vocabularyScore === 'number' ? parsed.vocabularyScore : undefined,
    concisenessScore: typeof parsed?.concisenessScore === 'number' ? parsed.concisenessScore : heuristics.concisenessScore,
    technicalCorrectnessScore:
      config.category === 'technical' || config.category === 'project-defense' || config.category === 'placement'
        ? typeof parsed?.technicalCorrectnessScore === 'number'
          ? parsed.technicalCorrectnessScore
          : quality.status === 'valid' ? 7 : 1
        : undefined,
  });

  // Build honest coaching feedback that matches the actual scores
  const honestFeedback = buildHonestCoachingFeedback(
    quality,
    boundedScores,
    question,
    originalAnswer
  );

  const starAnalysis =
    config.category === 'behavioral'
      ? {
          situation:
            quality.status === 'valid' && heuristics.starKeywords.situation
              ? 'Context described in answer.'
              : 'Specific initial context/situation was brief or omitted.',
          task:
            quality.status === 'valid' && heuristics.starKeywords.task
              ? 'Core objective outlined.'
              : 'Clear definition of candidate role or responsibility was light.',
          action:
            quality.status === 'valid' && heuristics.starKeywords.action
              ? 'Individual actions and ownership detailed.'
              : 'Lacked specific "I" actions vs collective team efforts.',
          result:
            quality.status === 'valid' && heuristics.starKeywords.result
              ? 'Measurable outcome or lesson mentioned.'
              : 'Measurable metrics or concrete results missing.',
          adherenceLevel: (
            quality.status === 'valid' && heuristics.starKeywords.action && heuristics.starKeywords.result
              ? 'strong'
              : quality.status === 'valid'
              ? 'partial'
              : 'missing'
          ) as 'strong' | 'partial' | 'missing',
        }
      : undefined;

  // Use model feedback ONLY if the answer was valid and the feedback is non-empty
  const keyWeaknesses =
    quality.status === 'valid' &&
    Array.isArray(parsed?.keyWeaknesses) &&
    parsed.keyWeaknesses.length > 0
      ? parsed.keyWeaknesses.map(String)
      : honestFeedback.keyWeaknesses;

  const explanation =
    quality.status === 'valid' &&
    typeof parsed?.explanation === 'string' &&
    parsed.explanation.trim()
      ? parsed.explanation.trim()
      : honestFeedback.explanation;

  const improvedAnswer =
    typeof parsed?.improvedAnswer === 'string' && parsed.improvedAnswer.trim()
      ? parsed.improvedAnswer.trim()
      : honestFeedback.improvedAnswer;

  const suggestedFollowUpExercise =
    typeof parsed?.suggestedFollowUpExercise === 'string' && parsed.suggestedFollowUpExercise.trim()
      ? parsed.suggestedFollowUpExercise.trim()
      : honestFeedback.suggestedFollowUpExercise;

  return {
    turnIndex,
    question,
    originalAnswer,
    relevanceScore: boundedScores.relevanceScore,
    completenessScore: boundedScores.completenessScore,
    clarityScore: boundedScores.clarityScore,
    logicalStructureScore: boundedScores.logicalStructureScore,
    grammarScore: boundedScores.grammarScore,
    vocabularyScore: boundedScores.vocabularyScore,
    concisenessScore: boundedScores.concisenessScore,
    technicalCorrectnessScore: boundedScores.technicalCorrectnessScore,
    starAnalysis,
    keyWeaknesses,
    explanation,
    improvedAnswer,
    suggestedFollowUpExercise,
  };
}

export function computeOverallReport(
  config: InterviewConfig,
  turns: TurnEvaluation[],
  startedAt: string
): InterviewSessionReport {
  const completedAt = new Date().toISOString();
  const startTimeMs = new Date(startedAt).getTime();
  const endTimeMs = new Date(completedAt).getTime();
  const durationMinutes = Math.max(1, Math.round((endTimeMs - startTimeMs) / 60000));

  if (turns.length === 0) {
    const emptyScores: OverallCoachingScores = {
      overallScore: 0,
      relevance: 0,
      completeness: 0,
      clarity: 0,
      logicalStructure: 0,
      grammar: 0,
      vocabulary: 0,
      conciseness: 0,
      technicalCorrectness: config.category === 'technical' || config.category === 'project-defense' ? 0 : undefined,
    };
    return {
      id: `report-${Date.now()}`,
      config,
      startedAt,
      completedAt,
      durationMinutes,
      totalQuestions: 0,
      scores: emptyScores,
      keyStrengths: ['No interview questions answered yet.'],
      topImprovementAreas: ['Complete at least one interview question to receive an honest skills assessment.'],
      turns: [],
    };
  }

  const avg = (fn: (t: TurnEvaluation) => number) =>
    Math.round((turns.reduce((acc, t) => acc + fn(t), 0) / turns.length) * 10) / 10;

  const relevance = avg((t) => t.relevanceScore);
  const completeness = avg((t) => t.completenessScore);
  const clarity = avg((t) => t.clarityScore);
  const logicalStructure = avg((t) => t.logicalStructureScore);
  const grammar = avg((t) => t.grammarScore);
  const vocabulary = avg((t) => t.vocabularyScore);
  const conciseness = avg((t) => t.concisenessScore);

  let technicalCorrectness: number | undefined;
  const techTurns = turns.filter((t) => typeof t.technicalCorrectnessScore === 'number');
  if (techTurns.length > 0) {
    technicalCorrectness =
      Math.round(
        (techTurns.reduce((acc, t) => acc + (t.technicalCorrectnessScore || 0), 0) / techTurns.length) * 10
      ) / 10;
  }

  // Calculate composite overall score (0-100) honestly without phantom points
  let metricSum =
    relevance +
    completeness +
    clarity +
    logicalStructure +
    grammar +
    vocabulary +
    conciseness;

  let metricCount = 7;
  if (typeof technicalCorrectness === 'number') {
    metricSum += technicalCorrectness;
    metricCount = 8;
  }

  const overallScore = Math.min(100, Math.max(0, Math.round((metricSum / (metricCount * 10)) * 100)));

  // Identify top strengths & improvement areas
  const metricEntries = [
    { name: 'Direct Relevance', val: relevance },
    { name: 'Answer Completeness', val: completeness },
    { name: 'Spoken Clarity', val: clarity },
    { name: 'Logical Structure', val: logicalStructure },
    { name: 'Grammar Precision', val: grammar },
    { name: 'Professional Vocabulary', val: vocabulary },
    { name: 'Conciseness & Cadence', val: conciseness },
  ].sort((a, b) => b.val - a.val);

  // Honest strengths: only award praise if the score actually demonstrated competence (>= 6/10)
  const qualifyingStrengths = metricEntries.filter((m) => m.val >= 6.0);
  let keyStrengths: string[] = [];

  if (qualifyingStrengths.length >= 2) {
    keyStrengths = [
      `Demonstrated consistent strength in ${qualifyingStrengths[0].name.toLowerCase()} (${qualifyingStrengths[0].val}/10).`,
      `Maintained solid ${qualifyingStrengths[1].name.toLowerCase()} across questions (${qualifyingStrengths[1].val}/10).`,
    ];
  } else if (qualifyingStrengths.length === 1) {
    keyStrengths = [
      `Demonstrated baseline competence in ${qualifyingStrengths[0].name.toLowerCase()} (${qualifyingStrengths[0].val}/10).`,
      'Other competencies require additional practice and concrete supporting evidence.',
    ];
  } else {
    keyStrengths = [
      'No demonstrated strengths above baseline in this session.',
      'Submitted answers lacked sufficient relevance, structure, or concrete examples to demonstrate target competencies.',
    ];
  }

  const worstMetrics = [...metricEntries].reverse();
  const topImprovementAreas = [
    `Focus on elevating ${worstMetrics[0].name.toLowerCase()} (${worstMetrics[0].val}/10) by providing direct, concrete evidence.`,
    `Enhance ${worstMetrics[1].name.toLowerCase()} (${worstMetrics[1].val}/10) by eliminating vague generalizations or non-answers.`,
  ];

  return {
    id: `report-${Date.now()}`,
    config,
    startedAt,
    completedAt,
    durationMinutes,
    totalQuestions: turns.length,
    scores: {
      overallScore,
      relevance,
      completeness,
      clarity,
      logicalStructure,
      grammar,
      vocabulary,
      conciseness,
      technicalCorrectness,
    },
    keyStrengths,
    topImprovementAreas,
    turns,
  };
}
