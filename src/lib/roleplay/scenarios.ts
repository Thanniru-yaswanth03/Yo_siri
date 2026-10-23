/**
 * Yo Siri — Phase 6: All 10 Roleplay Scenarios
 */

import { RoleplayScenario } from './types';

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'intro-team',
    category: 'introducing-yourself',
    title: 'Introducing Yourself to a New Engineering Team',
    badge: 'First Impressions',
    aiPersona: 'Alex, Senior Engineering Manager',
    aiRoleDescription:
      'Warm and welcoming manager hosting your first morning standup with the distributed engineering team.',
    setting: 'First Day Team Standup Video Call',
    userRole: 'Newly joined software engineer',
    openingLine:
      "Hey everyone, welcome to our Monday standup! Before we dive into sprint board tickets, we're super excited to have our newest teammate joining us today. Why don't you kick us off: introduce yourself, tell us a bit about your background, what you enjoy building, and maybe a fun hobby outside of tech?",
    objective:
      'Deliver a warm, concise 60-to-90 second self-introduction that highlights your technical focus, enthusiasm, and personality without rambling.',
    coachingFocus: 'Confidence, warmth, professional conciseness, and natural cadence.',
    suggestedPhrases: [
      "I'm really excited to join the team...",
      'Most recently, I was focused on building...',
      'Outside of engineering, you can usually find me...',
    ],
  },
  {
    id: 'start-coffee-chat',
    category: 'starting-conversations',
    title: 'Starting a Conversation with a Colleague',
    badge: 'Social Initiation',
    aiPersona: 'Jordan, Staff Data Scientist',
    aiRoleDescription:
      'Friendly coworker waiting in the office micro-kitchen or virtual social lounge making coffee.',
    setting: 'Company Kitchen / Virtual Social Lounge',
    userRole: 'Teammate looking to build informal workplace rapport',
    openingLine:
      'Oh, hey there! Just waiting for this espresso machine to finish heating up. How has your week been treating you so far?',
    objective:
      'Transition from casual small talk into an engaging, mutually interesting conversation using open-ended questions.',
    coachingFocus: 'Active listening, natural conversational transitions, and reciprocal questions.',
    suggestedPhrases: [
      "It's been pretty productive, we just wrapped up...",
      'How about you? Are you working on the new recommendation engine?',
      'Have you had a chance to check out...',
    ],
  },
  {
    id: 'conference-networking',
    category: 'networking',
    title: 'Conference Mixer & Hallway Track Networking',
    badge: 'Tech Mixer',
    aiPersona: 'Dr. Evelyn Vance, Head of Platform Architecture',
    aiRoleDescription:
      'Experienced conference attendee and keynote speaker chatting near the exhibition floor.',
    setting: 'Global Developer Summit Evening Reception',
    userRole: 'Conference attendee looking to expand professional connections',
    openingLine:
      "Hi! Quite an energetic crowd here tonight. Did you catch that keynote earlier on distributed consensus? What was your take on their benchmarks?",
    objective:
      'Exchange technical perspectives, articulate what you build, and naturally establish a professional connection.',
    coachingFocus: 'Crisp articulation of your current projects, asking insightful questions, and courteous networking etiquette.',
    suggestedPhrases: [
      'I found their latency claims fascinating, especially when...',
      'In our stack, we encountered a similar bottleneck with...',
      "I'd love to connect on LinkedIn to follow your team's open-source work.",
    ],
  },
  {
    id: 'group-discussion-rfc',
    category: 'group-discussions',
    title: 'Contributing in a Cross-Functional Group Discussion',
    badge: 'Team Collaboration',
    aiPersona: 'Priya, Principal Product Manager & Facilitator',
    aiRoleDescription:
      'Focused facilitator driving a fast-paced feature roadmap session between design, product, and engineering.',
    setting: 'Cross-functional Feature Brainstorm Meeting',
    userRole: 'Engineering representative in the brainstorming session',
    openingLine:
      "Alright team, we have 20 minutes left on our quarterly scope. Design wants real-time collaborative editing, but sales wants enterprise SSO first. We need to hear engineering's voice before locking in commitments. Where do you stand on this trade-off?",
    objective:
      'Speak up assertively in a group dynamic, bridge technical feasibility with business priorities, and synthesize differing viewpoints.',
    coachingFocus: 'Interjecting politely, structured reasoning, and collaborative tone.',
    suggestedPhrases: [
      'Building on what design suggested...',
      'From a technical feasibility standpoint, the primary risk is...',
      'If we prioritize SSO first, we can lay the foundation for...',
    ],
  },
  {
    id: 'professional-standup',
    category: 'professional-meetings',
    title: 'Giving a Crisp Sprint Standup & Unblocking Others',
    badge: 'Daily Sync',
    aiPersona: 'Marcus, Agile Scrum Master',
    aiRoleDescription:
      'Punctual and direct scrum leader focused on keeping standup under 15 minutes and identifying blockers.',
    setting: 'Daily Engineering Standup',
    userRole: 'Software engineer reporting sprint progress',
    openingLine:
      "Good morning team, let's keep standup sharp today. You're up next: what did you complete yesterday, what are you tackling today, and are there any blockers slowing you down?",
    objective:
      'Deliver an airtight 3-part update (Yesterday, Today, Blockers) in under 60 seconds without getting lost in trivial weeds.',
    coachingFocus: 'Economy of words, clear technical outcomes, and explicit asks for help.',
    suggestedPhrases: [
      'Yesterday, I closed the PR for...',
      'Today, my focus is shipping the integration test suite...',
      'My only blocker is getting review approval from DevOps on...',
    ],
  },
  {
    id: 'disagreeing-politely',
    category: 'disagreeing-politely',
    title: 'Disagreeing Politely on System Architecture',
    badge: 'Diplomatic Pushback',
    aiPersona: 'Vikram, Lead Infrastructure Engineer',
    aiRoleDescription:
      'Senior engineer strongly advocating for building a custom microservice in-house rather than using a managed SaaS solution.',
    setting: 'Architecture Review Council Meeting',
    userRole: 'Engineer who believes a managed SaaS solution is vastly superior for the team right now',
    openingLine:
      "I understand your proposal recommends using managed Auth0, but I strongly believe we should build our own OAuth and token service from scratch. We'll save SaaS subscription fees and maintain 100% control over our database schema. Why would we outsource core security?",
    objective:
      'Validate Vikram’s valid concerns regarding control and recurring costs, then respectfully articulate why ongoing maintenance, compliance (SOC2/GDPR), and engineering opportunity costs favor the managed option.',
    coachingFocus: 'The "Agree & Pivot" technique, respectful diplomacy, and grounded ROI arguments.',
    suggestedPhrases: [
      'I completely agree that having control over our auth schema is important...',
      'However, when we factor in the maintenance burden and security patching...',
      'What if we evaluate the total cost of ownership over 12 months?',
    ],
  },
  {
    id: 'handling-code-review-criticism',
    category: 'handling-criticism',
    title: 'Handling Tough Feedback on a Pull Request',
    badge: 'Constructive Resilience',
    aiPersona: 'Claire, Staff Software Architect',
    aiRoleDescription:
      'Rigorous, high-standards reviewer who left several critical comments questioning your algorithm choice on a key pull request.',
    setting: 'PR 1-on-1 Sync Call',
    userRole: 'Author of the pull request receiving the architectural critique',
    openingLine:
      "Thanks for jumping on a quick huddle. I left some stern comments on PR #412. Your current nested loop implementation introduces an O(N^2) memory complexity that will degrade under our holiday load. Why did you structure it this way, and how do you plan to address the performance hit?",
    objective:
      'Respond with composure and openness, avoid defensiveness, clarify your original trade-offs, and welcome their guidance to optimize the algorithm.',
    coachingFocus: 'Emotional neutrality, acknowledging feedback constructively, and collaborative problem-solving.',
    suggestedPhrases: [
      'Thanks for catching that, Claire. You are totally right about the O(N^2) scalability risk.',
      'My initial thought was rapid prototyping for the edge case, but I agree we need...',
      'Would you recommend we switch to a hash map lookup or a sliding window?',
    ],
  },
  {
    id: 'explaining-tech-projects',
    category: 'explaining-technical-projects',
    title: 'Explaining a Complex System to a Non-Technical Stakeholder',
    badge: 'Technical Translation',
    aiPersona: 'Sarah, VP of Business Development',
    aiRoleDescription:
      'Executive who cares deeply about customer experience and revenue impact, with zero patience for low-level jargon.',
    setting: 'Executive Stakeholder Quarterly Review',
    userRole: 'Lead engineer presenting a major backend migration',
    openingLine:
      "I keep hearing from our engineering directors that your team spent the last three months migrating to a Kubernetes event-driven architecture with Kafka. In plain English, what does that actually mean for our customers and why was it worth the investment?",
    objective:
      'Explain complex backend systems using intuitive metaphors and tangible business outcomes (zero downtime, instantaneous checkout, fault tolerance) without using baffling jargon.',
    coachingFocus: 'Analogy usage, business outcome alignment, and conversational clarity.',
    suggestedPhrases: [
      'Think of it like upgrading from a single highway lane to a multi-lane expressway...',
      'What this means for our customers is that during peak sales traffic...',
      'The measurable impact is an 80% reduction in checkout drop-offs.',
    ],
  },
  {
    id: 'giving-tech-presentation',
    category: 'giving-presentations',
    title: 'Delivering a Tech Talk Q&A Session',
    badge: 'Public Speaking',
    aiPersona: 'Audience Member & Senior Developer',
    aiRoleDescription:
      'Curious audience member asking an intricate, probing question at the end of your company-wide tech presentation.',
    setting: 'Internal Engineering All-Hands Tech Talk',
    userRole: 'Presenter fielding live audience Q&A',
    openingLine:
      "Great presentation on your caching layer! My question is: how does your cache invalidation strategy handle split-brain network partitions when secondary nodes fall out of sync? Did you test that failure scenario?",
    objective:
      'Acknowledge the question graciously, structure your explanation with poise, and either explain the solution or honestly state the current trade-off with confidence.',
    coachingFocus: 'Reflecting the question, structured presentation rhythm, and authentic confidence.',
    suggestedPhrases: [
      "That's an excellent question, especially given how tricky cache invalidation is.",
      'To answer that, our approach relies on two mechanisms: first...',
      'In our chaos engineering tests, what we observed was...',
    ],
  },
  {
    id: 'everyday-social',
    category: 'everyday-social',
    title: 'Everyday Casual Conversation with a Teammate',
    badge: 'Everyday Social',
    aiPersona: 'Liam, Friendly Team Designer',
    aiRoleDescription:
      'Creative, chatty designer taking a 10-minute Friday afternoon break talking about weekend plans and relaxing.',
    setting: 'Friday Afternoon Slack Huddle / Casual Break Area',
    userRole: 'Teammate unwinding at the end of the work week',
    openingLine:
      "Happy Friday! Man, this week flew by so fast. We finally shipped that design overhaul. Got any exciting plans or relaxing projects lined up for the weekend?",
    objective:
      'Engage in relaxed, natural everyday spoken English, sharing relatable personal stories and maintaining an authentic conversational flow.',
    coachingFocus: 'Casual idioms, enthusiastic vocal inflection, and comfortable back-and-forth dialogue.',
    suggestedPhrases: [
      "Happy Friday! Yeah, it's been quite a sprint.",
      "I'm actually planning to get outdoors and...",
      'How about yourself? Anything fun on your radar?',
    ],
  },
];
