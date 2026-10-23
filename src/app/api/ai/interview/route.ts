import { NextRequest, NextResponse } from 'next/server';
import {
  InterviewConfig,
  buildInterviewInterviewerPrompt,
  buildTurnEvaluationPrompt,
  parseModelEvaluation,
  computeOverallReport,
  TurnEvaluation,
} from '@/lib/interview';
import { DEFAULT_OLLAMA_ENDPOINT, DEFAULT_MODEL_NAME, isTrustedEndpoint } from '@/lib/ai';

interface NextQuestionRequest {
  action: 'next_question';
  config: InterviewConfig;
  currentQuestionNumber: number;
  totalQuestions: number;
  history: Array<{ question: string; answer: string }>;
  endpoint?: string;
  model?: string;
}

interface EvaluateAnswerRequest {
  action: 'evaluate_answer';
  config: InterviewConfig;
  turnIndex: number;
  question: string;
  userAnswer: string;
  endpoint?: string;
  model?: string;
}

interface FinalizeReportRequest {
  action: 'finalize_report';
  config: InterviewConfig;
  turns: TurnEvaluation[];
  startedAt: string;
}

type InterviewRequestBody = NextQuestionRequest | EvaluateAnswerRequest | FinalizeReportRequest;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InterviewRequestBody;

    if (!body || !body.action) {
      return NextResponse.json({ error: 'Missing "action" in request body.' }, { status: 400 });
    }

    // 1. Finalize Report (Deterministic computation)
    if (body.action === 'finalize_report') {
      const report = computeOverallReport(body.config, body.turns || [], body.startedAt || new Date().toISOString());
      return NextResponse.json({ report }, { status: 200 });
    }

    const endpoint = (body.endpoint || DEFAULT_OLLAMA_ENDPOINT).replace(/\/+$/, '');
    const model = body.model || DEFAULT_MODEL_NAME;

    if (!isTrustedEndpoint(endpoint)) {
      return NextResponse.json(
        { error: 'Untrusted AI endpoint. Connectivity is restricted to localhost or private network.' },
        { status: 400 }
      );
    }

    // 2. Next Question Generation
    if (body.action === 'next_question') {
      const { config, currentQuestionNumber, totalQuestions, history } = body;

      if (!config) {
        return NextResponse.json({ error: 'Missing "config" object.' }, { status: 400 });
      }

      const systemPrompt = buildInterviewInterviewerPrompt(config, currentQuestionNumber, totalQuestions);

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      // Add conversation history
      if (Array.isArray(history) && history.length > 0) {
        for (const item of history) {
          messages.push({ role: 'assistant', content: item.question });
          if (item.answer) {
            messages.push({ role: 'user', content: item.answer });
          }
        }
      } else {
        // Initial kickoff
        messages.push({
          role: 'user',
          content: `Please begin the interview by asking the opening question for the ${config.category} interview as a ${config.interviewerPersona} interviewer.`,
        });
      }

      const response = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 250,
          },
        }),
        signal: request.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama returned HTTP ${response.status}`);
      }

      const resData = await response.json();
      const rawContent = resData.message?.content?.trim() || '';

      let spokenQuestion = '';
      try {
        const parsed = JSON.parse(rawContent);
        spokenQuestion = parsed.spokenQuestion || parsed.question || '';
      } catch {
        spokenQuestion = rawContent.replace(/^[{"\s]+|[}"\s]+$/g, '');
      }

      if (!spokenQuestion.trim()) {
        spokenQuestion = 'Could you elaborate on how you approach solving complex, open-ended problems in your work?';
      }

      return NextResponse.json({ spokenQuestion }, { status: 200 });
    }

    // 3. Evaluate Single Answer
    if (body.action === 'evaluate_answer') {
      const { config, turnIndex, question, userAnswer } = body;

      if (!question || !userAnswer) {
        return NextResponse.json({ error: 'Missing question or userAnswer' }, { status: 400 });
      }

      const evalPrompt = buildTurnEvaluationPrompt(config, question, userAnswer);

      const response = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: evalPrompt },
            {
              role: 'user',
              content: `Evaluate this answer now strictly according to the required schema:\nQuestion: "${question}"\nCandidate Answer: "${userAnswer}"`,
            },
          ],
          stream: false,
          format: 'json',
          options: {
            temperature: 0.3,
            num_predict: 600,
          },
        }),
        signal: request.signal,
      });

      let rawContent = '';
      if (response.ok) {
        const resData = await response.json();
        rawContent = resData.message?.content?.trim() || '';
      }

      const evaluation = parseModelEvaluation(rawContent, config, turnIndex, question, userAnswer);

      return NextResponse.json({ evaluation }, { status: 200 });
    }

    return NextResponse.json({ error: `Unknown action: ${(body as { action?: string }).action}` }, { status: 400 });
  } catch (error: unknown) {
    if (request.signal.aborted) {
      return NextResponse.json({ error: 'Interview action cancelled by user' }, { status: 499 });
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
