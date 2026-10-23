import { AIProvider } from './types';
import { OllamaProvider, DEFAULT_OLLAMA_ENDPOINT, DEFAULT_MODEL_NAME } from './ollama-provider';

export * from './types';
export * from './prompts';
export * from './ollama-provider';

// Singleton or factory instance
let currentProvider: AIProvider | null = null;

export function getAIProvider(
  endpoint: string = DEFAULT_OLLAMA_ENDPOINT,
  model: string = DEFAULT_MODEL_NAME
): AIProvider {
  if (!currentProvider) {
    currentProvider = new OllamaProvider(endpoint, model);
  }
  return currentProvider;
}

export function setAIProvider(provider: AIProvider): void {
  currentProvider = provider;
}
