/**
 * Yo Siri — Phase 4: AI Interview Room Types & Presets
 */

export type InterviewCategory =
  | 'hr'
  | 'behavioral'
  | 'technical'
  | 'placement'
  | 'project-defense'
  | 'group-discussion';

export type InterviewDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type InterviewerPersona = 'friendly' | 'neutral' | 'strict' | 'challenging';

export type InteractionMode = 'voice' | 'text';

export type FeedbackMode = 'immediate' | 'end-of-session' | 'combined';

export interface InterviewCategoryPreset {
  id: InterviewCategory;
  name: string;
  tagline: string;
  description: string;
  defaultRole: string;
  suggestedRoles: string[];
  firstQuestion: string;
  evaluationFocus: string[];
}

export interface InterviewConfig {
  category: InterviewCategory;
  targetRole: string;
  difficulty: InterviewDifficulty;
  interviewerPersona: InterviewerPersona;
  questionCount: number; // 3, 5, or 8
  interactionMode: InteractionMode;
  feedbackMode: FeedbackMode;
}

export interface StarAnalysis {
  situation: string;
  task: string;
  action: string;
  result: string;
  adherenceLevel: 'strong' | 'partial' | 'missing';
}

export interface TurnEvaluation {
  turnIndex: number;
  question: string;
  originalAnswer: string;
  relevanceScore: number; // 1-10
  completenessScore: number; // 1-10
  clarityScore: number; // 1-10
  logicalStructureScore: number; // 1-10
  grammarScore: number; // 1-10
  vocabularyScore: number; // 1-10
  concisenessScore: number; // 1-10
  technicalCorrectnessScore?: number; // 1-10 (for technical & project defense)
  starAnalysis?: StarAnalysis;
  keyWeaknesses: string[];
  explanation: string;
  improvedAnswer: string;
  suggestedFollowUpExercise: string;
}

export interface InterviewTurn {
  id: string;
  questionNumber: number;
  question: string;
  answer?: string;
  timestamp: string;
  evaluation?: TurnEvaluation;
}

export interface OverallCoachingScores {
  overallScore: number; // 1-100 transparent composite
  relevance: number; // 1-10
  completeness: number; // 1-10
  clarity: number; // 1-10
  logicalStructure: number; // 1-10
  grammar: number; // 1-10
  vocabulary: number; // 1-10
  conciseness: number; // 1-10
  technicalCorrectness?: number; // 1-10
  starAdherence?: 'strong' | 'partial' | 'missing';
}

export interface InterviewSessionReport {
  id: string;
  config: InterviewConfig;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
  totalQuestions: number;
  scores: OverallCoachingScores;
  keyStrengths: string[];
  topImprovementAreas: string[];
  turns: TurnEvaluation[];
}

export const INTERVIEW_CATEGORIES: Record<InterviewCategory, InterviewCategoryPreset> = {
  hr: {
    id: 'hr',
    name: 'HR & Cultural Interview',
    tagline: 'Company fit, career motivations, teamwork & workplace culture',
    description:
      'Practice answering foundational Human Resources questions about career goals, strengths, handling workplace dynamics, and company alignment.',
    defaultRole: 'Associate Software Engineer',
    suggestedRoles: [
      'Associate Software Engineer',
      'Product Manager',
      'Marketing Specialist',
      'Financial Analyst',
    ],
    firstQuestion:
      'Thank you for joining today. To start off, could you introduce yourself, highlight your core background, and explain what specifically attracted you to apply for this position?',
    evaluationFocus: ['Professional motivation', 'Communication confidence', 'Cultural alignment', 'Clear self-presentation'],
  },
  behavioral: {
    id: 'behavioral',
    name: 'Behavioral & STAR Method',
    tagline: 'Competency-based questions using Situation, Task, Action, Result',
    description:
      'Master the STAR framework for high-stakes leadership, conflict resolution, dealing with failure, and working under strict deadlines.',
    defaultRole: 'Software Engineer',
    suggestedRoles: [
      'Software Engineer',
      'Engineering Lead',
      'Scrum Master',
      'Consultant',
    ],
    firstQuestion:
      'Can you tell me about a time when you had to manage a major project with competing priorities and a tight deadline? How did you prioritize, and what was the outcome?',
    evaluationFocus: ['STAR method adherence', 'Measurable results', 'Action-oriented ownership', 'Conflict resolution'],
  },
  technical: {
    id: 'technical',
    name: 'Technical & System Design',
    tagline: 'Conceptual rigor, architectural trade-offs & problem-solving',
    description:
      'Practice explaining complex computer science concepts, system designs, concurrency, database architectures, and debugging methodologies aloud.',
    defaultRole: 'Full Stack Engineer',
    suggestedRoles: [
      'Full Stack Engineer',
      'Backend Engineer',
      'Frontend Architect',
      'Data Engineer',
    ],
    firstQuestion:
      'Could you explain how you would design a scalable, low-latency rate limiting service for an API gateway? Specifically, what algorithm and storage mechanism would you choose and why?',
    evaluationFocus: ['Conceptual accuracy', 'Trade-off analysis', 'System scalability', 'Concise technical explanations'],
  },
  placement: {
    id: 'placement',
    name: 'Campus Placement & Graduate Hiring',
    tagline: 'Aptitude, core CS fundamentals & situational reasoning',
    description:
      'Targeted for campus recruitment drives, graduate engineering tests, and first-job screens covering core fundamentals, DSA concepts, and situational questions.',
    defaultRole: 'Graduate Trainee / Fresher',
    suggestedRoles: [
      'Graduate Trainee / Fresher',
      'Junior Developer',
      'QA / Automation Engineer',
      'Cloud Support Associate',
    ],
    firstQuestion:
      'Welcome to the campus technical assessment. Can you explain the fundamental differences between SQL and NoSQL databases, and when you would select one over the other for a new project?',
    evaluationFocus: ['Core subject mastery', 'Structured delivery', 'Avoiding guesswork', 'Logical reasoning'],
  },
  'project-defense': {
    id: 'project-defense',
    name: 'Project Defense & Capstone Review',
    tagline: 'Architectural rationale, design decisions & handling examiner critique',
    description:
      'Prepare to defend your final year capstone, open-source project, or production portfolio against rigorous questions on design decisions, limitations, and alternatives.',
    defaultRole: 'Capstone Project Lead',
    suggestedRoles: [
      'Capstone Project Lead',
      'Research Scholar',
      'Portfolio Showcase',
      'Startup Founder',
    ],
    firstQuestion:
      'Please present a concise 2-minute architectural overview of your primary project: what core problem did it solve, what was your technology stack, and what was the single hardest engineering trade-off you had to make?',
    evaluationFocus: ['Technical depth', 'Defending design trade-offs', 'Self-awareness of limitations', 'Poise under interrogation'],
  },
  'group-discussion': {
    id: 'group-discussion',
    name: 'Group Discussion & Debate Practice',
    tagline: 'Initiating discussion, taking stances, polite counter-arguments & consensus building',
    description:
      'Practice group discussion rounds (GDs) used in recruitment and MBA screens. Learn to introduce topics, present logical stances, tactfully agree/disagree, and summarize viewpoints.',
    defaultRole: 'GD Candidate',
    suggestedRoles: [
      'GD Candidate',
      'Management Trainee',
      'Policy Analyst',
      'Product Strategist',
    ],
    firstQuestion:
      'Today\'s group discussion topic is: "Will Generative AI empower knowledge workers, or will it lead to widespread junior displacement?" Please open the discussion with your initial perspective and 2 supporting arguments.',
    evaluationFocus: ['Structured opening', 'Balanced arguments', 'Tactful agreement/disagreement', 'Conciseness & active listening'],
  },
};
