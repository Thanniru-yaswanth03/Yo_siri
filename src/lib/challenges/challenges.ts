/**
 * Yo Siri — Phase 6: Daily Speaking Challenges Registry & Plans
 */

import { DailyChallengeDefinition, DailyPlanConfig, DailyPlanTier } from './types';
import { PersonalWeaknessTracker } from '@/lib/english-lab';

export const DAILY_PLANS: Record<DailyPlanTier, DailyPlanConfig> = {
  '10-min': {
    tier: '10-min',
    title: '10-Minute Express Sprint',
    durationMinutes: 10,
    description: 'Quick daily warm-up: 1-minute topic sprint and concise answer delivery.',
    challengeIds: ['one-minute-topic', 'concise-answer'],
  },
  '15-min': {
    tier: '15-min',
    title: '15-Minute Daily Core Workout',
    durationMinutes: 15,
    description: 'Balanced fluency routine: HR behavioral drill, technical concept explanation, and mistake revision.',
    challengeIds: ['hr-question-of-day', 'explain-a-concept', 'recurring-mistakes-revision'],
  },
  '30-min': {
    tier: '30-min',
    title: '30-Minute Mastery Immersion',
    durationMinutes: 30,
    description: 'Comprehensive vocal workout across all core dimensions: intros, behavior, tech, vocab, and structure.',
    challengeIds: [
      'self-introduction',
      'hr-question-of-day',
      'explain-a-concept',
      'concise-answer',
      'vocabulary-practice',
      'recurring-mistakes-revision',
      'one-minute-topic',
    ],
  },
};

/**
 * Get daily challenges list, dynamically adapting the recurring-mistakes challenge
 * to the user's active personal weakness profile!
 */
export function getDailyChallenges(): DailyChallengeDefinition[] {
  const activeWeaknesses = typeof window !== 'undefined'
    ? PersonalWeaknessTracker.getActiveWeaknesses()
    : [];

  const topWeakness = activeWeaknesses[0];

  let mistakeRevisionPrompt =
    'Revision Drill: Practice past storytelling. Describe an engineering hurdle from last week without slipping between past and present tenses.';
  let mistakeRevisionTitle = 'Revision: Verb Tense Consistency';
  let mistakeRevisionObjective =
    'Maintain strict past tense throughout your response without dropping into present modals.';

  if (topWeakness) {
    mistakeRevisionTitle = `Revision: ${topWeakness.title}`;
    mistakeRevisionObjective = `Focus on overcoming your top tracked weakness: ${topWeakness.description}`;
    mistakeRevisionPrompt = `Your learning profile shows recurring patterns of "${topWeakness.title}". Practice answering this prompt with extra focus on this area:\n\n"Describe a major project win or technical milestone you achieved, and explain what specific approach led to success."`;
  }

  return [
    {
      id: 'one-minute-topic',
      type: 'one-minute-topic',
      title: 'One-Minute Topic Speaking',
      badge: 'Timed Sprint',
      durationSeconds: 60,
      objective: 'Speak with high energy and smooth cadence for exactly 60 seconds without long pauses.',
      promptQuestion:
        'Topic: "Why is remote work either beneficial or detrimental to early-career engineers?" Take a stand and articulate your viewpoint in 60 seconds.',
      focusHint: 'Aim for 100-130 spoken words with a clear opening point, supporting reasoning, and conclusion.',
      targetCriteria: [
        'Complete response delivered in under 60 seconds',
        'Clear stance stated in the opening 10 seconds',
        'Smooth transitions between thoughts',
      ],
    },
    {
      id: 'self-introduction',
      type: 'self-introduction',
      title: 'Elevator Self-Introduction',
      badge: 'First Impressions',
      durationSeconds: 90,
      objective: 'Deliver a structured 90-second self-introduction highlighting your background, passions, and current focus.',
      promptQuestion:
        'Imagine you are introducing yourself to the VP of Engineering at your dream company. Give your 90-second pitch: who you are, what you build, and what drives you.',
      focusHint: 'Follow the formula: Present focus → Past foundation → Future passion.',
      targetCriteria: [
        'Articulates current engineering role clearly',
        'Mentions at least one impactful technical outcome',
        'Warm, engaging vocal inflection',
      ],
    },
    {
      id: 'hr-question-of-day',
      type: 'hr-question-of-day',
      title: 'HR Question of the Day',
      badge: 'Behavioral Fit',
      durationSeconds: 90,
      objective: 'Answer a core behavioral question using the STAR framework (Situation, Task, Action, Result).',
      promptQuestion:
        'HR Question: "Tell me about a time you had to work with a difficult coworker or manage a conflicting opinion. How did you resolve the situation?"',
      focusHint: 'Avoid speaking negatively about others; focus on empathy, direct communication, and shared outcomes.',
      targetCriteria: [
        'Clear problem context without personal attacks',
        'Specific actions you took to resolve the friction',
        'Positive, collaborative outcome',
      ],
    },
    {
      id: 'explain-a-concept',
      type: 'explain-a-concept',
      title: 'Explain-a-Concept Challenge',
      badge: 'Clarity & Tech',
      durationSeconds: 75,
      objective: 'Explain a complex concept using intuitive metaphors and zero confusing acronyms.',
      promptQuestion:
        'Concept Challenge: Explain what "Event-Driven Architecture" means to someone who has never written backend code. Use an intuitive real-world analogy.',
      focusHint: 'Think of postal mail, restaurant orders, or push notifications rather than queue brokers.',
      targetCriteria: [
        'Employs a memorable real-world analogy',
        'Explains why it is useful compared to synchronous calls',
        'Stays within 75 seconds',
      ],
    },
    {
      id: 'concise-answer',
      type: 'concise-answer',
      title: 'Concise-Answer Challenge',
      badge: 'Word Economy',
      durationSeconds: 45,
      objective: 'Deliver your complete thought in exactly 2 to 3 punchy sentences under 45 words.',
      promptQuestion:
        'Concise Challenge: What is the single biggest benefit of automated integration tests? You have a maximum of 3 sentences.',
      focusHint: 'Cut every filler word ("basically", "you know", "actually") and deliver pure substance.',
      targetCriteria: [
        'Maximum 3 sentences',
        'Zero verbal filler words',
        'Definitive and authoritative takeaway',
      ],
    },
    {
      id: 'vocabulary-practice',
      type: 'vocabulary-practice',
      title: 'Professional Vocabulary Practice',
      badge: 'Lexicon Boost',
      durationSeconds: 60,
      objective: 'Naturally weave at least two target professional verbs into your spoken response.',
      promptQuestion:
        'Target Vocabulary: "streamlined", "mitigated", "orchestrated". Prompt: Describe a project where your team modernized an outdated workflow or resolved a high-risk bottleneck.',
      focusHint: 'Incorporate at least two of the target words naturally without forcing them awkwardly.',
      targetCriteria: [
        'Includes at least two of the target vocabulary words',
        'Used in proper grammatical context',
        'Confident articulation',
      ],
    },
    {
      id: 'recurring-mistakes-revision',
      type: 'recurring-mistakes-revision',
      title: mistakeRevisionTitle,
      badge: 'Targeted Polish',
      durationSeconds: 60,
      objective: mistakeRevisionObjective,
      promptQuestion: mistakeRevisionPrompt,
      focusHint: 'Directly addresses your personal tracked weakness from previous practice sessions.',
      targetCriteria: [
        'Maintains grammatical precision on the target rule',
        'Shows measurable improvement compared to prior sessions',
        'Self-corrects with minimal hesitation',
      ],
    },
  ];
}
