import request from 'supertest';
import app from '../../apps/api/src/server';
import fs from 'fs';
import path from 'path';

describe('Phase D - Security & Upload Boundaries', () => {
  beforeAll(() => {
    // Ensure test directories exist
    const testProps = path.join(process.cwd(), 'uploads/properties/test-prop/images');
    const testDocs = path.join(process.cwd(), 'uploads/documents');
    const testProofs = path.join(process.cwd(), 'uploads/expense-proofs');

    if (!fs.existsSync(testProps)) fs.mkdirSync(testProps, { recursive: true });
    if (!fs.existsSync(testDocs)) fs.mkdirSync(testDocs, { recursive: true });
    if (!fs.existsSync(testProofs)) fs.mkdirSync(testProofs, { recursive: true });

    // Write dummy files
    fs.writeFileSync(path.join(testProps, 'public.jpg'), 'public-image-content');
    fs.writeFileSync(path.join(testDocs, 'secret.pdf'), 'secret-doc-content');
    fs.writeFileSync(path.join(testProofs, 'proof.jpg'), 'secret-proof-content');
  });

  afterAll(() => {
    // Cleanup
    const testProps = path.join(process.cwd(), 'uploads/properties/test-prop/images/public.jpg');
    const testDocs = path.join(process.cwd(), 'uploads/documents/secret.pdf');
    const testProofs = path.join(process.cwd(), 'uploads/expense-proofs/proof.jpg');

    if (fs.existsSync(testProps)) fs.unlinkSync(testProps);
    if (fs.existsSync(testDocs)) fs.unlinkSync(testDocs);
    if (fs.existsSync(testProofs)) fs.unlinkSync(testProofs);
  });

  it('1. Property image remains accessible (public)', async () => {
    const res = await request(app).get('/uploads/properties/test-prop/images/public.jpg');
    expect(res.status).toBe(200);
  });

  it('2. Private document cannot be fetched directly', async () => {
    const res = await request(app).get('/uploads/documents/secret.pdf');
    expect(res.text).not.toContain('secret-doc-content');
    if (res.status === 200) {
      expect(res.text).toContain('<html'); // React SPA fallback
    } else {
      expect(res.status).toBe(404);
    }
  });

  it('3. Private expense proof cannot be fetched directly', async () => {
    const res = await request(app).get('/uploads/expense-proofs/proof.jpg');
    expect(res.text).not.toContain('secret-proof-content');
    if (res.status === 200) {
      expect(res.text).toContain('<html'); // React SPA fallback
    } else {
      expect(res.status).toBe(404);
    }
  });
});
