import request from 'supertest';
import app from '../../apps/api/src/server';

describe('Phase 1.7 - duplicate /api/v1/internal route namespace removed', () => {
  it('serves the real API at /api/v1/health', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).not.toBe(404);
  });

  it('no longer serves the abandoned /api/v1/internal/health mount', async () => {
    const res = await request(app).get('/api/v1/internal/health');
    expect(res.status).toBe(404);
  });

  it('no longer serves any /api/v1/internal/* route', async () => {
    const res = await request(app).get('/api/v1/internal/leads');
    expect(res.status).toBe(404);
  });
});
