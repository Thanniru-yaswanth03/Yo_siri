/**
 * Yo Siri — Phase 5: Personal Weakness Tracker & Persistent Storage
 * Tracks recurring error patterns with verbatim transcript evidence and session references.
 */

import {
  WeaknessCategory,
  WeaknessPattern,
  WeaknessEvidence,
  AdaptiveDrill,
} from './types';

const STORAGE_KEY = 'yo-siri-weakness-profile';

const CATEGORY_METADATA: Record<
  WeaknessCategory,
  { title: string; description: string; defaultConstraint?: string }
> = {
  'tense-errors': {
    title: 'Verb Tense Consistency',
    description: 'Mixing past simple, present perfect, and conditional forms inconsistently.',
    defaultConstraint: 'Speak using consistent past tense throughout.',
  },
  'articles-prepositions': {
    title: 'Articles & Prepositions',
    description: 'Omitting "a/the" or using incorrect prepositions (e.g., "interested on").',
    defaultConstraint: 'Pay close attention to prepositions (in, on, at, for).',
  },
  'subject-verb-agreement': {
    title: 'Subject-Verb Agreement',
    description: 'Mismatched singular/plural subjects and verbs (e.g., "he work", "they was").',
    defaultConstraint: 'Ensure every verb strictly agrees with its subject.',
  },
  'repetitive-vocabulary': {
    title: 'Repetitive Vocabulary',
    description: 'Over-relying on generic descriptors like "good", "nice", or "make faster".',
    defaultConstraint: 'Incorporate at least 2 distinct professional verbs or adjectives.',
  },
  'filler-words': {
    title: 'Filler-Word Frequency',
    description: 'Verbal crutches like "um", "uh", "like", "basically", or "you know".',
    defaultConstraint: 'Insert 1-second silent pauses instead of verbal fillers.',
  },
  'rambling-answers': {
    title: 'Rambling & Length Overrun',
    description: 'Answers exceeding 180 words or straying from the primary question.',
    defaultConstraint: 'Deliver your complete response in under 3 concise sentences.',
  },
  'weak-structure': {
    title: 'Weak Answer Structure',
    description: 'Lacking a clear opening, middle points, and closing takeaway.',
    defaultConstraint: 'Follow: 1. Core takeaway, 2. Supporting point, 3. Summary.',
  },
  'missing-examples': {
    title: 'Missing Concrete Examples',
    description: 'Making abstract claims without verifiable metrics or specific examples.',
    defaultConstraint: 'Include at least one specific metric, tool, or tangible example.',
  },
  'unclear-explanations': {
    title: 'Unclear Explanations',
    description: 'Run-on sentences or confusing logical sequencing.',
    defaultConstraint: 'Break your explanation into distinct, numbered steps.',
  },
};

export class PersonalWeaknessTracker {
  /**
   * Load stored patterns from LocalStorage (SSR safe)
   */
  public static getStoredPatterns(): WeaknessPattern[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Save patterns to LocalStorage
   */
  public static savePatterns(patterns: WeaknessPattern[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
    } catch {
      // ignore
    }
  }

  /**
   * Record a new weakness observation with actual transcript evidence
   */
  public static recordObservation(
    category: WeaknessCategory,
    evidenceItem: {
      verbatimExcerpt: string;
      sourceType: 'transcript' | 'ai-suggestion';
      sessionRef: string;
      contextSentence?: string;
    }
  ): WeaknessPattern[] {
    const existingPatterns = this.getStoredPatterns();
    const now = new Date().toISOString();

    const patternIndex = existingPatterns.findIndex((p) => p.category === category);

    const newEvidence: WeaknessEvidence = {
      verbatimExcerpt: evidenceItem.verbatimExcerpt,
      sourceType: evidenceItem.sourceType,
      sessionRef: evidenceItem.sessionRef,
      timestamp: now,
      contextSentence: evidenceItem.contextSentence,
    };

    if (patternIndex !== -1) {
      const p = existingPatterns[patternIndex];
      // If previously dismissed, recording fresh evidence can optionally re-activate or keep note
      p.frequency += 1;
      p.lastObserved = now;
      p.evidence = [newEvidence, ...p.evidence.slice(0, 9)]; // keep latest 10 evidence items
      existingPatterns[patternIndex] = p;
    } else {
      const meta = CATEGORY_METADATA[category];
      const newPattern: WeaknessPattern = {
        id: `weakness-${category}-${Date.now()}`,
        category,
        title: meta.title,
        description: meta.description,
        frequency: 1,
        firstObserved: now,
        lastObserved: now,
        evidence: [newEvidence],
        isDismissed: false,
      };
      existingPatterns.push(newPattern);
    }

    this.savePatterns(existingPatterns);
    return existingPatterns;
  }

  /**
   * Dismiss an incorrect pattern classification
   */
  public static dismissPattern(id: string): WeaknessPattern[] {
    const patterns = this.getStoredPatterns().map((p) => {
      if (p.id === id) {
        return {
          ...p,
          isDismissed: true,
          dismissedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    this.savePatterns(patterns);
    return patterns;
  }

  /**
   * Restore a previously dismissed pattern
   */
  public static restorePattern(id: string): WeaknessPattern[] {
    const patterns = this.getStoredPatterns().map((p) => {
      if (p.id === id) {
        return {
          ...p,
          isDismissed: false,
          dismissedAt: undefined,
        };
      }
      return p;
    });
    this.savePatterns(patterns);
    return patterns;
  }

  /**
   * Mark a weakness as resolved following a successful retry
   */
  public static markResolved(category: WeaknessCategory): WeaknessPattern[] {
    const patterns = this.getStoredPatterns().map((p) => {
      if (p.category === category && !p.isDismissed) {
        return {
          ...p,
          resolvedAt: new Date().toISOString(),
          frequency: Math.max(0, p.frequency - 1),
        };
      }
      return p;
    });
    this.savePatterns(patterns);
    return patterns;
  }

  /**
   * Get all active, non-dismissed weakness patterns sorted by frequency
   */
  public static getActiveWeaknesses(): WeaknessPattern[] {
    return this.getStoredPatterns()
      .filter((p) => !p.isDismissed && p.frequency > 0)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Generate adaptive targeted exercises based on the user's top recurring weaknesses
   */
  public static generateAdaptiveDrills(limit = 4): AdaptiveDrill[] {
    const active = this.getActiveWeaknesses();

    if (active.length === 0) {
      // Fallback foundational drills if no active weaknesses recorded yet
      return [
        {
          id: 'drill-default-structure',
          weaknessCategory: 'weak-structure',
          title: 'Structured Explanation: Problem → Approach → Result',
          instruction: 'Practice structuring a complex answer clearly without wandering.',
          promptQuestion:
            'Describe a challenging bug or technical hurdle you resolved recently using: 1. The Problem, 2. Your Approach, 3. The Measurable Result.',
          targetObjective: 'Deliver all 3 structured components clearly in under 90 seconds.',
          recommendedConstraint: '3 structured sentences: Problem, Approach, Result.',
          timerSeconds: 60,
        },
        {
          id: 'drill-default-tense',
          weaknessCategory: 'tense-errors',
          title: 'Tense Consistency Practice: Past Storytelling',
          instruction: 'Maintain strict past simple and past perfect consistency.',
          promptQuestion:
            'Tell me about the very first programming project you built. What was your goal, what technologies did you choose, and what surprised you about the outcome?',
          targetObjective: 'Speak for 60 seconds maintaining consistent past tense throughout.',
          recommendedConstraint: 'Consistent past tenses (avoid slipping into present).',
          timerSeconds: 60,
        },
      ];
    }

    const drills: AdaptiveDrill[] = [];

    for (const p of active.slice(0, limit)) {
      switch (p.category) {
        case 'tense-errors':
          drills.push({
            id: `adaptive-${p.id}`,
            weaknessCategory: p.category,
            title: `Targeted Drill: ${p.title}`,
            instruction:
              'Your learning profile identified recurring tense shifts. Practice maintaining clean tense consistency.',
            promptQuestion:
              'Describe an incident where a production deploy went wrong. Focus strictly on past actions: "We deployed...", "The monitoring alert fired...", "I investigated..."',
            targetObjective: 'Maintain past tense consistency without switching to present mid-sentence.',
            recommendedConstraint: 'Strict past tense consistency.',
            timerSeconds: 60,
          });
          break;

        case 'rambling-answers':
        case 'filler-words':
          drills.push({
            id: `adaptive-${p.id}`,
            weaknessCategory: p.category,
            title: `Timed Conciseness Drill: ${p.title}`,
            instruction:
              'Your transcript shows recurring word overruns or filler words. Train purposeful silence and economy of words.',
            promptQuestion:
              'Explain what an API Gateway does to a junior intern in exactly two to three crisp sentences. No filler words.',
            targetObjective: 'Answer in under 45 words with zero fillers.',
            recommendedConstraint: 'Strict 45-word / 3-sentence limit.',
            timerSeconds: 45,
          });
          break;

        case 'weak-structure':
          drills.push({
            id: `adaptive-${p.id}`,
            weaknessCategory: p.category,
            title: `Structural Arc Drill: ${p.title}`,
            instruction:
              'Practice explaining projects using the 4-part framework: Problem, Approach, Result, Lessons Learned.',
            promptQuestion:
              'Walk me through your most impactful project: 1. What was the core problem? 2. What was your specific approach? 3. What was the measurable result? 4. What was your main lesson?',
            targetObjective: 'Hit all 4 structural pillars clearly.',
            recommendedConstraint: '4-part chronological structure.',
            timerSeconds: 90,
          });
          break;

        case 'missing-examples':
          drills.push({
            id: `adaptive-${p.id}`,
            weaknessCategory: p.category,
            title: `Concrete Evidence Drill: ${p.title}`,
            instruction:
              'Your answers tend to make high-level assertions. Back up every statement with a specific metric or tangible detail.',
            promptQuestion:
              'Why is code review essential in engineering teams? Give one concrete example from your own experience where a code review prevented a critical failure.',
            targetObjective: 'Support your thesis with a verifiable real-world scenario.',
            recommendedConstraint: 'Include a specific concrete example.',
            timerSeconds: 60,
          });
          break;

        case 'articles-prepositions':
          drills.push({
            id: `adaptive-${p.id}`,
            weaknessCategory: p.category,
            title: `Prepositions & Articles Drill: ${p.title}`,
            instruction:
              'Focus on correct preposition collocation: "responsible for", "participated in", "interested in".',
            promptQuestion:
              'What technical areas are you most interested in exploring this year, and what role are you responsible for in your current team?',
            targetObjective: 'Speak for 45 seconds using accurate prepositions.',
            recommendedConstraint: 'Accurate prepositions (in, on, for, with).',
            timerSeconds: 45,
          });
          break;

        default:
          drills.push({
            id: `adaptive-${p.id}`,
            weaknessCategory: p.category,
            title: `Adaptive Mastery: ${p.title}`,
            instruction: `Focus on overcoming your identified pattern: ${p.description}`,
            promptQuestion:
              'Explain a technical concept you recently learned. Focus on clarity, precision, and structured delivery.',
            targetObjective: 'Deliver a clear, well-articulated explanation.',
            timerSeconds: 60,
          });
          break;
      }
    }

    return drills;
  }
}
