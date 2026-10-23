import {
  AIProvider,
  GenerateTurnRequest,
  GenerateTurnResponse,
  AIAvailabilityResult,
  AIMessage,
} from './types';
import { buildSystemPrompt } from './prompts';
import { TurnFeedback } from '@/types';

export const DEFAULT_OLLAMA_ENDPOINT = 'http://127.0.0.1:11434';
export const DEFAULT_MODEL_NAME = 'llama3.2:1b';

interface OllamaTagModel {
  name: string;
  model: string;
  size: number;
}

interface OllamaTagsResponse {
  models?: OllamaTagModel[];
}

interface OllamaChatResponse {
  model?: string;
  message?: {
    role: string;
    content: string;
  };
  total_duration?: number;
  error?: string;
}

export class OllamaProvider implements AIProvider {
  name = 'Ollama (Local AI)';
  private defaultEndpoint: string;
  private defaultModel: string;

  constructor(
    defaultEndpoint: string = DEFAULT_OLLAMA_ENDPOINT,
    defaultModel: string = DEFAULT_MODEL_NAME
  ) {
    this.defaultEndpoint = defaultEndpoint;
    this.defaultModel = defaultModel;
  }

  /**
   * Check if Ollama daemon is active and if the target model is installed
   */
  async checkAvailability(
    endpoint: string = this.defaultEndpoint,
    targetModel: string = this.defaultModel
  ): Promise<AIAvailabilityResult> {
    const cleanEndpoint = endpoint.replace(/\/+$/, '');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${cleanEndpoint}/api/tags`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          isAvailable: false,
          status: 'daemon_offline',
          endpoint: cleanEndpoint,
          installedModels: [],
          activeModel: targetModel,
          errorMessage: `Ollama service returned HTTP status ${res.status}`,
          troubleshooting: {
            title: 'Ollama Service Unreachable',
            explanation: `The Ollama daemon is not responding normally at ${cleanEndpoint}.`,
            command: 'ollama serve',
          },
        };
      }

      const data = (await res.json()) as OllamaTagsResponse;
      const installedModels = (data.models || []).map((m) => m.name);

      if (installedModels.length === 0) {
        return {
          isAvailable: false,
          status: 'model_missing',
          endpoint: cleanEndpoint,
          installedModels: [],
          activeModel: targetModel,
          errorMessage: 'No models are installed in your local Ollama library.',
          troubleshooting: {
            title: 'Install an instruction-following model',
            explanation: `Run "ollama pull ${targetModel}" to download a lightweight model suitable for voice dialogues.`,
            command: `ollama pull ${targetModel}`,
          },
        };
      }

      // Check if target model or any variant is present
      const exactMatch = installedModels.find(
        (m) => m === targetModel || m.startsWith(`${targetModel}:`) || targetModel.startsWith(`${m}:`)
      );

      if (!exactMatch) {
        // Fall back to first available model if preferred isn't found
        const fallbackModel = installedModels[0];
        return {
          isAvailable: true,
          status: 'ready',
          endpoint: cleanEndpoint,
          installedModels,
          activeModel: fallbackModel,
          troubleshooting: {
            title: 'Configured model not found; using fallback',
            explanation: `Preferred model "${targetModel}" was not found. Using installed model "${fallbackModel}". You can pull "${targetModel}" anytime.`,
            command: `ollama pull ${targetModel}`,
          },
        };
      }

      return {
        isAvailable: true,
        status: 'ready',
        endpoint: cleanEndpoint,
        installedModels,
        activeModel: exactMatch,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        isAvailable: false,
        status: 'daemon_offline',
        endpoint: cleanEndpoint,
        installedModels: [],
        activeModel: targetModel,
        errorMessage: errorMsg,
        troubleshooting: {
          title: 'Ollama is not running locally',
          explanation: `Cannot connect to Ollama at ${cleanEndpoint}. Make sure the Ollama desktop app or daemon is running.`,
          command: 'ollama serve',
        },
      };
    }
  }

  /**
   * List all locally installed model tags
   */
  async listModels(endpoint: string = this.defaultEndpoint): Promise<string[]> {
    const cleanEndpoint = endpoint.replace(/\/+$/, '');
    try {
      const res = await fetch(`${cleanEndpoint}/api/tags`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as OllamaTagsResponse;
      return (data.models || []).map((m) => m.name);
    } catch {
      return [];
    }
  }

  /**
   * Generate conversational turn and structured coaching feedback with retry and cancellation
   */
  async generateTurn(
    request: GenerateTurnRequest,
    callerSignal?: AbortSignal
  ): Promise<GenerateTurnResponse> {
    const endpoint = (request.endpoint || this.defaultEndpoint).replace(/\/+$/, '');
    const model = request.model || this.defaultModel;
    const timeoutMs = request.timeoutMs || 45000;

    // 1. Input Validation
    if (!request.messages || request.messages.length === 0) {
      throw new Error('GenerateTurnRequest requires a non-empty messages array.');
    }

    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage || !lastUserMessage.content.trim()) {
      throw new Error('GenerateTurnRequest requires at least one user message with content.');
    }

    // 2. Build Structured System Prompt
    const systemPrompt = buildSystemPrompt({
      mode: request.mode,
      difficulty: request.difficulty,
      coachStrictness: request.coachStrictness,
      scenarioContext: request.scenarioContext,
    });

    // 3. Assemble message history with conversational turn-taking
    const formattedMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...request.messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
    ];

    const startTime = Date.now();
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (callerSignal?.aborted) {
        throw new DOMException('Request was aborted by the user.', 'AbortError');
      }

      try {
        // Setup timeout controller coupled with caller signal
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => {
          timeoutController.abort(new Error(`Ollama request timed out after ${timeoutMs / 1000}s`));
        }, timeoutMs);

        const onAbort = () => {
          clearTimeout(timeoutId);
          timeoutController.abort(callerSignal?.reason);
        };

        if (callerSignal) {
          callerSignal.addEventListener('abort', onAbort, { once: true });
        }

        const requestBody = {
          model,
          messages: formattedMessages,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 400,
          },
        };

        let response: Response;
        try {
          response = await fetch(`${endpoint}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: timeoutController.signal,
          });
        } finally {
          clearTimeout(timeoutId);
          if (callerSignal) {
            callerSignal.removeEventListener('abort', onAbort);
          }
        }

        const responseData = (await response.json()) as OllamaChatResponse;

        // Check for Ollama daemon error payloads (e.g. Out Of Memory)
        if (!response.ok || responseData.error) {
          const errMsg = responseData.error || `HTTP ${response.status}: ${response.statusText}`;

          if (errMsg.toLowerCase().includes('out-of-memory') || errMsg.toLowerCase().includes('cuda_host')) {
            throw new Error(
              `Model "${model}" exceeds available system memory (Out of Memory). Please select a lightweight model like "llama3.2:1b" or "qwen2.5:1.5b" in Settings.`
            );
          }

          if (errMsg.toLowerCase().includes('not found')) {
            throw new Error(
              `Model "${model}" is not installed in Ollama. Please run "ollama pull ${model}" in your terminal.`
            );
          }

          throw new Error(`Ollama error: ${errMsg}`);
        }

        const content = responseData.message?.content?.trim() || '';
        const latencyMs = Date.now() - startTime;

        // 4. Output Validation & Parsing
        const parsed = this.parseModelOutput(content);

        return {
          spokenResponse: parsed.spokenResponse,
          coaching: parsed.coaching,
          rawContent: content,
          modelUsed: responseData.model || model,
          latencyMs,
        };
      } catch (err: unknown) {
        if (callerSignal?.aborted) {
          throw new DOMException('Request was aborted by user.', 'AbortError');
        }

        const isAbort =
          err instanceof DOMException && err.name === 'AbortError' ||
          (err instanceof Error && err.name === 'AbortError');

        if (isAbort) {
          throw err;
        }

        const errorMessage = err instanceof Error ? err.message : String(err);
        lastError = err instanceof Error ? err : new Error(errorMessage);

        // Don't retry non-transient errors (OOM, missing model, invalid input)
        if (
          errorMessage.includes('Out of Memory') ||
          errorMessage.includes('not installed') ||
          errorMessage.includes('requires')
        ) {
          throw lastError;
        }

        // If retries remain, back off briefly
        if (attempt < maxRetries) {
          const backoffDelay = (attempt + 1) * 800;
          await new Promise((r) => setTimeout(r, backoffDelay));
        }
      }
    }

    throw (
      lastError ||
      new Error(`Failed to generate turn from Ollama at ${endpoint} after ${maxRetries} retries.`)
    );
  }

  /**
   * Resilient JSON parsing that handles backticks, trailing text, or malformed outputs
   */
  private parseModelOutput(rawText: string): {
    spokenResponse: string;
    coaching: TurnFeedback;
  } {
    if (!rawText) {
      return {
        spokenResponse: "I'm listening. Could you please share a bit more detail on that?",
        coaching: {
          clarityScore: 75,
          pacingNote: 'Awaiting longer speech sample',
          fluencyTip: 'Speak in full, connected sentences to practice conversational rhythm.',
          grammar: [],
          vocabulary: [],
        },
      };
    }

    // Strip markdown code fences if present
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }

    // Locate the first '{' and last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(jsonSubstring);

        const spokenResponse =
          typeof parsed.spokenResponse === 'string' && parsed.spokenResponse.trim()
            ? parsed.spokenResponse.trim()
            : 'Could you tell me a little more about how you approached that?';

        const rawCoaching = parsed.coaching || {};

        const coaching: TurnFeedback = {
          clarityScore:
            typeof rawCoaching.clarityScore === 'number'
              ? Math.max(1, Math.min(100, Math.round(rawCoaching.clarityScore)))
              : 85,
          pacingNote:
            typeof rawCoaching.pacingNote === 'string'
              ? rawCoaching.pacingNote
              : 'Conversational cadence',
          fluencyTip:
            typeof rawCoaching.fluencyTip === 'string'
              ? rawCoaching.fluencyTip
              : 'Keep up a steady rhythm with natural breathing between thoughts.',
          grammar: Array.isArray(rawCoaching.grammar)
            ? (rawCoaching.grammar as Array<{ original?: unknown; corrected?: unknown; explanation?: unknown }>)
                .filter(
                  (g) =>
                    g &&
                    typeof g.original === 'string' &&
                    typeof g.corrected === 'string' &&
                    g.original.trim().length > 0 &&
                    g.original !== g.corrected &&
                    !g.original.toLowerCase().includes('part of user') &&
                    !g.original.toLowerCase().includes('mistake') &&
                    !g.corrected.toLowerCase().includes('corrected version')
                )
                .map((g) => ({
                  original: String(g.original).trim(),
                  corrected: String(g.corrected).trim(),
                  explanation: String(g.explanation || 'Refined grammatical accuracy'),
                }))
            : [],
          vocabulary: Array.isArray(rawCoaching.vocabulary)
            ? (rawCoaching.vocabulary as Array<{ original?: unknown; upgrade?: unknown; reason?: unknown }>)
                .filter(
                  (v) =>
                    v &&
                    typeof v.original === 'string' &&
                    typeof v.upgrade === 'string' &&
                    v.original.trim().length > 0 &&
                    v.original !== v.upgrade &&
                    !v.original.toLowerCase().includes('word or phrase') &&
                    !v.upgrade.toLowerCase().includes('alternative')
                )
                .map((v) => ({
                  original: String(v.original).trim(),
                  upgrade: String(v.upgrade).trim(),
                  reason: String(v.reason || 'Enhances professional articulation'),
                }))
            : [],
        };

        return { spokenResponse, coaching };
      } catch {
        // Fallback to text parsing
      }
    }

    // Fallback: If output wasn't valid JSON, use the raw text as the conversational response
    return {
      spokenResponse: cleaned,
      coaching: {
        clarityScore: 82,
        pacingNote: 'Live spoken dialogue',
        fluencyTip: 'Maintain steady pacing and articulate your key takeaways first.',
        grammar: [],
        vocabulary: [],
      },
    };
  }
}
