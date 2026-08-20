/**
 * Phase 17-B — AI Provider Adapter + AI Search API (mock-first, deterministic).
 * No live provider calls. No API keys required. All tests use MockProvider or local doubles.
 */

import express from 'express';
import request from 'supertest';
import { Permissions } from '@rrh-ems/shared';
import type { Router } from 'express';
import type { TokenPayload } from '../../apps/api/src/utils/jwt';
import { AIProvider, AIProviderError } from '../../apps/api/src/services/ai/provider';
import { AIRequest, AIResponse } from '../../apps/api/src/services/ai/types';
import { MockProvider, MockProviderOptions } from '../../apps/api/src/services/ai/mockProvider';
import { AIConfig, AIConfigError } from '../../apps/api/src/services/ai/config';
import { createAIProvider } from '../../apps/api/src/services/ai/providerFactory';
import {
  OPENROUTER_PROVIDER,
  OPENROUTER_CHAT_URL,
  OpenRouterProvider,
  buildOpenRouterBody,
  parseOpenRouterResponse,
  classifyOpenRouterError,
} from '../../apps/api/src/services/ai/openRouterProvider';
import {
  validateSearchIntentExtraction,
  InvalidSearchIntentError,
} from '../../apps/api/src/services/ai/searchIntent';
import {
  SearchIntentService,
  assertNoTenantOverride,
  AITenantOverrideError,
  InvalidAIStructuredOutputError,
} from '../../apps/api/src/services/ai/application';
import { buildSearchApiResponse, AISearchRequestSchema } from '../../apps/api/src/services/ai/searchApi';
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

const COMPLETE_JSON = JSON.stringify({
  status: 'COMPLETE',
  searchIntent: {
    propertyType: 'APARTMENT',
    brandType: 'SONTHILLU',
    location: { city: 'Hyderabad' },
    budget: { max: 6000000 },
    bhk: { min: 2 },
  },
});

const INCOMPLETE_JSON = JSON.stringify({
  status: 'INCOMPLETE',
  missingRequirements: ['budget'],
  ambiguities: [{ field: 'location.city', candidates: ['Hyderabad', 'Secunderabad'] }],
  nextAction: 'AI_CHAT',
});

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
    return { content: COMPLETE_JSON, model: 'capture', usage: null, metadata: request.metadata };
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
  return new SearchIntentService({ provider, config: AIConfig.from({ provider: 'mock' }) });
}

const canonicalRequest: AIRequest = {
  messages: [
    { role: 'system', content: 'sys' },
    { role: 'user', content: '2bhk in Hyderabad' },
  ],
  metadata: {
    requestId: 'r1',
    correlationId: 'c1',
    companyId: 101,
    employeeId: 7,
    promptVersion: 'v1',
    responseVersion: 'v1',
  },
  temperature: 0,
  maxTokens: 1024,
};

function buildApp(router: Router) {
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
function mockResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as any;
}

describe('Phase 17-B: OpenRouter adapter (pure mapping + HTTPS via mocked fetch)', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });
  it('builds a structured chat body from a canonical request', () => {
    const body = buildOpenRouterBody(canonicalRequest, 'some-model');
    expect(body.model).toBe('some-model');
    expect(body.messages).toHaveLength(2);
    expect((body as any).response_format.type).toBe('json_object');
    expect(body.max_tokens).toBe(1024);
  });

  it('parses a canonical response from a provider payload', () => {
    const response = parseOpenRouterResponse(
      {
        model: 'some-model',
        choices: [{ message: { content: '{"status":"INCOMPLETE"}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      },
      canonicalRequest,
      OPENROUTER_PROVIDER
    );
    expect(response.content).toBe('{"status":"INCOMPLETE"}');
    expect(response.usage?.totalTokens).toBe(30);
    expect(response.metadata.companyId).toBe(101);
  });

  it('rejects an empty provider payload as INVALID_PROVIDER_RESPONSE', () => {
    expect(() =>
      parseOpenRouterResponse({ choices: [{ message: { content: '' } }] }, canonicalRequest, OPENROUTER_PROVIDER)
    ).toThrow(AIProviderError);
  });

  it('classifies rate-limit, quota and unavailability errors', () => {
    expect(classifyOpenRouterError({ status: 429 }, OPENROUTER_PROVIDER).category).toBe('RATE_LIMITED');
    expect(classifyOpenRouterError({ status: 402 }, OPENROUTER_PROVIDER).category).toBe('QUOTA_EXCEEDED');
    expect(classifyOpenRouterError({ status: 503 }, OPENROUTER_PROVIDER).category).toBe('PROVIDER_UNAVAILABLE');
    expect(classifyOpenRouterError({ status: 401 }, OPENROUTER_PROVIDER).category).toBe('CONFIGURATION_ERROR');
  });

    it('generate() sends a POST to OpenRouter with the configured model and a Bearer key', async () => {
    const provider = new OpenRouterProvider({ apiKey: 'test-dummy-key', model: 'meta/llama-7b' });
    const fetchMock = jest.fn();
    (globalThis as any).fetch = fetchMock;
    fetchMock.mockResolvedValue(
      mockResponse({
        model: 'meta/llama-7b',
        choices: [{ message: { content: COMPLETE_JSON } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      })
    );

    await provider.generate(canonicalRequest);

    expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, opts] = fetchMock.mock.calls[0] as [string, any];
    expect(url).toBe(OPENROUTER_CHAT_URL);
    expect(opts.method).toBe('POST');
    const headers = opts.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-dummy-key');
    expect(headers['Content-Type']).toBe('application/json');
    // Body carries the server-configured model only.
    expect(opts.body).toContain('"model":"meta/llama-7b"');
    // The API key is never placed into the request body.
    expect(opts.body).not.toContain('test-dummy-key');
  });

  it('generate() parses a successful OpenRouter response into a canonical AIResponse', async () => {
    const provider = new OpenRouterProvider({ apiKey: 'test-dummy-key', model: 'x' });
    (globalThis as any).fetch = jest.fn().mockResolvedValue(
      mockResponse({
        model: 'x',
        choices: [{ message: { content: COMPLETE_JSON } }],
        usage: { prompt_tokens: 5, completion_tokens: 8, total_tokens: 13 },
      })
    );

    const result = await provider.generate(canonicalRequest);
    expect(result.content).toBe(COMPLETE_JSON);
    expect(result.model).toBe('x');
    expect(result.usage).not.toBeNull();
    expect(result.usage?.inputTokens).toBe(5);
    expect(result.usage?.outputTokens).toBe(8);
    expect(result.usage?.totalTokens).toBe(13);
  });

  it('generate() rejects an empty OpenRouter content as INVALID_PROVIDER_RESPONSE', async () => {
    const provider = new OpenRouterProvider({ apiKey: 'test-dummy-key', model: 'x' });
    (globalThis as any).fetch = jest.fn().mockResolvedValue(
      mockResponse({ model: 'x', choices: [{ message: { content: '' } }] })
    );

    await expect(provider.generate(canonicalRequest)).rejects.toMatchObject({
      info: { category: 'INVALID_PROVIDER_RESPONSE', retryable: false },
    });
  });

  it('generate() normalizes a 429 as RATE_LIMITED (retryable)', async () => {
    const provider = new OpenRouterProvider({ apiKey: 'test-dummy-key', model: 'x' });
    (globalThis as any).fetch = jest.fn().mockResolvedValue(mockResponse({ error: { message: 'rate limit' } }, false, 429));

    await expect(provider.generate(canonicalRequest)).rejects.toMatchObject({
      info: { category: 'RATE_LIMITED', retryable: true },
    });
  });

  it('generate() normalizes a 401 as CONFIGURATION_ERROR (non-retryable)', async () => {
    const provider = new OpenRouterProvider({ apiKey: 'test-dummy-key', model: 'x' });
    (globalThis as any).fetch = jest
      .fn()
      .mockResolvedValue(mockResponse({ error: { message: 'invalid api key' } }, false, 401));

    await expect(provider.generate(canonicalRequest)).rejects.toMatchObject({
      info: { category: 'CONFIGURATION_ERROR', retryable: false },
    });
  });

  it('generate() normalizes a 503 as PROVIDER_UNAVAILABLE (retryable)', async () => {
    const provider = new OpenRouterProvider({ apiKey: 'test-dummy-key', model: 'x' });
    (globalThis as any).fetch = jest
      .fn()
      .mockResolvedValue(mockResponse({ error: { message: 'service unavailable' } }, false, 503));

    await expect(provider.generate(canonicalRequest)).rejects.toMatchObject({
      info: { category: 'PROVIDER_UNAVAILABLE', retryable: true },
    });
  });

  it('generate() converts a network failure into PROVIDER_UNAVAILABLE (retryable)', async () => {
    const provider = new OpenRouterProvider({ apiKey: 'test-dummy-key', model: 'x' });
    (globalThis as any).fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));

    await expect(provider.generate(canonicalRequest)).rejects.toMatchObject({
      info: { category: 'PROVIDER_UNAVAILABLE', retryable: true },
    });
  });
});

describe('Phase 17-B: strict envelope / structured output', () => {
  it('accepts a valid COMPLETE extraction', () => {
    const r = validateSearchIntentExtraction(JSON.parse(COMPLETE_JSON));
    expect(r.status).toBe('COMPLETE');
    expect(r.searchIntent?.propertyType).toBe('APARTMENT');
  });

  it('accepts a valid INCOMPLETE extraction with missing requirements and ambiguity', () => {
    const r = validateSearchIntentExtraction(JSON.parse(INCOMPLETE_JSON));
    expect(r.status).toBe('INCOMPLETE');
    expect(r.missingRequirements).toContain('budget');
    expect(r.ambiguities?.[0]?.candidates).toEqual(['Hyderabad', 'Secunderabad']);
  });

  it('rejects an extra top-level field (strict envelope)', () => {
    expect(() =>
      validateSearchIntentExtraction({
        status: 'COMPLETE',
        searchIntent: { propertyType: 'VILLA' },
        recommendation: 'buy X',
      })
    ).toThrow(InvalidSearchIntentError);
  });

  it('rejects recommendation / match-percentage / ranking inside the SearchIntent', () => {
    expect(() =>
      validateSearchIntentExtraction({ status: 'COMPLETE', searchIntent: { propertyType: 'VILLA', matchPercentage: 99 } })
    ).toThrow(InvalidSearchIntentError);
    expect(() =>
      validateSearchIntentExtraction({ status: 'COMPLETE', searchIntent: { propertyType: 'VILLA', ranking: 1 } })
    ).toThrow(InvalidSearchIntentError);
  });

  it('rejects unknown property type / invalid enum / invalid budget', () => {
    expect(() => validateSearchIntentExtraction({ status: 'COMPLETE', searchIntent: { propertyType: 'DUMPLING' } })).toThrow(InvalidSearchIntentError);
    expect(() => validateSearchIntentExtraction({ status: 'COMPLETE', searchIntent: { listingType: 'FORECLOSURE' } })).toThrow(InvalidSearchIntentError);
    expect(() => validateSearchIntentExtraction({ status: 'COMPLETE', searchIntent: { budget: { min: 9000000, max: 5000000 } } })).toThrow(InvalidSearchIntentError);
  });

  it('surfaces unsupported criteria structurally', () => {
    const r = validateSearchIntentExtraction({
      status: 'COMPLETE',
      searchIntent: { propertyType: 'APARTMENT', unsupportedCriteria: ['swimming pool'] },
    });
    expect(r.searchIntent?.unsupportedCriteria).toEqual(['swimming pool']);
  });
});
describe('Phase 17-B: service behaviors (mock provider)', () => {
  it('returns a COMPLETE extraction end-to-end', async () => {
    const svc = serviceFor(new FixedProvider(COMPLETE_JSON));
    const r = await svc.extract({ query: '2bhk in Hyderabad' }, { companyId: 101, employeeId: 7 });
    expect(r.status).toBe('COMPLETE');
    expect(r.searchIntent?.bhk?.min).toBe(2);
  });

  it('returns an INCOMPLETE extraction with structure (never conversational)', async () => {
    const svc = serviceFor(new FixedProvider(INCOMPLETE_JSON));
    const r = await svc.extract({ query: 'apartment' }, { companyId: 101, employeeId: 7 });
    expect(r.status).toBe('INCOMPLETE');
    expect(r.nextAction).toBe('AI_CHAT');
    expect(r.missingRequirements).toEqual(['budget']);
  });

  it('rejects malformed (non-JSON) provider output', async () => {
    const svc = serviceFor(new FixedProvider('Here are some properties you should buy.'));
    await expect(svc.extract({ query: '2bhk' }, { companyId: 101, employeeId: 7 })).rejects.toThrow(
      InvalidAIStructuredOutputError
    );
  });

  it('binds every provider request to the server company', async () => {
    const provider = new CaptureProvider();
    const svc = serviceFor(provider);
    await svc.extract({ query: '2bhk' }, { companyId: 202, employeeId: 9 });
    expect(provider.requests[0].metadata.companyId).toBe(202);
    expect(provider.requests[0].metadata.employeeId).toBe(9);
  });

  it('rejects nested tenant override attempts', () => {
    expect(() => assertNoTenantOverride({ query: 'x', nested: { tenantId: 999 } })).toThrow(
      AITenantOverrideError
    );
  });
});

describe('Phase 17-B: provider factory / configuration', () => {
  it('defaults to a deterministic mock provider', () => {
    const p = createAIProvider(AIConfig.from({}));
    expect(p.capabilities.provider).toBe('mock');
  });

  it('rejects an invalid provider name', () => {
    expect(() => createAIProvider(AIConfig.from({ provider: 'not-a-provider' }))).toThrow(AIConfigError);
  });

  it('rejects openrouter without an API key (secret required at runtime, never committed)', () => {
    const original = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      expect(() => createAIProvider(AIConfig.from({ provider: 'openrouter' }))).toThrow(AIConfigError);
    } finally {
      if (original !== undefined) process.env.OPENROUTER_API_KEY = original;
    }
  });

  it('rejects openrouter without a configured model', () => {
    const original = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = 'test-dummy-key';
    try {
      expect(() => createAIProvider(AIConfig.from({ provider: 'openrouter' }))).toThrow(AIConfigError);
    } finally {
      if (original !== undefined) process.env.OPENROUTER_API_KEY = original;
      else delete process.env.OPENROUTER_API_KEY;
    }
  });

  it('strict API request schema rejects tenant/provider/model keys', () => {
    expect(AISearchRequestSchema.safeParse({ query: '2bhk' }).success).toBe(true);
    expect(AISearchRequestSchema.safeParse({ query: '2bhk', companyId: 999 }).success).toBe(false);
    expect(AISearchRequestSchema.safeParse({ query: '2bhk', provider: 'openai' }).success).toBe(false);
    expect(AISearchRequestSchema.safeParse({ query: '' }).success).toBe(false);
  });

  it('builds COMPLETE (CRM_SEARCH) and INCOMPLETE (AI_CHAT) API responses', () => {
    const complete = buildSearchApiResponse(validateSearchIntentExtraction(JSON.parse(COMPLETE_JSON)));
    expect(complete.status).toBe('COMPLETE');
    expect(complete.nextAction).toBe('CRM_SEARCH');

    const incomplete = buildSearchApiResponse(validateSearchIntentExtraction(JSON.parse(INCOMPLETE_JSON)));
    expect(incomplete.status).toBe('INCOMPLETE');
    expect(incomplete.nextAction).toBe('AI_CHAT');
    expect(incomplete.ambiguities).toHaveLength(1);
  });
});
describe('Phase 17-B: AI Search API route', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(COMPLETE_JSON))));
    const res = await request(app).post('/api/v1/ai/search').send({ query: '2bhk' });
    expect(res.status).toBe(401);
  });

  it('rejects a request without the AI_SEARCH permission with 403', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(COMPLETE_JSON))));
    const res = await request(app)
      .post('/api/v1/ai/search')
      .set('Authorization', `Bearer ${token({ permissions: ['leads.read'] })}`)
      .send({ query: '2bhk' });
    expect(res.status).toBe(403);
  });

  it('returns COMPLETE with CRM_SEARCH for a valid authenticated request', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(COMPLETE_JSON))));
    const res = await request(app)
      .post('/api/v1/ai/search')
      .set('Authorization', `Bearer ${token()}`)
      .send({ query: '2bhk apartment in Hyderabad below 60 lakhs' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETE');
    expect(res.body.nextAction).toBe('CRM_SEARCH');
    expect(res.body.searchIntent.propertyType).toBe('APARTMENT');
  });

  it('returns INCOMPLETE with AI_CHAT for an incomplete request', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(INCOMPLETE_JSON))));
    const res = await request(app)
      .post('/api/v1/ai/search')
      .set('Authorization', `Bearer ${token()}`)
      .send({ query: 'apartment' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('INCOMPLETE');
    expect(res.body.nextAction).toBe('AI_CHAT');
    expect(res.body.missingRequirements).toEqual(['budget']);
  });

  it('rejects client-injected companyId before any provider call (strict schema)', async () => {
    const provider = new CaptureProvider();
    const app = buildApp(createAISearchRouter(serviceFor(provider)));
    const res = await request(app)
      .post('/api/v1/ai/search')
      .set('Authorization', `Bearer ${token()}`)
      .send({ query: '2bhk', companyId: 999 });
    expect(res.status).toBe(400);
    expect(provider.requests).toHaveLength(0);
  });

  it('rejects an over-length query server-side (400)', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(COMPLETE_JSON))));
    const res = await request(app)
      .post('/api/v1/ai/search')
      .set('Authorization', `Bearer ${token()}`)
      .send({ query: 'x'.repeat(4001) });
    expect(res.status).toBe(400);
  });

  it('maps provider rate-limit to 429', async () => {
    const provider = new FailProvider(
      new AIProviderError({ category: 'RATE_LIMITED', message: 'rl', retryable: true, provider: 'mock' })
    );
    const app = buildApp(createAISearchRouter(serviceFor(provider)));
    const res = await request(app)
      .post('/api/v1/ai/search')
      .set('Authorization', `Bearer ${token()}`)
      .send({ query: '2bhk' });
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('RATE_LIMITED');
  });

  it('maps malformed AI output to 422 and never reveals prompts', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider('talkative prose'))));
    const res = await request(app)
      .post('/api/v1/ai/search')
      .set('Authorization', `Bearer ${token()}`)
      .send({ query: '2bhk' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_AI_OUTPUT');
    expect(JSON.stringify(res.body)).not.toContain('talkative prose');
  });

  it('does not expose provider/model/apiKey/companyId in COMPLETE responses', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(COMPLETE_JSON))));
    const res = await request(app)
      .post('/api/v1/ai/search')
      .set('Authorization', `Bearer ${token()}`)
      .send({ query: '2bhk' });
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('provider');
    expect(body).not.toContain('apiKey');
    expect(body).not.toContain('companyId');
    expect(body).not.toContain('matchPercentage');
    expect(body).not.toContain('properties');
  });

  it('enforces aiSearchLimiter: the 11th strict-rate-limited request returns 429', async () => {
    // Best-effort reset of the shared in-memory limiter so the test is deterministic
    // regardless of module-cache reuse across reruns within the same worker process.
    const limiterAny = aiSearchLimiter as unknown as {
      resetKey?: (key: string) => void;
      store?: { clear?: () => void; resetAll?: () => void };
    };
    limiterAny.store?.clear?.();
    limiterAny.store?.resetAll?.();
    limiterAny.resetKey?.('*');

    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(COMPLETE_JSON))));
    const auth = { Authorization: `Bearer ${token()}` };
    const strict = { 'x-strict-rate-limit': 'true' };

    // 10 requests within the configured limit (max: 10 / minute) must succeed.
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/v1/ai/search').set(auth).set(strict).send({ query: '2bhk' });
      expect(res.status).not.toBe(429);
    }

    // The 11th request exceeds the configured limit and must be rejected.
    const over = await request(app).post('/api/v1/ai/search').set(auth).set(strict).send({ query: '2bhk' });
    expect(over.status).toBe(429);
    expect(over.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

// ---------------------------------------------------------------------------
// Approval-gated live integration test.
// Runs ONLY when AI_LIVE_TEST=true AND OPENROUTER_API_KEY + AI_MODEL are set.
// Never executes during the normal deterministic test suite.
// ---------------------------------------------------------------------------
const RUN_LIVE = process.env.AI_LIVE_TEST === 'true';

(RUN_LIVE ? describe : describe.skip)(
  'Phase 17-B: OpenRouter live integration (approval-gated)',
  () => {
    it('round-trips a minimal query through the real OpenRouter endpoint', async () => {
      const apiKey = process.env.OPENROUTER_API_KEY;
      const model = process.env.AI_MODEL;
      if (!apiKey || !apiKey.trim()) {
        throw new Error('AI_LIVE_TEST=true requires OPENROUTER_API_KEY in the environment.');
      }
      if (!model || !model.trim()) {
        throw new Error('AI_LIVE_TEST=true requires AI_MODEL in the environment.');
      }

      const config = AIConfig.from({
        provider: 'openrouter',
        model,
        enabled: true,
        timeoutMs: 25_000,
        maxTokens: 1024,
        maxRetries: 0,
      });
      const provider = createAIProvider(config);
      const svc = new SearchIntentService({ provider, config });

      const extraction = await svc.extract(
        { query: '2 BHK apartment in Hyderabad under 60 lakhs' },
        { companyId: 101, employeeId: 7 }
      );

      // A valid, schema-validated envelope proves the request reached OpenRouter and returned
      // structured JSON — any non-JSON or schema-violating output is rejected upstream.
      validateSearchIntentExtraction(extraction);
      expect(['COMPLETE', 'INCOMPLETE']).toContain(extraction.status);
      if (extraction.status === 'COMPLETE') {
        expect(extraction.nextAction).toBe('CRM_SEARCH');
        expect(extraction.searchIntent).toBeDefined();
      } else {
        expect(extraction.nextAction).toBe('AI_CHAT');
      }
    }, 30_000);
  }
);