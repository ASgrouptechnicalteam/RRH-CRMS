/**
 * Phase 17-D — AI Chat & Conversational Clarification tests.
 *
 * Proves:
 *  - Chat stays strictly confined to requirement gathering (asks follow-ups).
 *  - The endpoint resolves to a COMPLETE SearchIntent once the final missing
 *    piece is supplied, then triggers the 17-C CRM bridge (results array).
 *  - Malformed conversation histories (schema + structural) are rejected.
 *  - The AI refuses to recommend properties even when the user asks, and
 *    recommendation-style provider output is rejected by the strict schema.
 *  - Auth (401/403), tenant isolation, and the existing aiSearchLimiter.
 *
 * No live provider calls; all tests use FixedProvider / CaptureProvider.
 */

import express from 'express';
import request from 'supertest';
import { Permissions } from '@rrh-ems/shared';
import type { Router } from 'express';
import type { TokenPayload } from '../../apps/api/src/utils/jwt';
import { AIProvider, AIProviderError } from '../../apps/api/src/services/ai/provider';
import { AIRequest, AIResponse } from '../../apps/api/src/services/ai/types';
import { SearchIntent } from '../../apps/api/src/services/ai/searchIntent';
import {
  SearchIntentService,
  parseChatContent,
  validateChatHistory,
  InvalidChatInputError,
} from '../../apps/api/src/services/ai/application';
import { AIConfig } from '../../apps/api/src/services/ai/config';
import {
  buildChatApiResponse,
  DEFAULT_CHAT_SYSTEM_INSTRUCTIONS,
} from '../../apps/api/src/services/ai/chatApi';
import { aiSearchLimiter } from '../../apps/api/src/middleware/rateLimiter';

// JWT secrets are not present in .env.test, so the route + JWT modules (which throw on
// import when secrets are missing) are loaded lazily AFTER the secrets are set, matching
// how this repo's environment actually initialises auth for route tests.
let createAISearchRouter: (service?: SearchIntentService) => Router;
let generateAccessTokenFn: (payload: TokenPayload) => string;

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-secret-access';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-secret-refresh';
  const routeMod = await import('../../apps/api/src/routes/aiSearch');
  const jwtMod = await import('../../apps/api/src/utils/jwt');
  createAISearchRouter = routeMod.createAISearchRouter;
  generateAccessTokenFn = jwtMod.generateAccessToken as typeof generateAccessTokenFn;
});

const baseCaps = { supportsStreaming: false, maxOutputTokens: 1024, supportsUsage: true } as const;

const CLARIFICATION_JSON = JSON.stringify({
  status: 'INCOMPLETE',
  question: 'What is your budget range?',
  missingRequirements: ['budget'],
});

const COMPLETED_JSON = JSON.stringify({
  status: 'COMPLETE',
  searchIntent: {
    propertyType: 'APARTMENT',
    brandType: 'SONTHILLU',
    location: { city: 'Hyderabad' },
    budget: { max: 6000000 },
    bhk: { min: 2 },
  },
});

// A COMPLETE extraction carrying recommendation/ranking signals that the STRICT
// SearchCriteriaSchema must never accept (422-wide, never forwarded to CRM).
const RECOMMENDATION_JSON = JSON.stringify({
  status: 'COMPLETE',
  searchIntent: {
    propertyType: 'APARTMENT',
    matchPercentage: 95,
    recommendedProperties: ['Luxury Villa A', 'Ocean Breeze Flat'],
  },
});

const incompleteState = {
  status: 'INCOMPLETE',
  missingRequirements: ['budget'],
  ambiguities: [{ field: 'location.city', candidates: ['Hyderabad', 'Secunderabad'] }],
  nextAction: 'AI_CHAT',
};

const validHistory = [
  { role: 'user', content: 'I want a 2BHK apartment in or near Hyderabad' },
  { role: 'assistant', content: 'Could you confirm your budget range?' },
  { role: 'user', content: 'Under 60 lakhs, please.' },
];

const validPayload = { history: validHistory, incompleteState };

class FixedProvider implements AIProvider {
  capabilities = { provider: 'mock', ...baseCaps };
  constructor(private readonly content: string) {}
  async generate(request: AIRequest): Promise<AIResponse> {
    return { content: this.content, model: 'mock', usage: null, metadata: request.metadata };
  }
}

class CaptureProvider implements AIProvider {
  capabilities = { provider: 'capture', ...baseCaps };
  requests: AIRequest[] = [];
  async generate(request: AIRequest): Promise<AIResponse> {
    this.requests.push(request);
    return { content: CLARIFICATION_JSON, model: 'capture', usage: null, metadata: request.metadata };
  }
}

class FailProvider implements AIProvider {
  capabilities = { provider: 'mock', ...baseCaps };
  constructor(private readonly err: AIProviderError) {}
  async generate(_request: AIRequest): Promise<AIResponse> {
    throw this.err;
  }
}

function serviceFor(provider: AIProvider): SearchIntentService {
  const config = AIConfig.from({ provider: 'mock', enabled: false, timeoutMs: 30000, maxTokens: 1024, maxRetries: 1 });
  return new SearchIntentService({ provider, config });
}

function buildApp(router: Router): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/ai', router);
  return app;
}

function token(payload: Partial<TokenPayload> = {}): string {
  return generateAccessTokenFn({
    employeeId: 7,
    employeeCode: 'RRH-TEST-007',
    companyId: 101,
    branchId: null,
    roles: ['Admin (Technical)'],
    permissions: [Permissions.AI_SEARCH],
    ...payload,
  });
}
// ---------------------------------------------------------------------------
// buildChatApiResponse contract
// ---------------------------------------------------------------------------
describe('Phase 17-D: buildChatApiResponse (HTTP envelope)', () => {
  it('maps a CLARIFICATION result to the INCOMPLETE/AI_CHAT envelope', () => {
    const response = buildChatApiResponse({
      status: 'INCOMPLETE',
      question: 'What is your budget range?',
      missingRequirements: ['budget'],
    });
    expect(response.status).toBe('INCOMPLETE');
    expect(response.nextAction).toBe('AI_CHAT');
    expect(response.question).toBe('What is your budget range?');
    expect(response.missingRequirements).toEqual(['budget']);
    expect(response.searchIntent).toBeUndefined();
  });

  it('maps a COMPLETE result to the COMPLETE/CRM_SEARCH envelope', () => {
    const intent: SearchIntent = { propertyType: 'APARTMENT', budget: { max: 6000000 } };
    const response = buildChatApiResponse({ status: 'COMPLETE', searchIntent: intent });
    expect(response.status).toBe('COMPLETE');
    expect(response.nextAction).toBe('CRM_SEARCH');
    expect(response.searchIntent).toEqual(intent);
    expect(response.question).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// parseChatContent (deterministic structured-output verification)
// ---------------------------------------------------------------------------
describe('Phase 17-D: parseChatContent (structured verification)', () => {
  it('parses a CLARIFICATION JSON into an INCOMPLETE result', () => {
    const result = parseChatContent(CLARIFICATION_JSON);
    expect(result.status).toBe('INCOMPLETE');
    expect(result.question).toBe('What is your budget range?');
    expect(result.missingRequirements).toEqual(['budget']);
  });

  it('parses a COMPLETE JSON into a COMPLETE SearchIntent', () => {
    const result = parseChatContent(
      JSON.stringify({ status: 'COMPLETE', searchIntent: { propertyType: 'APARTMENT' } })
    );
    expect(result.status).toBe('COMPLETE');
    expect(result.searchIntent).toEqual({ propertyType: 'APARTMENT' });
  });

  it('rejects non-JSON provider output', () => {
    expect(() => parseChatContent('I recommend the Luxury Villa, you should buy it!')).toThrow(
      /invalid structured output|not valid JSON/
    );
  });

  it('rejects recommendation output (matchPercentage / recommendedProperties) inside searchIntent', () => {
    // SearchCriteriaSchema is .strict() — recommendation/ranking fields never pass.
    expect(() => parseChatContent(RECOMMENDATION_JSON)).toThrow(/did not match/);
  });

  it('rejects an unknown status in the discriminated union', () => {
    expect(() => parseChatContent(JSON.stringify({ status: 'PROPERTY_LIST', properties: [] }))).toThrow(
      /did not match/
    );
  });

  it('rejects a COMPLETE schema that omits the required searchIntent field', () => {
    expect(() => parseChatContent(JSON.stringify({ status: 'COMPLETE' }))).toThrow(/did not match/);
  });
});
// ---------------------------------------------------------------------------
// validateChatHistory — structural well-formedness
// ---------------------------------------------------------------------------
describe('Phase 17-D: validateChatHistory', () => {
  it('accepts a well-formed alternating history', () => {
    expect(() =>
      validateChatHistory([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi, what budget do you have?' },
        { role: 'user', content: '50 lakhs' },
      ])
    ).not.toThrow();
  });

  it('rejects an empty history', () => {
    expect(() => validateChatHistory([])).toThrow(InvalidChatInputError);
  });

  it('rejects a history that begins with an assistant message', () => {
    expect(() =>
      validateChatHistory([
        { role: 'assistant', content: 'What budget?' },
        { role: 'user', content: '50' },
      ])
    ).toThrow(/must begin with a user message/);
  });

  it('rejects a history that ends with an assistant message', () => {
    expect(() =>
      validateChatHistory([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ])
    ).toThrow(/must end with a user message/);
  });

  it('rejects consecutive same-role messages (non-alternating)', () => {
    expect(() =>
      validateChatHistory([
        { role: 'user', content: 'Hello' },
        { role: 'user', content: 'Still here' },
        { role: 'assistant', content: 'Hi' },
        { role: 'user', content: 'Alright' },
      ])
    ).toThrow(/must alternate roles/);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_CHAT_SYSTEM_INSTRUCTIONS confinement
// ---------------------------------------------------------------------------
describe('Phase 17-D: system instructions confine the AI to requirement gathering', () => {
  it('forbids property recommendations', () => {
    const lower = DEFAULT_CHAT_SYSTEM_INSTRUCTIONS.toLowerCase();
    expect(lower).toMatch(/never/);
    expect(lower).toMatch(/recommend/);
    expect(lower).toMatch(/specific properties/);
  });

  it('forbids match percentages and inventory/booking discussion', () => {
    const lower = DEFAULT_CHAT_SYSTEM_INSTRUCTIONS.toLowerCase();
    expect(lower).toMatch(/match percentages/);
    expect(lower).toMatch(/booking/);
  });
});
// ---------------------------------------------------------------------------
// Chat route — integration
// ---------------------------------------------------------------------------
describe('Phase 17-D: AI Chat API route', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(CLARIFICATION_JSON))));
    const res = await request(app).post('/api/v1/ai/chat').send(validPayload);
    expect(res.status).toBe(401);
  });

  it('rejects a request without the AI_SEARCH permission with 403', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(CLARIFICATION_JSON))));
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${token({ permissions: ['leads.read'] })}`)
      .send(validPayload);
    expect(res.status).toBe(403);
  });

  it('asks a follow-up question (CLARIFICATION) when requirements are still missing', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(CLARIFICATION_JSON))));
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${token()}`)
      .send(validPayload);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('INCOMPLETE');
    expect(res.body.nextAction).toBe('AI_CHAT');
    expect(res.body.question).toBe('What is your budget range?');
    expect(res.body.missingRequirements).toEqual(['budget']);
    expect(res.body.searchIntent).toBeUndefined();
    expect(res.body.results).toBeUndefined();
  });

  it('service resolves to a follow-up clarification when requirements remain (no DB dependency)', async () => {
    const svc = serviceFor(new FixedProvider(CLARIFICATION_JSON));
    const result = await svc.chat(validPayload, { companyId: 101, employeeId: 7 });
    expect(result.status).toBe('INCOMPLETE');
    if (result.status === 'INCOMPLETE') {
      expect(result.question).toBe('What is your budget range?');
      expect(result.missingRequirements).toEqual(['budget']);
    }
  });

  it('service resolves to a COMPLETE validated SearchIntent when the final missing piece is provided', async () => {
    const svc = serviceFor(new FixedProvider(COMPLETED_JSON));
    const result = await svc.chat(validPayload, { companyId: 101, employeeId: 7 });
    expect(result.status).toBe('COMPLETE');
    if (result.status === 'COMPLETE') {
      expect(result.searchIntent.propertyType).toBe('APARTMENT');
      expect(result.searchIntent.brandType).toBe('SONTHILLU');
      expect(result.searchIntent.location?.city).toBe('Hyderabad');
      expect(result.searchIntent.budget?.max).toBe(6000000);
      // The completed SearchCriteria conforms strictly to SearchIntentSchema —
      // no recommendation/ranking fields are present.
      expect(JSON.stringify(result.searchIntent)).not.toContain('matchPercentage');
      expect(JSON.stringify(result.searchIntent)).not.toContain('recommendedProperties');
    }
  });

  it('forwards the complete conversation (user + assistant turns) to the provider', async () => {
    const provider = new CaptureProvider();
    const app = buildApp(createAISearchRouter(serviceFor(provider)));
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${token()}`)
      .send(validPayload);
    expect(res.status).toBe(200);
    expect(provider.requests).toHaveLength(1);
    const roles = provider.requests[0].messages.map((m) => m.role);
    // Two system context messages + the full user/assistant/user history.
    expect(roles).toEqual(['system', 'system', 'user', 'assistant', 'user']);
    const contents = provider.requests[0].messages.map((m) => m.content).join('|');
    expect(contents).toContain('missing');
    expect(contents).toContain('I want a 2BHK apartment in or near Hyderabad');
    expect(contents).toContain('Under 60 lakhs, please.');
  });
it('refuses to recommend a property when the user asks for one in the chat history', async () => {
    // The provider is constrained by the system instructions to redirect back to
    // requirement gathering. The response is a clarifying question, not a list
    // of specific properties / priced inventory.
    const history = [
      { role: 'user', content: 'Can you recommend the best apartments in Hyderabad?' },
      { role: 'assistant', content: 'To find the right match, I need your budget range.' },
      { role: 'user', content: 'My budget is up to 60 lakhs.' },
    ];
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(CLARIFICATION_JSON))));
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${token()}`)
      .send({ history, incompleteState });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('INCOMPLETE');
    expect(res.body.nextAction).toBe('AI_CHAT');
    // No concrete property / price is exposed in the response envelope.
    expect(JSON.stringify(res.body)).not.toMatch(/villa|flat|apartment|price|₹|recommendedProperties/i);
  });

  it('rejects a client-injected companyId before any provider call (strict schema)', async () => {
    const provider = new CaptureProvider();
    const app = buildApp(createAISearchRouter(serviceFor(provider)));
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${token()}`)
      .send({ ...validPayload, companyId: 999 });
    expect(res.status).toBe(400);
    expect(provider.requests).toHaveLength(0);
  });

  it('rejects a history that fails structural alternation (400)', async () => {
    const badHistory = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'What budget?' },
      { role: 'assistant', content: 'Again, what budget?' },
      { role: 'user', content: 'budget 50' },
    ];
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(CLARIFICATION_JSON))));
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${token()}`)
      .send({ history: badHistory, incompleteState });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  it('rejects a history that ends on an assistant message (400)', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(CLARIFICATION_JSON))));
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        history: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'What budget?' },
        ],
        incompleteState,
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  it('maps a provider-side rate limit to 429', async () => {
    const provider = new FailProvider(
      new AIProviderError({ category: 'RATE_LIMITED', message: 'rate limited', retryable: true, provider: 'mock' })
    );
    const app = buildApp(createAISearchRouter(serviceFor(provider)));
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${token()}`)
      .send(validPayload);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('RATE_LIMITED');
  });

  it('enforces aiSearchLimiter: the 11th strict-rate-limited request returns 429', async () => {
    // Best-effort reset of the shared in-memory limiter so the test is deterministic.
    const limiterAny = aiSearchLimiter as unknown as {
      resetKey?: (key: string) => void;
      store?: { clear?: () => void; resetAll?: () => void };
    };
    limiterAny.store?.clear?.();
    limiterAny.store?.resetAll?.();
    limiterAny.resetKey?.('*');

    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(CLARIFICATION_JSON))));
    const auth = { Authorization: `Bearer ${token()}` };
    const strict = { 'x-strict-rate-limit': 'true' };

    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/v1/ai/chat').set(auth).set(strict).send(validPayload);
      expect(res.status).not.toBe(429);
    }
    const over = await request(app).post('/api/v1/ai/chat').set(auth).set(strict).send(validPayload);
    expect(over.status).toBe(429);
    expect(over.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});