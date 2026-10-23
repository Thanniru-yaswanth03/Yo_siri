/**
 * Yo Siri — Phase 4: Interview Evaluator
 * Computes deterministic coaching metrics and parses LLM evaluation outputs
 */

import {
  InterviewConfig,
  TurnEvaluation,
  OverallCoachingScores,
  InterviewSessionReport,
} from './types';

export function calculateTurnHeuristics(
  answer: string
): {
  concisenessScore: number;
  clarityScore: number;
  relevanceScore: number;
  starKeywords: { situation: boolean; task: boolean; action: boolean; result: boolean };
} {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Conciseness evaluation: sweet spot for interview answers is ~40-150 words (30-90 seconds spoken)
  let conciseness = 8;
  if (wordCount < 15) conciseness = 4; // too brief / incomplete
  else if (wordCount < 30) conciseness = 6;
  else if (wordCount <= 160) conciseness = 9;
  else if (wordCount <= 220) conciseness = 7;
  else conciseness = 5; // rambling / too long

  // Clarity: check for excessive filler words
  const lower = answer.toLowerCase();
  const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'sort of', 'kind of'];
  let fillerCount = 0;
  for (const f of fillers) {
    const matches = lower.match(new RegExp(`\\b${f}\\b`, 'g'));
    if (matches) fillerCount += matches.length;
  }
  const clarity = Math.max(4, Math.min(10, 10 - fillerCount * 1.5));

  // STAR keywords check
  const starKeywords = {
    situation: /\b(when|while|working at|project|context|situation|background)\b/i.test(answer),
    task: /\b(task|goal|needed to|assigned|objective|responsible|challenge)\b/i.test(answer),
    action: /\b(i decided|i implemented|i built|i initiated|i wrote|my approach|i designed)\b/i.test(answer),
    result: /\b(result|results|resulted|outcome|outcomes|increased|reduced|reduction|improved|delivered|achieved|saved|percent)\b|%/i.test(answer),
  };

  return {
    concisenessScore: conciseness,
    clarityScore: Math.round(clarity),
    relevanceScore: wordCount >= 20 ? 8 : 5,
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
  const heuristics = calculateTurnHeuristics(originalAnswer);

  try {
    let jsonStr = rawText.trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonStr);

      const clamp = (val: unknown, fallback: number) => {
        const num = typeof val === 'number' ? val : Number(val);
        return isNaN(num) ? fallback : Math.max(1, Math.min(10, Math.round(num)));
      };

      const starAnalysis =
        config.category === 'behavioral'
          ? {
              situation:
                parsed.starAnalysis?.situation ||
                (heuristics.starKeywords.situation ? 'Context described in answer.' : 'Specific initial context/situation was brief or omitted.'),
              task:
                parsed.starAnalysis?.task ||
                (heuristics.starKeywords.task ? 'Core objective outlined.' : 'Clear definition of candidate role or responsibility was light.'),
              action:
                parsed.starAnalysis?.action ||
                (heuristics.starKeywords.action ? 'Individual actions and ownership detailed.' : 'Lacked specific "I" actions vs collective team efforts.'),
              result:
                parsed.starAnalysis?.result ||
                (heuristics.starKeywords.result ? 'Measurable outcome or lesson mentioned.' : 'Measurable metrics or concrete results missing.'),
              adherenceLevel: (parsed.starAnalysis?.adherenceLevel ||
                (heuristics.starKeywords.action && heuristics.starKeywords.result ? 'strong' : 'partial')) as 'strong' | 'partial' | 'missing',
            }
          : undefined;

      return {
        turnIndex,
        question,
        originalAnswer,
        relevanceScore: clamp(parsed.relevanceScore, heuristics.relevanceScore),
        completenessScore: clamp(parsed.completenessScore, 7),
        clarityScore: clamp(parsed.clarityScore, heuristics.clarityScore),
        logicalStructureScore: clamp(parsed.logicalStructureScore, 7),
        grammarScore: clamp(parsed.grammarScore, 8),
        vocabularyScore: clamp(parsed.vocabularyScore, 7),
        concisenessScore: clamp(parsed.concisenessScore, heuristics.concisenessScore),
        technicalCorrectnessScore:
          config.category === 'technical' || config.category === 'project-defense' || config.category === 'placement'
            ? clamp(parsed.technicalCorrectnessScore, 7)
            : undefined,
        starAnalysis,
        keyWeaknesses: Array.isArray(parsed.keyWeaknesses) && parsed.keyWeaknesses.length > 0
          ? parsed.keyWeaknesses
          : ['Could provide more concrete metrics or quantifiable outcomes.'],
        explanation:
          typeof parsed.explanation === 'string' && parsed.explanation.trim()
            ? parsed.explanation.trim()
            : 'Good foundational response, but strengthening structural clarity and adding concrete examples will significantly elevate impact.',
        improvedAnswer:
          typeof parsed.improvedAnswer === 'string' && parsed.improvedAnswer.trim()
            ? parsed.improvedAnswer.trim()
            : `To strengthen this answer, begin with a concise 1-sentence headline, articulate your specific contribution clearly, and conclude with the measurable impact or takeaway.`,
        suggestedFollowUpExercise:
          typeof parsed.suggestedFollowUpExercise === 'string' && parsed.suggestedFollowUpExercise.trim()
            ? parsed.suggestedFollowUpExercise.trim()
            : 'Practice retelling this story in 60 seconds focusing specifically on quantifiable outcomes and personal ownership.',
      };
    }
  } catch {
    // Fall through to deterministic fallback below
  }

  // Deterministic fallback if model json fails
  return {
    turnIndex,
    question,
    originalAnswer,
    relevanceScore: heuristics.relevanceScore,
    completenessScore: 7,
    clarityScore: heuristics.clarityScore,
    logicalStructureScore: 7,
    grammarScore: 8,
    vocabularyScore: 7,
    concisenessScore: heuristics.concisenessScore,
    technicalCorrectnessScore:
      config.category === 'technical' || config.category === 'project-defense' ? 7 : undefined,
    starAnalysis:
      config.category === 'behavioral'
        ? {
            situation: heuristics.starKeywords.situation ? 'Context identified' : 'Background context was brief',
            task: heuristics.starKeywords.task ? 'Specific challenge outlined' : 'Challenge could be sharper',
            action: heuristics.starKeywords.action ? 'Clear action steps' : 'Focus more on your direct individual actions',
            result: heuristics.starKeywords.result ? 'Results stated' : 'Include measurable impact/percentages',
            adherenceLevel: heuristics.starKeywords.action && heuristics.starKeywords.result ? 'strong' : 'partial',
          }
        : undefined,
    keyWeaknesses: [
      heuristics.concisenessScore < 7
        ? 'Answer pacing was uneven; aim for 60 to 90 seconds of spoken delivery.'
        : 'Could state more specific trade-offs or measurable outcomes.',
      'Ensure every claim is supported with a concrete technical or situational detail.',
    ],
    explanation:
      'The response communicated the broad idea, but adding clearer structure (Headline → Actions → Measurable Impact) will make it far more memorable to interviewers.',
    improvedAnswer:
      'In my recent project, I tackled this by first identifying the critical bottleneck. Specifically, I designed a streamlined solution that reduced latency by 30% and improved team velocity.',
    suggestedFollowUpExercise:
      'Re-record this answer in 3 concise sentences: 1. The challenge, 2. Your specific solution, 3. The quantifiable result.',
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
    const defaultScores: OverallCoachingScores = {
      overallScore: 70,
      relevance: 7,
      completeness: 7,
      clarity: 7,
      logicalStructure: 7,
      grammar: 7,
      vocabulary: 7,
      conciseness: 7,
    };
    return {
      id: `report-${Date.now()}`,
      config,
      startedAt,
      completedAt,
      durationMinutes,
      totalQuestions: 0,
      scores: defaultScores,
      keyStrengths: ['Completed interview session practice.'],
      topImprovementAreas: ['Practice answering questions completely with structured examples.'],
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

  // Calculate composite overall score (1-100)
  const metricSum =
    relevance +
    completeness +
    clarity +
    logicalStructure +
    grammar +
    vocabulary +
    conciseness +
    (technicalCorrectness || 7.5);
  const metricCount = technicalCorrectness ? 8 : 7;
  const overallScore = Math.min(100, Math.max(30, Math.round((metricSum / (metricCount * 10)) * 100)));

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

  const keyStrengths = [
    `Demonstrated consistent strength in ${metricEntries[0].name.toLowerCase()} (${metricEntries[0].val}/10).`,
    `Maintained strong ${metricEntries[1].name.toLowerCase()} across simulated questions (${metricEntries[1].val}/10).`,
  ];

  const worstMetrics = [...metricEntries].reverse();
  const topImprovementAreas = [
    `Focus on elevating ${worstMetrics[0].name.toLowerCase()} (${worstMetrics[0].val}/10) by providing more structured points.`,
    `Enhance ${worstMetrics[1].name.toLowerCase()} (${worstMetrics[1].val}/10) by eliminating vague generalizations.`,
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
