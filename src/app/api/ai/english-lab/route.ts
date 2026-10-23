import { NextRequest, NextResponse } from 'next/server';
import {
  LabCategory,
  buildLabEvaluatorPrompt,
  buildRetryComparisonPrompt,
  parseLabTurnEvaluation,
  parseRetryComparison,
} from '@/lib/english-lab';
import { DEFAULT_OLLAMA_ENDPOINT, DEFAULT_MODEL_NAME, isTrustedEndpoint } from '@/lib/ai';

interface EvaluateAnswerRequest {
  action: 'evaluate';
  category: LabCategory;
  question: string;
  userAnswer: string;
  endpoint?: string;
  model?: string;
}

interface CompareRetryRequest {
  action: 'compare_retry';
  question: string;
  attempt1: string;
  attempt2: string;
  endpoint?: string;
  model?: string;
}

type EnglishLabRequestBody = EvaluateAnswerRequest | CompareRetryRequest;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EnglishLabRequestBody;

    if (!body || !body.action) {
      return NextResponse.json({ error: 'Missing "action" in request body.' }, { status: 400 });
    }

    const endpoint = (body.endpoint || DEFAULT_OLLAMA_ENDPOINT).replace(/\/+$/, '');
    const model = body.model || DEFAULT_MODEL_NAME;

    if (!isTrustedEndpoint(endpoint)) {
      return NextResponse.json(
        { error: 'Untrusted AI endpoint. Connectivity is restricted to localhost or private network.' },
        { status: 400 }
      );
    }

    // 1. Evaluate Lab Answer
    if (body.action === 'evaluate') {
      const { category, question, userAnswer } = body;

      if (!question || !userAnswer) {
        return NextResponse.json(
          { error: 'Missing "question" or "userAnswer".' },
          { status: 400 }
        );
      }

      const systemPrompt = buildLabEvaluatorPrompt(category || 'grammar');

      try {
        const response = await fetch(`${endpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: `Prompt/Question: "${question}"\n\nCandidate Spoken Answer: "${userAnswer}"\n\nProvide your structured evaluation JSON now.`,
              },
            ],
            stream: false,
            format: 'json',
            options: {
              temperature: 0.3, // Lower temperature for precision and adherence to grammar rules
              top_p: 0.85,
              num_predict: 450,
            },
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.message?.content || '{}';
          const evaluation = parseLabTurnEvaluation(rawText, question, userAnswer, category || 'grammar');
          return NextResponse.json({ evaluation }, { status: 200 });
        }
      } catch (ollamaErr) {
        console.warn('Ollama unavailable or timed out for English Lab, falling back to deterministic evaluation:', ollamaErr);
      }

      // Deterministic fallback if Ollama call fails or model is loading
      const fallbackEvaluation = parseLabTurnEvaluation('{}', question, userAnswer, category || 'grammar');
      return NextResponse.json({ evaluation: fallbackEvaluation }, { status: 200 });
    }

    // 2. Compare Retry Attempts
    if (body.action === 'compare_retry') {
      const { question, attempt1, attempt2 } = body;

      if (!attempt1 || !attempt2) {
        return NextResponse.json(
          { error: 'Both "attempt1" and "attempt2" are required for comparison.' },
          { status: 400 }
        );
      }

      const prompt = buildRetryComparisonPrompt(question, attempt1, attempt2);

      try {
        const response = await fetch(`${endpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: prompt },
              {
                role: 'user',
                content: 'Compare Attempt 1 and Attempt 2 and provide the structured comparison JSON.',
              },
            ],
            stream: false,
            format: 'json',
            options: {
              temperature: 0.3,
              num_predict: 350,
            },
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.message?.content || '{}';
          const comparison = parseRetryComparison(rawText, attempt1, attempt2);
          return NextResponse.json({ comparison }, { status: 200 });
        }
      } catch (ollamaErr) {
        console.warn('Ollama unavailable for Retry Comparison, fallback to deterministic comparison:', ollamaErr);
      }

      const fallbackComparison = parseRetryComparison('{}', attempt1, attempt2);
      return NextResponse.json({ comparison: fallbackComparison }, { status: 200 });
    }

    const rawAction = typeof body === 'object' && body && 'action' in body ? String((body as { action: unknown }).action) : 'unknown';
    return NextResponse.json({ error: `Unknown action: ${rawAction}` }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    console.error('English Lab API Error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
