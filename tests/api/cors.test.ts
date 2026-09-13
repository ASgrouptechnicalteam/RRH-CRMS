import request from 'supertest';
import app from '../../apps/api/src/server';

describe('Phase 1.1 - CORS origin allow-list', () => {
  it('allows the production apex domain', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://radharealhomeproperties.com');
    expect(res.headers['access-control-allow-origin']).toBe('https://radharealhomeproperties.com');
    expect(res.status).not.toBe(500);
  });

  it('allows a subdomain of the production apex domain', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://rscrm.radharealhomeproperties.com');
    expect(res.headers['access-control-allow-origin']).toBe(
      'https://rscrm.radharealhomeproperties.com',
    );
    expect(res.status).not.toBe(500);
  });

  it('allows localhost dev origins', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.status).not.toBe(500);
  });

  it('rejects a lookalike domain that only substring-matches the apex domain (the exact bug this fix closed)', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://radharealhomeproperties.com.attacker.io');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(500);
  });

  it('rejects an arbitrary *.vercel.app origin (the removed blanket allowance)', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://some-random-app.vercel.app');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(500);
  });

  it('rejects an unrelated third-party origin', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(500);
  });

  it('allows requests with no Origin header (server-to-server, curl, mobile apps)', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).not.toBe(500);
  });
});
