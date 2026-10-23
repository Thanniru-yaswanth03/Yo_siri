import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, DEFAULT_OLLAMA_ENDPOINT, DEFAULT_MODEL_NAME, isTrustedEndpoint } from '@/lib/ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || DEFAULT_OLLAMA_ENDPOINT;
    const model = searchParams.get('model') || DEFAULT_MODEL_NAME;

    if (!isTrustedEndpoint(endpoint)) {
      return NextResponse.json(
        {
          isAvailable: false,
          status: 'error',
          endpoint,
          installedModels: [],
          activeModel: model,
          errorMessage: 'Untrusted AI endpoint. Connectivity is restricted to localhost or private network.',
        },
        { status: 400 }
      );
    }

    const provider = getAIProvider(endpoint, model);
    const availability = await provider.checkAvailability(endpoint, model);

    return NextResponse.json(availability, {
      status: availability.isAvailable ? 200 : 503,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to probe local AI health';
    return NextResponse.json(
      {
        isAvailable: false,
        status: 'error',
        endpoint: DEFAULT_OLLAMA_ENDPOINT,
        installedModels: [],
        activeModel: DEFAULT_MODEL_NAME,
        errorMessage: message,
        troubleshooting: {
          title: 'Unexpected Health Check Failure',
          explanation: message,
          command: 'ollama list',
        },
      },
      { status: 500 }
    );
  }
}
