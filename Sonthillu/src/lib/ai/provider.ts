import { AIProvider } from './types';
import { GeminiProvider } from './providers/gemini';

export function getAIProvider(): AIProvider {
  const providerType = process.env.AI_PROVIDER || 'gemini';

  switch (providerType.toLowerCase()) {
    case 'gemini':
      return new GeminiProvider();
    default:
      // Fallback to Gemini or throw
      console.warn(`Unknown AI_PROVIDER: ${providerType}, falling back to Gemini.`);
      return new GeminiProvider();
  }
}
