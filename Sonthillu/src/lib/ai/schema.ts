import { z } from 'zod';

// We reuse the schema from types.ts, but re-export it here for centralization
// if needed, or just export validation helpers.

import { AIIntentSchema, AIIntentResponse } from './types';

export function validateAIIntent(data: unknown): AIIntentResponse {
  try {
    return AIIntentSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('AI Intent Validation Error:', error.errors);
    }
    throw new Error('INVALID_AI_OUTPUT');
  }
}
