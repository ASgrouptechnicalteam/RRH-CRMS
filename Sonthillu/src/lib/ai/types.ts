import { z } from 'zod';

export const AIIntentSchema = z.object({
  intent: z.enum(['PROPERTY_SEARCH', 'PROJECT_SEARCH', 'GENERAL_PROPERTY_QUESTION', 'UNSUPPORTED']),
  location: z.string().optional(),
  propertyType: z.enum(['APARTMENT', 'VILLA', 'INDEPENDENT_HOUSE']).optional(),
  listingType: z.enum(['NEW', 'RESALE', 'ANY']).optional(),
  bedrooms: z.number().optional(),
  minBudget: z.number().optional(),
  maxBudget: z.number().optional(),
  possessionStatus: z.enum(['READY_TO_MOVE', 'UNDER_CONSTRUCTION', 'ANY']).optional(),
  language: z.string().optional(),
  ambiguity: z.array(z.string()).optional(),
  clarificationRequired: z.boolean().default(false),
  clarificationPrompt: z.string().optional(),
});

export type AIIntentResponse = z.infer<typeof AIIntentSchema>;

export interface AISearchContext {
  previousIntent?: AIIntentResponse;
  lastResultCount?: number;
  language?: string;
}

export interface AIProvider {
  parseSearchIntent(input: string, context?: AISearchContext): Promise<AIIntentResponse>;
}
