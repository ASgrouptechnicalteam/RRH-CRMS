import { AIIntentResponse, AISearchContext } from './types';
import { getAIProvider } from './provider';
import { SearchQuery } from '@/types/search';

/**
 * Normalizes the AI output to canonical SearchQuery format.
 * (e.g., standardizing text, handling ranges, etc.)
 */
function normalizeIntentToSearchQuery(intent: AIIntentResponse): SearchQuery {
  const query: SearchQuery = {};

  if (intent.location) query.location = intent.location;
  if (intent.propertyType) query.propertyType = intent.propertyType;
  if (intent.listingType) query.listingType = intent.listingType;
  if (intent.bedrooms) query.bedrooms = intent.bedrooms;
  if (intent.minBudget) query.minBudget = intent.minBudget;
  if (intent.maxBudget) query.maxBudget = intent.maxBudget;
  if (intent.possessionStatus) query.possessionStatus = intent.possessionStatus;

  return query;
}

export async function processSearchQuery(
  input: string,
  context?: AISearchContext
): Promise<{
  status: 'RESULTS' | 'CLARIFICATION' | 'FALLBACK' | 'ERROR';
  query?: SearchQuery;
  clarification?: string;
  error?: string;
  rawIntent?: AIIntentResponse;
}> {
  try {
    const provider = getAIProvider();
    const intent = await provider.parseSearchIntent(input, context);

    if (intent.intent === 'UNSUPPORTED') {
      return {
        status: 'CLARIFICATION',
        clarification:
          intent.clarificationPrompt ||
          'I cannot help with that specific request. We currently support searching for properties to buy.',
        rawIntent: intent,
      };
    }

    if (intent.clarificationRequired) {
      return {
        status: 'CLARIFICATION',
        clarification: intent.clarificationPrompt || 'Could you provide a bit more detail?',
        rawIntent: intent,
      };
    }

    const searchQuery = normalizeIntentToSearchQuery(intent);

    return {
      status: 'RESULTS',
      query: searchQuery,
      rawIntent: intent,
    };
  } catch (error: any) {
    console.error('AI Search Error:', error.message);

    // Fallback to normal search or error state based on error type
    const errMessage = error.message;
    if (
      errMessage === 'AI_PROVIDER_UNCONFIGURED' ||
      errMessage === 'AI_PROVIDER_TIMEOUT' ||
      errMessage === 'AI_PROVIDER_RATE_LIMIT' ||
      errMessage.startsWith('AI_PROVIDER_ERROR')
    ) {
      return {
        status: 'FALLBACK',
        error: errMessage,
      };
    }

    return {
      status: 'ERROR',
      error: 'An unexpected error occurred during AI processing.',
    };
  }
}
