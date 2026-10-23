import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, GenerateTurnRequest, isTrustedEndpoint } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Strict Input Validation
    const validModes = ['conversation', 'interview', 'english-lab', 'roleplay'];
    if (!body || !validModes.includes(body.mode)) {
      return NextResponse.json(
        {
          error: `Invalid practice mode. Must be one of: ${validModes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        {
          error: 'Missing or empty "messages" conversation history array.',
        },
        { status: 400 }
      );
    }

    const lastMessage = body.messages[body.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.content?.trim()) {
      return NextResponse.json(
        {
          error: 'The last message in "messages" must be from "user" with non-empty content.',
        },
        { status: 400 }
      );
    }

    const payload: GenerateTurnRequest = {
      mode: body.mode,
      messages: body.messages.map((m: { role?: string; content?: string }) => ({
        role: m.role === 'assistant' || m.role === 'system' ? m.role : 'user',
        content: String(m.content || ''),
      })),
      difficulty: body.difficulty || 'Intermediate',
      coachStrictness: body.coachStrictness || 'balanced',
      scenarioContext: body.scenarioContext,
      model: body.model,
      endpoint: body.endpoint,
      timeoutMs: typeof body.timeoutMs === 'number' ? body.timeoutMs : 45000,
    };

    if (payload.endpoint && !isTrustedEndpoint(payload.endpoint)) {
      return NextResponse.json(
        { error: 'Untrusted AI endpoint. Model connectivity is restricted to localhost or private network.' },
        { status: 400 }
      );
    }

    const provider = getAIProvider(payload.endpoint, payload.model);
    const result = await provider.generateTurn(payload, request.signal);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (request.signal.aborted) {
      return NextResponse.json(
        { error: 'Generation was cancelled by the user.' },
        { status: 499 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Identify specific failure types
    if (errorMessage.includes('exceeds available system memory') || errorMessage.includes('Out of Memory')) {
      return NextResponse.json(
        {
          error: errorMessage,
          code: 'OUT_OF_MEMORY',
          troubleshooting: {
            title: 'Model Exceeds RAM',
            explanation:
              'The selected model requires more memory than your system has available. Switch to a compact model like llama3.2:1b or qwen2.5:1.5b.',
            command: 'ollama run llama3.2:1b',
          },
        },
        { status: 422 }
      );
    }

    if (
      errorMessage.includes('not running') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('fetch failed')
    ) {
      return NextResponse.json(
        {
          error: 'Ollama daemon is not reachable on localhost:11434.',
          code: 'DAEMON_OFFLINE',
          troubleshooting: {
            title: 'Start Ollama',
            explanation: 'Make sure Ollama is running. Launch the Ollama app or run "ollama serve" in PowerShell.',
            command: 'ollama serve',
          },
        },
        { status: 503 }
      );
    }

    if (errorMessage.includes('timed out')) {
      return NextResponse.json(
        {
          error: errorMessage,
          code: 'TIMEOUT',
          troubleshooting: {
            title: 'Generation Timed Out',
            explanation:
              'The local model took too long to generate tokens. Try a smaller model or reduce background CPU/GPU loads.',
            command: 'ollama list',
          },
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: 'GENERATION_ERROR',
      },
      { status: 500 }
    );
  }
}
