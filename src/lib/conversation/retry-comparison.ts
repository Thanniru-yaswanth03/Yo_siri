/**
 * Yo Siri — Retry & Before/After Comparison Engine
 * Compares a candidate's retry attempt against their original attempt.
 * Identifies genuine improvements, remaining issues, and new issues without exaggeration.
 */

import { TurnFeedback } from '@/types';

export interface RetryComparisonResult {
  originalAnswer: string;
  retryAnswer: string;
  wordCountDelta: number;
  improvements: string[];
  remainingIssues: string[];
  newIssues: string[];
  overallProgress: 'significant' | 'moderate' | 'unchanged' | 'needs-attention';
  summary: string;
}

export function compareAttempts(
  originalAnswer: string,
  retryAnswer: string,
  originalFeedback?: TurnFeedback | null,
  retryFeedback?: TurnFeedback | null
): RetryComparisonResult {
  const origTrimmed = originalAnswer.trim();
  const retryTrimmed = retryAnswer.trim();

  const origWords = origTrimmed.split(/\s+/).filter(Boolean);
  const retryWords = retryTrimmed.split(/\s+/).filter(Boolean);
  const wordCountDelta = retryWords.length - origWords.length;

  const improvements: string[] = [];
  const remainingIssues: string[] = [];
  const newIssues: string[] = [];

  const origGrammar = originalFeedback?.grammar || [];
  const retryGrammar = retryFeedback?.grammar || [];

  // Check which original grammar errors were resolved in the retry
  origGrammar.forEach((og) => {
    const errorStillInRetry = retryTrimmed.toLowerCase().includes(og.original.toLowerCase());
    const correctionAdopted = retryTrimmed.toLowerCase().includes(og.corrected.toLowerCase());

    if (correctionAdopted || !errorStillInRetry) {
      improvements.push(`Corrected grammar slip: "${og.original}" → resolved`);
    } else {
      remainingIssues.push(`Unresolved error: "${og.original}" still present`);
    }
  });

  // Check if original vocabulary recommendations were adopted
  const origVocab = originalFeedback?.vocabulary || [];
  origVocab.forEach((ov) => {
    const upgradeAdopted = retryTrimmed.toLowerCase().includes(ov.upgrade.toLowerCase());
    if (upgradeAdopted) {
      improvements.push(`Applied vocabulary upgrade: "${ov.upgrade}"`);
    }
  });

  // Check clarity score progression
  const origClarity = originalFeedback?.clarityScore ?? 75;
  const retryClarity = retryFeedback?.clarityScore ?? 75;

  if (retryClarity > origClarity) {
    improvements.push(`Clarity improved from ${origClarity} to ${retryClarity}/100`);
  } else if (retryClarity < origClarity && Math.abs(retryClarity - origClarity) > 8) {
    remainingIssues.push(`Clarity shifted from ${origClarity} to ${retryClarity}/100`);
  }

  // Check new grammar issues in retry that were not in original
  retryGrammar.forEach((rg) => {
    const wasInOriginal = origGrammar.some(
      (og) => og.original.toLowerCase() === rg.original.toLowerCase()
    );
    if (!wasInOriginal) {
      newIssues.push(`New grammar consideration: "${rg.original}" (try: "${rg.corrected}")`);
    }
  });

  // If word count was excessively short and is now more complete
  if (origWords.length < 15 && retryWords.length >= 20) {
    improvements.push(`Provided a more complete and thorough explanation (+${wordCountDelta} words)`);
  } else if (origWords.length > 80 && retryWords.length <= 60 && retryWords.length >= 25) {
    improvements.push(`Improved conciseness and eliminated rambling (-${Math.abs(wordCountDelta)} words)`);
  }

  // Overall progress synthesis
  let overallProgress: 'significant' | 'moderate' | 'unchanged' | 'needs-attention' = 'moderate';
  if (improvements.length >= 2 && newIssues.length === 0) {
    overallProgress = 'significant';
  } else if (improvements.length === 0 && newIssues.length > 0) {
    overallProgress = 'needs-attention';
  } else if (improvements.length === 0 && remainingIssues.length === 0) {
    overallProgress = 'unchanged';
  }

  const summary =
    overallProgress === 'significant'
      ? `Strong revision! You resolved ${improvements.length} specific issue(s) without introducing new errors.`
      : overallProgress === 'moderate'
      ? `Good effort. You addressed key feedback while maintaining your core message.`
      : overallProgress === 'needs-attention'
      ? `A few new areas to polish. Review the suggestions and try one more concise attempt.`
      : `Both attempts are comparable in structure and clarity.`;

  return {
    originalAnswer: origTrimmed,
    retryAnswer: retryTrimmed,
    wordCountDelta,
    improvements,
    remainingIssues,
    newIssues,
    overallProgress,
    summary,
  };
}
