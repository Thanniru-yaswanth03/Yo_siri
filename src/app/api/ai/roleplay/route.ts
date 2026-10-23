import { NextRequest, NextResponse } from 'next/server';
import {
  RoleplayScenario,
  RoleplayTurn,
  ROLEPLAY_SCENARIOS,
  buildRoleplayActorPrompt,
  buildRoleplayCoachingPrompt,
  parseRoleplayCoachingReport,
} from '@/lib/roleplay';
import { DEFAULT_OLLAMA_ENDPOINT, DEFAULT_MODEL_NAME } from '@/lib/ai';

interface RoleplayChatRequest {
  action: 'chat';
  scenario?: RoleplayScenario;
  scenarioId?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  endpoint?: string;
  model?: string;
}

interface RoleplayCoachingRequest {
  action: 'finalize_coaching';
  scenario?: RoleplayScenario;
  scenarioId?: string;
  turns: RoleplayTurn[];
  endpoint?: string;
  model?: string;
}

type RoleplayRequestBody = RoleplayChatRequest | RoleplayCoachingRequest;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RoleplayRequestBody;

    if (!body || !body.action) {
      return NextResponse.json({ error: 'Missing action in request body.' }, { status: 400 });
    }

    const endpoint = (body.endpoint || DEFAULT_OLLAMA_ENDPOINT).replace(/\/+$/, '');
    const model = body.model || DEFAULT_MODEL_NAME;

    const resolvedScenario: RoleplayScenario | undefined =
      body.scenario ||
      (body.scenarioId
        ? ROLEPLAY_SCENARIOS.find((s) => s.id === body.scenarioId || s.category === body.scenarioId)
        : undefined);

    // 1. In-character Roleplay dialogue turn
    if (body.action === 'chat') {
      const { messages } = body;
      const scenario = resolvedScenario;

      if (!scenario) {
        return NextResponse.json({ error: 'Missing scenario or valid scenarioId in request body.' }, { status: 400 });
      }

      const systemPrompt = buildRoleplayActorPrompt(scenario);

      const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      if (Array.isArray(messages) && messages.length > 0) {
        for (const msg of messages) {
          chatMessages.push({ role: msg.role, content: msg.content });
        }
      } else {
        chatMessages.push({
          role: 'user',
          content: 'Hello, let us begin the scenario.',
        });
      }

      try {
        const response = await fetch(`${endpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: chatMessages,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
              num_predict: 200,
            },
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (response.ok) {
          const data = await response.json();
          const spokenReply = data.message?.content?.trim() || scenario.openingLine;
          return NextResponse.json({ reply: spokenReply }, { status: 200 });
        }
      } catch (ollamaErr) {
        console.warn('Ollama unavailable for roleplay turn, using fallback persona line:', ollamaErr);
      }

      return NextResponse.json({
        reply: `That makes complete sense from your perspective. How do you suggest we proceed to balance both priorities?`,
      });
    }

    // 2. Finalize Coaching Report
    if (body.action === 'finalize_coaching') {
      const { turns } = body;
      const scenario = resolvedScenario;

      if (!scenario) {
        return NextResponse.json({ error: 'Missing scenario or valid scenarioId.' }, { status: 400 });
      }

      const prompt = buildRoleplayCoachingPrompt(scenario, turns || []);

      try {
        const response = await fetch(`${endpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: prompt },
              { role: 'user', content: 'Generate the roleplay coaching report JSON now.' },
            ],
            stream: false,
            format: 'json',
            options: {
              temperature: 0.3,
              num_predict: 450,
            },
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.message?.content || '{}';
          const report = parseRoleplayCoachingReport(rawText, scenario, turns || []);
          return NextResponse.json({ report }, { status: 200 });
        }
      } catch (ollamaErr) {
        console.warn('Ollama error during roleplay coaching report, using deterministic report:', ollamaErr);
      }

      const fallbackReport = parseRoleplayCoachingReport('{}', scenario, turns || []);
      return NextResponse.json({ report: fallbackReport }, { status: 200 });
    }

    const rawAction =
      typeof body === 'object' && body && 'action' in body
        ? String((body as { action: unknown }).action)
        : 'unknown';
    return NextResponse.json({ error: `Unknown action: ${rawAction}` }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    console.error('Roleplay API Error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
