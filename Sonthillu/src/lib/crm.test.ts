import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPublishedProperties, getPropertyDetailById } from './crm';

describe('CRM Client Error Handling', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CRM_API_BASE_URL: 'http://localhost:3000/api/v1',
      CRM_API_KEY: 'test-key',
    };
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it('getPublishedProperties degrades gracefully on CRM failure', async () => {
    // Simulate CRM 500 error
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    } as Response);

    const { data: result } = await getPublishedProperties();
    expect(result).toEqual([]); // Should return empty array gracefully
  });

  it('getPublishedProperties degrades gracefully on network failure', async () => {
    // Simulate connection refused
    vi.mocked(fetch).mockRejectedValue(new TypeError('fetch failed'));

    const { data: result } = await getPublishedProperties();
    expect(result).toEqual([]); // Should return empty array gracefully
  });

  it('getPropertyDetailById returns null for genuine 404 (missing data)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not Found' }),
    } as Response);

    const result = await getPropertyDetailById(999);
    expect(result).toBeNull();
  });

  it('getPropertyDetailById throws on CRM outage (500)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    } as Response);

    await expect(getPropertyDetailById(999)).rejects.toThrow('Internal Server Error');
  });

  it('getPropertyDetailById throws on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('fetch failed'));

    await expect(getPropertyDetailById(999)).rejects.toThrow('fetch failed');
  });
});
