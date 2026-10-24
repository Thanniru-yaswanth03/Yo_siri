/**
 * Yo Siri — Quality Gate & Answer Validity Assessment
 * Deterministic pre-assessment and semantic verification engine.
 */

import { AnswerValidityStatus, QualityAssessment } from './types';

// Common refusal phrases and admissions of ignorance
const REFUSAL_PATTERNS = [
  /^(no|nope|nah|nay)[.!?]*$/i,
  /^(i don'?t know|idk|i do not know)[.!?]*$/i,
  /^(no idea|have no idea|no clue|have no clue)[.!?]*$/i,
  /^(pass|skip|n\/?a|next|dunno|nothing|not sure|dont know)[.!?]*$/i,
  /^(i have nothing to say|can'?t answer|won'?t answer)[.!?]*$/i,
];

// Common prompt injection attack patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore\b.*?\binstructions/i,
  /ignore\b.*?\brubric/i,
  /disregard\b.*?\b(instructions|rubric|prompt|guidelines)/i,
  /(give|award)\b.*?\b(perfect|10\/10|100%?|top|full|high|maximum)\b/i,
  /system prompt override/i,
  /developer mode/i,
  /override\b.*?\b(system|rubric|evaluation|score)/i,
  /as an ai,? (rate|give|score) this (10|100|perfect)/i,
  /pretend you are/i,
];

// Common off-topic semantic domains when not asked about them
const OFF_TOPIC_DOMAINS = [
  {
    name: 'sports/games',
    keywords: ['football', 'soccer', 'basketball', 'cricket', 'baseball', 'tennis', 'fifa', 'nfl'],
    questionContextExceptions: ['sport', 'game', 'hobby', 'athletic', 'team sport'],
  },
  {
    name: 'weather/climate',
    keywords: ['weather', 'sunny', 'raining', 'cloudy', 'forecast', 'snowing'],
    questionContextExceptions: ['weather', 'climate', 'forecast', 'meteorology'],
  },
  {
    name: 'food/eating',
    keywords: ['pizza', 'burger', 'pasta', 'dinner yesterday', 'favorite food', 'lunch today'],
    questionContextExceptions: ['food', 'cook', 'diet', 'restaurant', 'meal', 'eat'],
  },
  {
    name: 'unrelated historical trivia',
    keywords: ['created in 1995', 'founded in 1776', 'invented by thomas', 'civil war ended'],
    questionContextExceptions: ['history of', 'when was', 'who invented', 'history'],
  },
];

// Core buzzwords used in keyword stuffing
const BUZZWORDS = [
  'teamwork',
  'leadership',
  'communication',
  'collaboration',
  'empathy',
  'problem-solving',
  'synergy',
  'critical thinking',
  'adaptability',
  'agile',
  'hard worker',
  'dedicated',
  'passionate',
];

// Domain terms for semantic recognition without literal keyword parroting
const TECHNICAL_PROBLEM_TERMS = [
  'technical', 'bottleneck', 'latency', 'performance', 'scalability', 'scale',
  'slow', 'optimization', 'database', 'queries', 'query', 'memory', 'cpu',
  'throughput', 'concurrency', 'deadlock', 'profiling', 'cache', 'redis'
];

const TECHNICAL_ACTION_AND_OUTCOME_TERMS = [
  'profiled', 'identified', 'indexed', 'index', 'caching', 'redis', 'reduced',
  'latency', 'throughput', 'p99', 'p95', 'seconds', 'surge', 'load', 'optimized',
  'implemented', 'refactored', 'debugged', 'resolved', 'fixed', 'degraded', 'queries', 'database'
];

/**
 * Determines whether a question expects a concise factual/definition response
 * vs an expanded narrative/behavioral response.
 */
export function isQuestionExpectingConciseAnswer(question?: string): boolean {
  if (!question || typeof question !== 'string') return false;
  const q = question.toLowerCase().trim();
  if (
    q.startsWith('what does ') ||
    q.startsWith('what is the acronym') ||
    q.startsWith('define ') ||
    q.startsWith('what stands for') ||
    q.includes('time complexity') ||
    q.includes('http stand for') ||
    q.includes('status code for') ||
    q.includes('in one sentence') ||
    q.includes('briefly define')
  ) {
    return true;
  }
  return false;
}

/**
 * Computes consonant/vowel balance and character repetition to detect gibberish.
 */
function isGibberishOrKeyboardMash(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length < 3) return false;

  // Single character repeated, e.g. "aaaaaa", "zzzzzzz"
  if (/^([a-z])\1{3,}$/.test(clean)) return true;

  // Repeated 2-character sequence, e.g. "abababab", "asdasdasd"
  if (/^([a-z]{2,3})\1{2,}$/.test(clean)) return true;

  // Obvious keyboard rows / mash
  const mashPatterns = [
    /asdfgh/i,
    /qwerty/i,
    /zxcvbn/i,
    /hjkl/i,
    /blah blah blah/i,
  ];
  for (const p of mashPatterns) {
    if (p.test(text)) return true;
  }

  // Vowel ratio check for longer words/fragments without vowels
  const vowels = clean.match(/[aeiou]/g)?.length || 0;
  const vowelRatio = vowels / clean.length;
  // English words typically have vowel ratios between 0.22 and 0.65
  if (clean.length >= 7 && (vowelRatio < 0.12 || vowelRatio > 0.85)) {
    return true;
  }

  return false;
}

/**
 * Checks for keyword stuffing: high density of target keywords with low grammatical connective tissue
 */
function isKeywordStuffing(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const words = text.toLowerCase().split(/[\s,.;:-]+/).filter(Boolean);
  if (words.length < 5) return false;

  let buzzCount = 0;
  for (const w of words) {
    if (BUZZWORDS.includes(w)) buzzCount++;
  }

  const ratio = buzzCount / words.length;
  // If > 45% of words are ungrounded buzzwords, it's keyword stuffing
  return ratio > 0.45;
}

/**
 * Checks for unsupported self-praise without actions or outcomes
 */
function isUnsupportedSelfPraise(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  const selfPraisePatterns = [
    /\bi am (an? )?(amazing|the best|an expert|incredible|flawless|perfect|greatest)\b/i,
    /\bi have (all the|the best|master level) skills\b/i,
    /\beveryone loves working with me because i am perfect\b/i,
  ];

  const hasPraise = selfPraisePatterns.some((p) => p.test(lower));
  if (!hasPraise) return false;

  // Check if there are concrete action verbs or project context
  const hasEvidence = /\b(because|when|project|example|built|reduced|increased|resulted|designed|implemented)\b/i.test(
    lower
  );

  return !hasEvidence;
}

/**
 * Checks if the answer completely diverges to an unrelated topic
 */
function isBlatantlyOffTopic(question?: string, answer?: string): boolean {
  const qLower = (question || '').toLowerCase();
  const aLower = (answer || '').toLowerCase();

  for (const domain of OFF_TOPIC_DOMAINS) {
    const isQuestionAboutDomain = domain.questionContextExceptions.some((exc) =>
      qLower.includes(exc)
    );
    if (isQuestionAboutDomain) continue;

    for (const kw of domain.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(aLower)) {
        // Answer mentions an off-topic domain and question has zero relation to it
        return true;
      }
    }
  }

  return false;
}

/**
 * Extract meaningful semantic tokens from a prompt/question
 */
function extractCoreKeywords(text?: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'and', 'or', 'to', 'in', 'on', 'at', 'by',
    'for', 'with', 'about', 'how', 'what', 'why', 'when', 'where', 'who', 'which', 'did', 'do',
    'does', 'you', 'your', 'would', 'could', 'should', 'can', 'time', 'describe', 'tell', 'me',
    'per', 'via', 'using', 'through', 'across', 'into', 'onto', 'like', 'give', 'explain', 'have',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

/**
 * Compares two words with exact equality or prefix stem matching
 * Prevents substring false positives (e.g. 'per' matching inside 'interpersonal')
 */
function wordsMatch(w1: string, w2: string): boolean {
  if (w1 === w2) return true;
  if (w1.length >= 4 && w2.length >= 4) {
    if (w1.startsWith(w2) && w1.length - w2.length <= 3) return true;
    if (w2.startsWith(w1) && w2.length - w1.length <= 3) return true;
  }
  return false;
}

/**
 * Master Answer-Quality Assessment Function
 */
export function assessAnswerQuality(question: string = '', rawAnswer: string = ''): QualityAssessment {
  const safeQuestion = question || '';
  const trimmed = (rawAnswer || '').trim();
  const detectedFlags: string[] = [];

  // Stage 1: Empty or whitespace-only
  if (!trimmed || trimmed.length === 0) {
    return {
      status: 'empty',
      isEvaluable: false,
      relevanceScore: 0,
      meaningfulnessScore: 0,
      completenessScore: 0,
      clarityScore: 0,
      structureScore: 0,
      detectedFlags: ['empty_submission'],
      diagnosticExplanation: 'No answer provided. Please speak or type your response.',
      sanitizedAnswer: '',
      isPromptInjection: false,
      isConciseQuestion: false,
    };
  }

  // Stage 2: Prompt Injection Detection
  let isPromptInjection = false;
  for (const p of PROMPT_INJECTION_PATTERNS) {
    if (p.test(trimmed)) {
      isPromptInjection = true;
      return {
        status: 'nonsensical',
        isEvaluable: false,
        relevanceScore: 0,
        meaningfulnessScore: 0,
        completenessScore: 0,
        clarityScore: 1,
        structureScore: 0,
        detectedFlags: ['prompt_injection_attempt'],
        diagnosticExplanation: 'Submission contained prompt injection attempts or system instructions instead of an evaluable answer.',
        sanitizedAnswer: trimmed,
        isPromptInjection: true,
        isConciseQuestion: false,
      };
    }
  }

  // Stage 3: Nonsensical / Gibberish / Keyboard Mash
  if (isGibberishOrKeyboardMash(trimmed)) {
    return {
      status: 'nonsensical',
      isEvaluable: false,
      relevanceScore: 0,
      meaningfulnessScore: 0,
      completenessScore: 0,
      clarityScore: 1,
      structureScore: 0,
      detectedFlags: [...detectedFlags, 'gibberish_or_keyboard_mash'],
      diagnosticExplanation: 'The response contains random characters or unintelligible text.',
      sanitizedAnswer: trimmed,
      isPromptInjection,
      isConciseQuestion: isQuestionExpectingConciseAnswer(safeQuestion),
    };
  }

  // Stage 4: Explicit Refusal or Ignorance
  for (const ref of REFUSAL_PATTERNS) {
    if (ref.test(trimmed)) {
      return {
        status: 'refusal',
        isEvaluable: true,
        relevanceScore: 1,
        meaningfulnessScore: 2,
        completenessScore: 0,
        clarityScore: 3,
        structureScore: 1,
        detectedFlags: [...detectedFlags, 'explicit_refusal_or_ignorance'],
        diagnosticExplanation: 'Candidate explicitly stated they do not know or declined to answer.',
        sanitizedAnswer: trimmed,
        isPromptInjection,
        isConciseQuestion: isQuestionExpectingConciseAnswer(safeQuestion),
      };
    }
  }

  const isConcise = isQuestionExpectingConciseAnswer(safeQuestion);
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Stage 5: Keyword Stuffing
  if (isKeywordStuffing(trimmed)) {
    return {
      status: 'keyword_stuffing',
      isEvaluable: true,
      relevanceScore: 2,
      meaningfulnessScore: 1,
      completenessScore: 1,
      clarityScore: 2,
      structureScore: 1,
      detectedFlags: [...detectedFlags, 'keyword_stuffing'],
      diagnosticExplanation: 'Response consists of keyword buzzwords without genuine sentence structure or demonstrated experience.',
      sanitizedAnswer: trimmed,
      isPromptInjection,
      isConciseQuestion: isConcise,
    };
  }

  // Stage 6: Unsupported Self-Praise
  if (isUnsupportedSelfPraise(trimmed)) {
    return {
      status: 'unsupported_claims',
      isEvaluable: true,
      relevanceScore: 2,
      meaningfulnessScore: 2,
      completenessScore: 1,
      clarityScore: 4,
      structureScore: 2,
      detectedFlags: [...detectedFlags, 'unsupported_self_praise'],
      diagnosticExplanation: 'Candidate asserted high personal capability without providing concrete actions, reasoning, or evidence.',
      sanitizedAnswer: trimmed,
      isPromptInjection,
      isConciseQuestion: isConcise,
    };
  }

  // Stage 7: Blatantly Off-Topic / Irrelevant
  if (isBlatantlyOffTopic(safeQuestion, trimmed)) {
    return {
      status: 'irrelevant',
      isEvaluable: true,
      relevanceScore: 0,
      meaningfulnessScore: 3,
      completenessScore: 0,
      clarityScore: Math.min(6, Math.max(2, Math.round(wordCount / 5))),
      structureScore: 1,
      detectedFlags: [...detectedFlags, 'blatantly_off_topic'],
      diagnosticExplanation: 'The response discusses an unrelated topic and does not address the question.',
      sanitizedAnswer: trimmed,
      isPromptInjection,
      isConciseQuestion: isConcise,
    };
  }

  // Stage 8: Low-Information / Insufficient Answer (for non-concise questions)
  if (!isConcise && wordCount < 6) {
    return {
      status: 'insufficient',
      isEvaluable: true,
      relevanceScore: 3,
      meaningfulnessScore: 2,
      completenessScore: 1,
      clarityScore: 4,
      structureScore: 1,
      detectedFlags: [...detectedFlags, 'low_information_fragment'],
      diagnosticExplanation: 'The answer is too brief to demonstrate the requested skill or experience.',
      sanitizedAnswer: trimmed,
      isPromptInjection,
      isConciseQuestion: isConcise,
    };
  }

  // Stage 9: Topical Relevance & Keyword Overlap
  const qKeywords = extractCoreKeywords(safeQuestion);
  const aKeywords = extractCoreKeywords(trimmed);
  const overlap = qKeywords.filter((k) => aKeywords.some((ak) => wordsMatch(k, ak)));

  // Check for cross-domain mismatch (e.g. behavioral/interpersonal question answered with programming syntax)
  const interpersonalTerms = ['interpersonal', 'conflict', 'team', 'coworker', 'disagreement', 'teammate', 'collaboration', 'stakeholder', 'leadership'];
  const technicalTerms = ['rust', 'python', 'code', 'tokio', 'async', 'sql', 'microservice', 'database', 'queries', 'algorithm', 'bytes', 'memory'];

  const isQuestionInterpersonal = interpersonalTerms.some((it) => qKeywords.some((qk) => wordsMatch(it, qk)));
  const isAnswerTechnicalOnly = technicalTerms.some((tt) => aKeywords.some((ak) => wordsMatch(tt, ak))) && !interpersonalTerms.some((it) => aKeywords.some((ak) => wordsMatch(it, ak)));

  if (isQuestionInterpersonal && isAnswerTechnicalOnly && overlap.length === 0) {
    return {
      status: 'irrelevant',
      isEvaluable: true,
      relevanceScore: 1,
      meaningfulnessScore: 4,
      completenessScore: 1,
      clarityScore: 6,
      structureScore: 2,
      detectedFlags: [...detectedFlags, 'cross_domain_mismatch'],
      diagnosticExplanation: 'Answer discusses technical programming details without addressing the required interpersonal or team leadership prompt.',
      sanitizedAnswer: trimmed,
      isPromptInjection: false,
      isConciseQuestion: isConcise,
    };
  }

  // Check semantic domain relevance when direct literal overlap is zero (e.g. STAR answer describing bottleneck without repeating question words)
  const isTechnicalQuestion = TECHNICAL_PROBLEM_TERMS.some((term) =>
    qKeywords.some((qk) => wordsMatch(term, qk))
  );
  const technicalAnswerMatches = TECHNICAL_ACTION_AND_OUTCOME_TERMS.filter((term) =>
    aKeywords.some((ak) => wordsMatch(term, ak))
  );
  const hasConcreteMetrics = /\b(\d+(\.\d+)?\s*(ms|s|seconds?|minutes?|%|x|times|k|req\/s)|p99|p95|black friday|\$\d+)\b/i.test(trimmed);
  const hasSTARAction = /\bI (profiled|identified|added|introduced|designed|implemented|built|optimized|reduced|debugged|led|spoke)\b/i.test(trimmed);

  const isRichTechnicalAnswer = isTechnicalQuestion && technicalAnswerMatches.length >= 3 && (hasConcreteMetrics || hasSTARAction);

  // If question had distinct keywords, but answer has zero overlap and is not a semantic domain match
  let relevanceScore = 6;
  let status: AnswerValidityStatus = 'valid';

  if (isConcise) {
    // For concise questions, short correct answers are valid!
    relevanceScore = 8;
  } else if (isRichTechnicalAnswer) {
    // Direct technical domain match with rich STAR evidence
    status = 'valid';
    relevanceScore = 9;
  } else if (qKeywords.length >= 3 && overlap.length === 0 && wordCount > 8) {
    // Zero keyword overlap on a detailed question and no domain match
    status = 'partially_relevant';
    relevanceScore = 2;
    detectedFlags.push('zero_keyword_overlap');
  } else if (overlap.length > 0) {
    relevanceScore = Math.min(9, 6 + overlap.length);
  }

  // Completeness score estimation
  let completenessScore = 6;
  if (isConcise) {
    completenessScore = wordCount >= 2 ? 8 : 4;
  } else if (isRichTechnicalAnswer && wordCount >= 25) {
    completenessScore = 9;
  } else if (wordCount < 15) {
    completenessScore = 3;
    status = 'partially_relevant';
  } else if (wordCount < 30) {
    completenessScore = 5;
  } else if (wordCount <= 180) {
    completenessScore = 8;
  } else {
    completenessScore = 6; // slightly rambling
  }

  // Clarity score based on length and structure
  const clarityScore = Math.min(10, Math.max(3, isConcise ? 8 : wordCount >= 10 ? 8 : 5));

  // Structure score based on connective words
  const hasConnectives = /\b(first|then|because|however|therefore|for example|specifically|in conclusion|finally)\b/i.test(
    trimmed
  );
  const structureScore = hasConnectives ? 8 : wordCount >= 20 ? 6 : 4;

  return {
    status,
    isEvaluable: true,
    relevanceScore,
    meaningfulnessScore: 7,
    completenessScore,
    clarityScore,
    structureScore,
    detectedFlags,
    diagnosticExplanation:
      status === 'valid'
        ? 'Answer directly addresses the question with relevant details.'
        : 'Answer is partially relevant or missing supporting details.',
    sanitizedAnswer: trimmed,
    isPromptInjection,
    isConciseQuestion: isConcise,
  };
}
