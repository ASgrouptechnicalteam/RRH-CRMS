/**
 * Phase 17-B — AI Search API route.
 *
 * Flow: authenticateToken → aiSearchLimiter → requireAuthz(AI_SEARCH) → validateRequestBody
 *   → SearchIntentService.extract (server-derived req.user.companyId) → COMPLETE/INCOMPLETE.
 *
 * The AI's responsibility ends at SearchIntent — CRM performs deterministic filtering,
 * matching, scoring and ranking (Phase 17-C). The client can never control tenant identity,
 * provider, model, credentials, permissions, or tools.
 */

import { Router, Response } from 'express';
import { Permissions } from '@rrh-ems/shared';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireAuthz } from '../middleware/authz';
import { validateRequestBody } from '../middleware/validate';
import { aiSearchLimiter } from '../middleware/rateLimiter';
import { AISearchRequestSchema, buildSearchApiResponse } from '../services/ai/searchApi';
import { AIConfig, AIConfigError } from '../services/ai/config';
import { createAIProvider } from '../services/ai/providerFactory';
import { AIProviderError } from '../services/ai/provider';
import { InvalidSearchIntentError } from '../services/ai/searchIntent';
import {
  SearchIntentService,
  AITenantOverrideError,
  InvalidAIInputError,
  InvalidAIStructuredOutputError,
  AuthenticatedAICaller,
} from '../services/ai/application';

function mapAIError(err: unknown, res: Response): void {
  if (err instanceof AIProviderError) {
    const table: Record<string, { status: number; code: string }> = {
      TIMEOUT: { status: 504, code: 'TIMEOUT' },
      RATE_LIMITED: { status: 429, code: 'RATE_LIMITED' },
      QUOTA_EXCEEDED: { status: 429, code: 'QUOTA_EXCEEDED' },
      PROVIDER_UNAVAILABLE: { status: 502, code: 'PROVIDER_UNAVAILABLE' },
      INVALID_PROVIDER_RESPONSE: { status: 502, code: 'INVALID_PROVIDER_RESPONSE' },
      MODEL_UNAVAILABLE: { status: 502, code: 'MODEL_UNAVAILABLE' },
      INVALID_REQUEST: { status: 400, code: 'INVALID_REQUEST' },
      CONFIGURATION_ERROR: { status: 500, code: 'CONFIGURATION_ERROR' },
      UNKNOWN_PROVIDER_ERROR: { status: 502, code: 'UPSTREAM_ERROR' },
    };
    const mapped = table[err.info.category] ?? { status: 502, code: 'UPSTREAM_ERROR' };
    res.status(mapped.status).json({ error: err.info.message, code: mapped.code });
    return;
  }

  if (err instanceof InvalidAIStructuredOutputError || err instanceof InvalidSearchIntentError) {
    res.status(422).json({ error: 'AI returned invalid structured output', code: 'INVALID_AI_OUTPUT' });
    return;
  }

  if (err instanceof AITenantOverrideError || err instanceof InvalidAIInputError) {
    res.status(400).json({ error: err.message, code: 'INVALID_REQUEST' });
    return;
  }

  if (err instanceof AIConfigError) {
    res.status(500).json({ error: 'AI is not configured correctly', code: 'CONFIGURATION_ERROR' });
    return;
  }

  if (err && (err as { statusCode?: number }).statusCode) {
    res.status((err as { statusCode: number }).statusCode).json({ error: (err as Error).message });
    return;
  }

  console.error('[ai-search]', err);
  res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
}

function defaultService(): SearchIntentService {
  const config = AIConfig.fromEnv();
  return new SearchIntentService({ provider: createAIProvider(config), config });
}

export function createAISearchRouter(service?: SearchIntentService): Router {
  const router = Router();
  const svc = service ?? defaultService();

  router.post(
    '/search',
    authenticateToken,
    aiSearchLimiter,
    requireAuthz(Permissions.AI_SEARCH),
    validateRequestBody(AISearchRequestSchema),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const caller: AuthenticatedAICaller = {
          companyId: req.user!.companyId,
          employeeId: req.user!.employeeId,
        };
        const extraction = await svc.extract(req.body, caller);
        res.status(200).json(buildSearchApiResponse(extraction));
      } catch (err) {
        mapAIError(err, res);
      }
    }
  );

  return router;
}

export default createAISearchRouter();
