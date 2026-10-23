'use client';

import React from 'react';
import { RoleplayScenario, ROLEPLAY_SCENARIOS } from '@/lib/roleplay';

interface RoleplayScenarioSelectorProps {
  selectedScenario: RoleplayScenario;
  onSelectScenario: (scenario: RoleplayScenario) => void;
  onStartScenario: () => void;
}

export function RoleplayScenarioSelector({
  selectedScenario,
  onSelectScenario,
  onStartScenario,
}: RoleplayScenarioSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-400 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
            Roleplay Studio
          </span>
          <span className="text-xs text-slate-400">10 Realistic Workplace & Social Scenarios</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          Select Your Interactive Roleplay Scenario
        </h1>
        <p className="text-xs text-slate-400 max-w-2xl">
          The AI remains strictly in character during the interaction. Practice handling tough meetings, casual coffee chats, diplomacy, and technical explanations, then receive an executive coaching report when you end the scenario.
        </p>
      </div>

      {/* 10 Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLEPLAY_SCENARIOS.map((scenario) => {
          const isSelected = selectedScenario.id === scenario.id;
          return (
            <div
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-violet-950/30 border-violet-500 ring-1 ring-violet-500 shadow-lg shadow-violet-950/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {scenario.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-medium truncate">
                    {scenario.setting}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 leading-snug">
                  {scenario.title}
                </h3>

                <div className="text-xs text-violet-300 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                  AI Persona: {scenario.aiPersona}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {scenario.objective}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">Your Role: {scenario.userRole}</span>
                <span className={`font-semibold ${isSelected ? 'text-violet-400' : 'text-slate-400'}`}>
                  {isSelected ? 'Selected ✓' : 'Select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Scenario Action Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-200">
            Ready to roleplay: &ldquo;{selectedScenario.title}&rdquo;
          </div>
          <div className="text-[11px] text-slate-400">
            Speaking with {selectedScenario.aiPersona} • Voice & text enabled
          </div>
        </div>

        <button
          type="button"
          onClick={onStartScenario}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
        >
          <span>Step into Scenario →</span>
        </button>
      </div>
    </div>
  );
}
