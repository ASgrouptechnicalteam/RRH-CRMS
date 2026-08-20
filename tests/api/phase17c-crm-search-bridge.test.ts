/**
 * Phase 17-C — CRM Search Consumption & Deterministic Bridge tests.
 *
 * Proves that the deterministic CRM logic OVERRIDES the AI:
 *  - SearchIntent → CRM filters (translateToPropertyFilters / buildCrmSearchWhere).
 *  - Tenant isolation (company_id) is enforced on the CRM query.
 *  - Publication + availability exclude unpublished / SOLD / active-RESERVED properties
 *    even when the AI intent would "match" them perfectly.
 *  - Empty / zero-result matches are handled gracefully.
 *  - A COMPLETE AI Search response carries the CRM `results` array while preserving the
 *    `status` / `nextAction` contract.
 *
 * Pure bridge functions are exercised directly; DB-backed search uses injected mocks.
 */

import express from 'express';
import request from 'supertest';
import { Permissions } from '@rrh-ems/shared';
import type { Router } from 'express';
import type { TokenPayload } from '../../apps/api/src/utils/jwt';
import { AIProvider } from '../../apps/api/src/services/ai/provider';
import { AIRequest, AIResponse } from '../../apps/api/src/services/ai/types';
import { SearchIntentService } from '../../apps/api/src/services/ai/application';
import { AIConfig } from '../../apps/api/src/services/ai/config';
import { SearchIntent, validateSearchIntent } from '../../apps/api/src/services/ai/searchIntent';
import {
  translateToPropertyFilters,
  buildLocationConditions,
  buildCrmSearchWhere,
  deriveSearchAvailability,
  scoreAndSortPropertyRows,
  searchCrmMatches,
  CRMSearchError,
  SearchMatchResult,
  SEARCH_MATCH_WEIGHTS,
} from '../../apps/api/src/services/ai/searchIntentBridge';

// JWT secret is not present in .env.test, so the route + jwt modules (which throw on
// import when secrets are missing) are loaded lazily AFTER secrets are set.
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

class FixedProvider implements AIProvider {
  capabilities = { provider: 'mock', ...baseCaps };
  constructor(private readonly content: string) {}
  async generate(request: AIRequest): Promise<AIResponse> {
    return { content: this.content, model: 'mock', usage: null, metadata: request.metadata };
  }
}

function serviceFor(provider: AIProvider): SearchIntentService {
  const config = AIConfig.from({ provider: 'mock', enabled: false, timeoutMs: 30000, maxTokens: 1024, maxRetries: 1 });
  return new SearchIntentService({ provider, config });
}

function token(companyId = 101, employeeId = 7): string {
  const payload: TokenPayload = {
    employeeId,
    employeeCode: 'RRH-ADMIN-001',
    companyId,
    branchId: null,
    roles: ['Admin (Technical)'],
    permissions: [Permissions.AI_SEARCH],
  };
  return generateAccessTokenFn(payload);
}

function buildApp(router: Router): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/ai', router);
  return app;
}

describe('Phase 17-C: translateToPropertyFilters (SearchIntent → CRM filters)', () => {
  it('maps each SearchIntent field to the deterministic Property filter', () => {
    const intent: SearchIntent = {
      propertyType: 'APARTMENT',
      brandType: 'SONTHILLU',
      location: { city: 'Hyderabad', state: 'TS' },
      budget: { min: 3000000, max: 6000000 },
      bhk: { min: 2 },
      bathrooms: { min: 2 },
      area: { min: 1000, max: 2000 },
      facing: 'EAST',
      listingType: 'NEW',
      possessionStatus: 'READY_TO_MOVE',
      unsupportedCriteria: ['gym', 'swimming pool'],
    };
    const f = translateToPropertyFilters(intent);
    expect(f.category).toBe('APARTMENT');
    expect(f.brand_type).toBe('SONTHILLU');
    expect(f.price).toEqual({ gte: 3000000, lte: 6000000 });
    expect(f.bedrooms).toEqual({ gte: 2 });
    expect(f.bathrooms).toEqual({ gte: 2 });
    expect(f.area_sqft).toEqual({ gte: 1000, lte: 2000 });
    expect(f.facing).toBe('EAST');
    expect(f.listing_type).toBe('NEW');
    expect(f.possession_status).toBe('READY_TO_MOVE');
  });

  it('never fabricates a DB column for unsupportedCriteria', () => {
    const f = translateToPropertyFilters({ unsupportedCriteria: ['gym', 'swimming pool', 'clubhouse'] } as SearchIntent);
    expect(f).toEqual({});
  });

  it('omits budget/area bounds that are not supplied', () => {
    const f = translateToPropertyFilters({ budget: { max: 5000000 } } as SearchIntent);
    expect(f.price).toEqual({ lte: 5000000 });
    const areaOnly = translateToPropertyFilters({ area: { min: 800 } } as SearchIntent);
    expect(areaOnly.area_sqft).toEqual({ gte: 800 });
  });
});

describe('Phase 17-C: buildCrmSearchWhere (tenant isolation + publication + availability)', () => {
  const intent: SearchIntent = {
    propertyType: 'APARTMENT',
    brandType: 'SONTHILLU',
    location: { city: 'Hyderabad' },
    budget: { max: 6000000 },
  };

  it('enforces tenant isolation — company_id is the authenticated caller, never the client', () => {
    const where = buildCrmSearchWhere(intent, 7);
    expect(where.company_id).toBe(7);
    const pub = (where.publications as { some: any }).some;
    expect(pub.company_id).toBe(7);
  });

  it('requires the property be published to the company feed', () => {
    const where = buildCrmSearchWhere(intent, 7);
    expect((where.publications as { some: { is_published: boolean } }).some.is_published).toBe(true);
  });

  it('only allows AVAILABLE statuses — SOLD / BOOKED / active-RESERVED are excluded even if they match', () => {
    const where = buildCrmSearchWhere(intent, 7);
    const statuses = (where.OR as { status: string }[]).map((o) => o.status);
    expect(statuses).toContain('LIVE');
    expect(statuses).toContain('LOCKED');
    expect(statuses).not.toContain('BOOKED');
    expect(statuses).not.toContain('SOLD');
    // There is no path by which a BOOOKED/SOLD/PENDING_/REJECTED property survives.
    expect(where.OR).toHaveLength(2);
  });

  it('represents an expired LOCKED property as available (locked_until in the past)', () => {
    const where = buildCrmSearchWhere(intent, 7);
    const lockedRule = (where.OR as any[]).find((o) => o.status === 'LOCKED');
    expect(lockedRule.locked_until.lt).toBeInstanceOf(Date);
    expect(lockedRule.locked_until.lt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('builds a location AND filter that never collides with the availability OR key', () => {
    const w = buildCrmSearchWhere({ location: { city: 'Hyderabad' } } as SearchIntent, 7);
    expect(Array.isArray(w.AND)).toBe(true);
    const orInside = (w.AND as { OR: unknown[] }[])[0].OR;
    expect(orInside).toHaveLength(2); // city column + free-text location
  });
});

describe('Phase 17-C: availability derivation', () => {
  it('maps status to a public availability class (matches deriveAvailability)', () => {
    const past = new Date(Date.now() - 60_000);
    const future = new Date(Date.now() + 60_000);
    expect(deriveSearchAvailability('LIVE', null)).toBe('AVAILABLE');
    expect(deriveSearchAvailability('LOCKED', past)).toBe('AVAILABLE');
    expect(deriveSearchAvailability('LOCKED', future)).toBe('RESERVED');
    expect(deriveSearchAvailability('BOOKED', null)).toBe('SOLD');
    expect(deriveSearchAvailability('SOLD', null)).toBe('SOLD');
    expect(deriveSearchAvailability('PENDING_MD_APPROVAL', null)).toBe('UNAVAILABLE');
  });
});

describe('Phase 17-C: scoring and ranking (CRM authority over AI)', () => {
  it('scores best matches first using the CRM weights and returns a safe projection', () => {
    const lower = {
      id: 2,
      property_code: 'P2',
      title: 'Pune Flat',
      brand_type: 'SONTHILLU',
      category: 'APARTMENT',
      price: 5000000,
      area_sqft: 1200,
      location: 'Kothrud, Pune',
      city: 'Pune',
      state: 'MH',
      status: 'LIVE',
      locked_until: null,
    };
    const higher = {
      id: 1,
      property_code: 'P1',
      title: 'Hyderabad Apt',
      brand_type: 'SONTHILLU',
      category: 'APARTMENT',
      price: 4000000,
      area_sqft: 1500,
      location: 'Gachibowli, Hyderabad',
      city: 'Hyderabad',
      state: 'TS',
      status: 'LIVE',
      locked_until: null,
    };
    const intent: SearchIntent = { location: { city: 'Hyderabad' }, budget: { max: 6000000 }, propertyType: 'APARTMENT' };
    const scored = scoreAndSortPropertyRows([lower, higher], intent);
    expect(scored).toHaveLength(2);
    expect(scored[0].propertyId).toBe(1);
    expect(scored[1].propertyId).toBe(2);
    expect(scored[0].matchScore).toBeGreaterThan(scored[1].matchScore);
    expect(scored[0].availability).toBe('AVAILABLE');
    // Safe projection: no internal / company / provider leakage.
    expect(JSON.stringify(scored[0])).not.toContain('company_id');
    expect(JSON.stringify(scored[0])).not.toContain('companyId');
    expect(JSON.stringify(scored[0])).not.toContain('locked_until');
  });
});

describe('Phase 17-C: searchCrmMatches (deterministic authority over AI)', () => {
  it('returns a graceful empty array for a zero-result match', async () => {
    const db = { property: { findMany: async () => [] } };
    const res = await searchCrmMatches({ location: { city: 'Nowhereville' } } as SearchIntent, 7, db as any);
    expect(res).toEqual([]);
  });

  it('forwards the tenant-scoped, published, available where and shapes the CRM results', async () => {
    let capturedWhere: any = null;
    const db = {
      property: {
        findMany: async (args: any) => {
          capturedWhere = args.where;
          return [
            {
              id: 10,
              property_code: 'P10',
              title: 'Live Flat',
              brand_type: 'SONTHILLU',
              category: 'VILLA',
              price: 4500000,
              area_sqft: 1400,
              location: 'Hyderabad',
              city: 'Hyderabad',
              state: 'TS',
              status: 'LIVE',
              locked_until: null,
            },
          ];
        },
      },
    };
    const res = await searchCrmMatches({ location: { city: 'Hyderabad' } } as any, 7, db as any);
    // The CRM query was scoped to the authenticated company (never the client).
    expect(capturedWhere.company_id).toBe(7);
    expect(capturedWhere.publications.some.company_id).toBe(7);
    expect(capturedWhere.publications.some.is_published).toBe(true);
    expect(res).toHaveLength(1);
    expect(res[0].propertyId).toBe(10);
    expect(res[0].availability).toBe('AVAILABLE');
  });

  it('surfaces a CRMSearchError when the database findMany throws', async () => {
    const db = {
      property: {
        findMany: async () => {
          throw new Error('connection refused');
        },
      },
    };
    await expect(searchCrmMatches({} as any, 7, db as any)).rejects.toBeInstanceOf(CRMSearchError);
  });
});

describe('Phase 17-C: AI Search route wiring (status/nextAction contract + CRM results)', () => {
  it('returns COMPLETE with the CRM results array appended, preserving status/nextAction', async () => {
    const app = buildApp(createAISearchRouter(serviceFor(new FixedProvider(COMPLETE_JSON))));
    const res = await request(app)
      .post('/api/v1/ai/search')
      .set('Authorization', `Bearer ${token()}`)
      .send({ query: '2bhk apartment in Hyderabad below 60 lakhs' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETE');
    expect(res.body.nextAction).toBe('CRM_SEARCH');
    // The CRM bridge is what produces the matches array (never the AI).
    expect(Array.isArray(res.body.results)).toBe(true);
  });
});