'use client';

import React, { useState } from 'react';
import { ConversationRoom } from '@/components/conversation/ConversationRoom';

interface Scenario {
  id: string;
  title: string;
  aiPersona: string;
  setting: string;
  firstLine: string;
  objective: string;
}

const roleplayScenarios: Scenario[] = [
  {
    id: 'salary-negotiation',
    title: 'Salary & Compensation Review',
    aiPersona: 'Director of Engineering',
    setting: 'Annual Performance Review Room',
    firstLine:
      'Thanks for coming in today. We have reviewed your work over the past year and we are very impressed. We would like to offer you a 5% merit raise. How does that sound to you?',
    objective:
      'Advocate for a higher adjustment by citing concrete business impact, market data, and expanded responsibilities without being combative.',
  },
  {
    id: 'executive-pitch',
    title: 'Tech Debt vs New Features',
    aiPersona: 'Chief Product Officer (CPO)',
    setting: 'Quarterly Roadmap Strategy Session',
    firstLine:
      'I see in your proposal that you want two full sprints dedicated to refactoring the authentication and caching layer. But sales is demanding the new enterprise analytics dashboard next month. Why should we slow down product velocity for internal code cleanup?',
    objective:
      'Translate technical debt into tangible business risks (uptime, developer velocity, security) in language an executive respects.',
  },
  {
    id: 'outage-client-call',
    title: 'Post-Mortem Crisis Call',
    aiPersona: 'Key Enterprise Client',
    setting: 'Urgent Video Conference Call',
    firstLine:
      'Your platform was down for 45 minutes during our peak sales window today, and our checkout failed for hundreds of customers. We are furious. What happened, and why should we trust your system moving forward?',
    objective:
      'De-escalate the client with empathy, own the issue without defensiveness, and clearly outline the immediate remediation steps.',
  },
  {
    id: 'design-disagreement',
    title: 'Polite Architectural Disagreement',
    aiPersona: 'Principal Staff Engineer',
    setting: 'Architecture RFC Review Meeting',
    firstLine:
      'I have reviewed your draft RFC proposing GraphQL. Personally, I think REST with OpenAPI is battle-tested, simpler to cache, and has less operational overhead. Why complicate our stack with GraphQL right now?',
    objective:
      'Validate their concerns first, then articulate specific edge cases or client-side efficiency gains where GraphQL provides measurable ROI.',
  },
];

export default function RoleplayPage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(roleplayScenarios[0]);

  return (
    <div className="space-y-6">
      {/* Scenario Picker Bar */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Roleplay Scenarios
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Simulate high-stakes communication situations with interactive personas.
            </p>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40">
            Opposing Persona: {selectedScenario.aiPersona}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {roleplayScenarios.map((scen) => (
            <button
              key={scen.id}
              type="button"
              onClick={() => setSelectedScenario(scen)}
              className={`text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                selectedScenario.id === scen.id
                  ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                  : 'bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="font-bold truncate">{scen.title}</div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">{scen.setting}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation Room for Roleplay */}
      <ConversationRoom
        key={selectedScenario.id}
        mode="roleplay"
        modeTitle={`Roleplay: ${selectedScenario.title}`}
        modeBadge={selectedScenario.aiPersona}
        initialQuestion={selectedScenario.firstLine}
        scenarioDetails={{
          topic: selectedScenario.setting,
          objective: selectedScenario.objective,
          difficulty: 'High Stakes',
        }}
      />
    </div>
  );
}
