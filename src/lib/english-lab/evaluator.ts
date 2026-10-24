/**
 * Yo Siri — Phase 5: English Lab Evaluator & Transcript Analyzer
 * Combines deterministic transcript analysis (filler words, conciseness)
 * with LLM semantic evaluation guaranteeing the 6 required feedback elements.
 */

import {
  FillerWordOccurrence,
  GrammarMistakeItem,
  LabCategory,
  LabTurnEvaluation,
  RetryComparison,
  VocabularyUpgradeItem,
  WeaknessCategory,
} from './types';
import { assessAnswerQuality, verifyEvidenceExists } from '@/lib/evaluation';

// Common verbal fillers to scan deterministically in spoken transcripts
const COMMON_FILLERS: string[] = [
  'um',
  'uh',
  'er',
  'ah',
  'like',
  'basically',
  'actually',
  'literally',
  'you know',
  'sort of',
  'kind of',
  'i mean',
  'honestly',
];

/**
 * Deterministically scan transcript for filler words with exact counts and locations
 */
export function scanTranscriptFillers(text: string): {
  totalFillers: number;
  fillers: FillerWordOccurrence[];
  advice: string;
} {
  const lower = text.toLowerCase();
  const occurrences: FillerWordOccurrence[] = [];
  let total = 0;

  for (const filler of COMMON_FILLERS) {
    // Regex matching word boundary
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = Array.from(lower.matchAll(regex));

    if (matches.length > 0) {
      total += matches.length;
      occurrences.push({
        word: filler,
        count: matches.length,
        locations: matches.map((m) => `char ${m.index}`),
      });
    }
  }

  // Sort by highest frequency
  occurrences.sort((a, b) => b.count - a.count);

  let advice = 'Zero verbal filler words detected. Exceptional speech economy!';
  if (total > 0 && total <= 2) {
    advice = 'Minimal filler usage. Try taking a silent 1-second pause when searching for your next phrase.';
  } else if (total > 2) {
    advice = `Detected ${total} filler words (primarily "${occurrences[0]?.word || 'fillers'}"). Train purposeful pauses to convey confidence.`;
  }

  return {
    totalFillers: total,
    fillers: occurrences,
    advice,
  };
}

/**
 * Deterministically calculate conciseness and speaking metrics
 */
export function analyzeConciseness(text: string): {
  wordCount: number;
  estimatedSpokenSeconds: number;
  isRambling: boolean;
  suggestedMaxWords: number;
} {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  // Average speaking rate ~130 words per minute => ~2.16 words per second
  const estimatedSpokenSeconds = Math.round((wordCount / 130) * 60);
  const suggestedMaxWords = 90;
  const isRambling = wordCount > 160;

  return {
    wordCount,
    estimatedSpokenSeconds,
    isRambling,
    suggestedMaxWords,
  };
}

interface RawParsedEvaluation {
  correctedVersion?: string;
  mainMistakes?: Array<{
    originalSegment?: string;
    correctedSegment?: string;
    explanation?: string;
    isStylisticPreference?: boolean;
  }>;
  clearExplanation?: string;
  naturalAlternative?: string;
  shortPracticeExercise?: {
    prompt?: string;
    targetFocus?: string;
    hint?: string;
  };
  vocabularyUpgrades?: Array<{
    originalWord?: string;
    upgradeWord?: string;
    reason?: string;
  }>;
  identifiedWeaknesses?: Array<{
    category?: string;
    title?: string;
    verbatimExcerpt?: string;
  }>;
}

interface RawParsedRetry {
  improvements?: string[];
  remainingGaps?: string[];
  coachingSummary?: string;
}

/**
 * Parse LLM JSON output with fallback heuristics guaranteeing all 6 required items
 */
export function parseLabTurnEvaluation(
  rawJsonOrText: string,
  question: string,
  originalAnswer: string,
  category: LabCategory
): LabTurnEvaluation {
  const cleanAnswer = originalAnswer.trim();
  const quality = assessAnswerQuality(question, cleanAnswer);
  const fillerAnalysis = scanTranscriptFillers(cleanAnswer);
  const conciseness = analyzeConciseness(cleanAnswer);

  let parsed: RawParsedEvaluation | null = null;

  try {
    // Look for JSON block in markdown or raw
    const jsonMatch = rawJsonOrText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]) as RawParsedEvaluation;
    }
  } catch {
    // ignore parse error, fallback kicks in
  }

  // Fallback defaults if LLM didn't return complete JSON
  const fallbackCorrected =
    quality.status === 'valid'
      ? parsed?.correctedVersion || cleanAnswer
      : cleanAnswer.length > 0
      ? cleanAnswer
      : 'Please provide an answer to practice.';

  // Filter grammar mistakes to only keep items with verifiable excerpts
  const fallbackMistakes: GrammarMistakeItem[] = quality.status === 'valid' && Array.isArray(parsed?.mainMistakes)
    ? parsed.mainMistakes
        .filter((m) => m && m.originalSegment && verifyEvidenceExists(String(m.originalSegment), cleanAnswer))
        .map((m) => ({
          originalSegment: String(m.originalSegment || ''),
          correctedSegment: String(m.correctedSegment || ''),
          explanation: String(m.explanation || 'Refine for grammatical accuracy.'),
          isStylisticPreference: Boolean(m.isStylisticPreference),
        }))
    : [];

  let fallbackExplanation = '';
  if (quality.status === 'empty' || quality.status === 'nonsensical') {
    fallbackExplanation = 'No intelligible answer was provided. Speak or type a clear, complete sentence to evaluate grammar and clarity.';
  } else if (quality.status === 'refusal') {
    fallbackExplanation = 'You indicated lack of knowledge or declined to answer. Practice responding by explaining your thought process or what you know.';
  } else if (quality.status === 'irrelevant') {
    fallbackExplanation = 'The response was off-topic and did not answer the prompt. Focus on answering the specific prompt asked.';
  } else if (quality.status === 'insufficient') {
    fallbackExplanation = 'The answer was too brief to evaluate sentence variety or grammatical structure. Aim for a complete sentence with detail.';
  } else {
    fallbackExplanation =
      parsed?.clearExplanation ||
      (fallbackMistakes.length > 0
        ? `Identified ${fallbackMistakes.length} area(s) for grammatical refinement while preserving your intended meaning.`
        : 'Your answer is grammatically sound, well-structured, and communicates your message clearly.');
  }

  const fallbackAlternative =
    quality.status === 'valid'
      ? parsed?.naturalAlternative ||
        (cleanAnswer.length > 0
          ? `In conversation, you could naturally say: "${cleanAnswer}"`
          : 'A natural, confident response.')
      : 'A direct, natural response answering the prompt clearly.';

  const fallbackExercise = parsed?.shortPracticeExercise && typeof parsed.shortPracticeExercise === 'object'
    ? {
        prompt: String(parsed.shortPracticeExercise.prompt || 'Try rephrasing your answer with the suggested corrections.'),
        targetFocus: String(parsed.shortPracticeExercise.targetFocus || 'Sentence clarity and flow'),
        hint: parsed.shortPracticeExercise.hint ? String(parsed.shortPracticeExercise.hint) : undefined,
      }
    : {
        prompt: 'Re-answer the prompt applying the corrected phrasing.',
        targetFocus: `${category} precision`,
        hint: 'Keep your sentences crisp and avoid rushing.',
      };

  // Filter vocabulary upgrades to only keep words actually present in user answer
  const vocabularyUpgrades: VocabularyUpgradeItem[] = quality.status === 'valid' && Array.isArray(parsed?.vocabularyUpgrades)
    ? parsed.vocabularyUpgrades
        .filter((v) => v && v.originalWord && verifyEvidenceExists(String(v.originalWord), cleanAnswer))
        .map((v) => ({
          originalWord: String(v.originalWord || ''),
          upgradeWord: String(v.upgradeWord || ''),
          reason: String(v.reason || 'Enhances impact and professional tone.'),
        }))
    : [];

  // Categorize identified weaknesses from LLM and transcript evidence
  const identifiedWeaknesses: Array<{
    category: WeaknessCategory;
    title: string;
    verbatimExcerpt: string;
  }> = [];

  if (Array.isArray(parsed?.identifiedWeaknesses)) {
    for (const item of parsed.identifiedWeaknesses) {
      if (item && item.category && item.title) {
        identifiedWeaknesses.push({
          category: item.category as WeaknessCategory,
          title: String(item.title),
          verbatimExcerpt: String(item.verbatimExcerpt || cleanAnswer.slice(0, 60)),
        });
      }
    }
  }

  // Supplement with deterministic transcript evidence
  if (fillerAnalysis.totalFillers >= 2 && !identifiedWeaknesses.some((w) => w.category === 'filler-words')) {
    identifiedWeaknesses.push({
      category: 'filler-words',
      title: 'Repeated Filler Words',
      verbatimExcerpt: fillerAnalysis.fillers.map((f) => `"${f.word}" (${f.count}x)`).join(', '),
    });
  }

  if (conciseness.isRambling && !identifiedWeaknesses.some((w) => w.category === 'rambling-answers')) {
    identifiedWeaknesses.push({
      category: 'rambling-answers',
      title: 'Answer Length Overrun',
      verbatimExcerpt: `${conciseness.wordCount} words (~${conciseness.estimatedSpokenSeconds}s speaking time)`,
    });
  }

  return {
    id: `eval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    turnIndex: 1,
    drillCategory: category,
    question,
    originalAnswer: cleanAnswer,
    correctedVersion: fallbackCorrected,
    mainMistakes: fallbackMistakes,
    clearExplanation: fallbackExplanation,
    naturalAlternative: fallbackAlternative,
    shortPracticeExercise: fallbackExercise,
    vocabularyUpgrades,
    fillerWordAnalysis: fillerAnalysis,
    concisenessMetrics: conciseness,
    identifiedWeaknesses,
  };
}

/**
 * Parse Retry comparison JSON response
 */
export function parseRetryComparison(
  rawJsonOrText: string,
  attempt1: string,
  attempt2: string
): RetryComparison {
  const fillers1 = scanTranscriptFillers(attempt1);
  const fillers2 = scanTranscriptFillers(attempt2);
  const words1 = analyzeConciseness(attempt1).wordCount;
  const words2 = analyzeConciseness(attempt2).wordCount;

  let parsed: RawParsedRetry | null = null;
  try {
    const jsonMatch = rawJsonOrText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]) as RawParsedRetry;
    }
  } catch {
    // fallback
  }

  const improvements: string[] = Array.isArray(parsed?.improvements) && parsed.improvements.length > 0
    ? parsed.improvements.map(String)
    : [
        words2 < words1 ? `Reduced length from ${words1} to ${words2} words for punchier delivery.` : 'Maintained good answer detail.',
        fillers2.totalFillers < fillers1.totalFillers
          ? `Decreased filler count from ${fillers1.totalFillers} down to ${fillers2.totalFillers}.`
          : 'Delivered an intentional re-take of the concept.',
      ];

  const remainingGaps: string[] = Array.isArray(parsed?.remainingGaps)
    ? parsed.remainingGaps.map(String)
    : [];

  const coachingSummary =
    parsed?.coachingSummary ||
    'Great follow-through on this retry! Applying feedback immediately is the fastest way to build permanent fluency.';

  return {
    attempt1: {
      answer: attempt1,
      wordCount: words1,
      fillerCount: fillers1.totalFillers,
      mistakeCount: 1,
    },
    attempt2: {
      answer: attempt2,
      wordCount: words2,
      fillerCount: fillers2.totalFillers,
      mistakeCount: Math.max(0, fillers2.totalFillers),
    },
    improvements,
    remainingGaps,
    coachingSummary,
  };
}
