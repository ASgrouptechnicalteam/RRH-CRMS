import { describe, it, expect, vi } from 'vitest';
import { processSearchQuery } from './client';
import { getAIProvider } from './provider';
import { validateAIIntent } from './schema';

vi.mock('./provider', () => ({
  getAIProvider: vi.fn(),
}));

describe('AI Client Orchestration', () => {
  it('validates a valid AI intent JSON', () => {
    const validJson = {
      intent: 'PROPERTY_SEARCH',
      location: 'Gachibowli',
      bedrooms: 3,
      maxBudget: 15000000,
      clarificationRequired: false,
    };
    const parsed = validateAIIntent(validJson);
    expect(parsed.location).toBe('Gachibowli');
    expect(parsed.bedrooms).toBe(3);
    expect(parsed.maxBudget).toBe(15000000);
  });

  it('rejects unsupported fields in AI intent JSON', () => {
    const invalidJson = {
      intent: 'PROPERTY_SEARCH',
      rentPrice: 20000, // Not in schema
      clarificationRequired: false,
    };
    // Zod strips unrecognized keys by default or fails if strict.
    // Our schema strips them by default. Let's ensure rentPrice is not there.
    const parsed = validateAIIntent(invalidJson) as any;
    expect(parsed.rentPrice).toBeUndefined();
  });

  it('handles clarification requests from the provider', async () => {
    const mockProvider = {
      parseSearchIntent: vi.fn().mockResolvedValue({
        intent: 'PROPERTY_SEARCH',
        clarificationRequired: true,
        clarificationPrompt: 'What budget are you looking for?',
      }),
    };
    vi.mocked(getAIProvider).mockReturnValue(mockProvider as any);

    const result = await processSearchQuery('Find a house');
    expect(result.status).toBe('CLARIFICATION');
    expect(result.clarification).toBe('What budget are you looking for?');
  });

  it('handles unsupported intent', async () => {
    const mockProvider = {
      parseSearchIntent: vi.fn().mockResolvedValue({
        intent: 'UNSUPPORTED',
        clarificationRequired: true,
        clarificationPrompt: 'Rentals are not supported.',
      }),
    };
    vi.mocked(getAIProvider).mockReturnValue(mockProvider as any);

    const result = await processSearchQuery('Find a house for rent');
    expect(result.status).toBe('CLARIFICATION');
    expect(result.clarification).toBe('Rentals are not supported.');
  });

  it('normalizes valid intent into canonical SearchQuery', async () => {
    const mockProvider = {
      parseSearchIntent: vi.fn().mockResolvedValue({
        intent: 'PROPERTY_SEARCH',
        location: 'Miyapur',
        bedrooms: 2,
        maxBudget: 8000000,
        clarificationRequired: false,
      }),
    };
    vi.mocked(getAIProvider).mockReturnValue(mockProvider as any);

    const result = await processSearchQuery('2 BHK in Miyapur under 80L');
    expect(result.status).toBe('RESULTS');
    expect(result.query?.location).toBe('Miyapur');
    expect(result.query?.bedrooms).toBe(2);
    expect(result.query?.maxBudget).toBe(8000000);
  });

  it('falls back to FALLBACK status on provider timeout', async () => {
    const mockProvider = {
      parseSearchIntent: vi.fn().mockRejectedValue(new Error('AI_PROVIDER_TIMEOUT')),
    };
    vi.mocked(getAIProvider).mockReturnValue(mockProvider as any);

    const result = await processSearchQuery('3 BHK villa');
    expect(result.status).toBe('FALLBACK');
    expect(result.error).toBe('AI_PROVIDER_TIMEOUT');
  });
});
