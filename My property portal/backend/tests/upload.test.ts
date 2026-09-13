import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/jwt');
jest.mock('../src/utils/prisma', () => ({
  document: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  paymentProof: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  property: {
    findUnique: jest.fn(),
  },
  assignment: {
    findFirst: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
}));

jest.mock('../src/services/storage.service', () => {
  const { Readable } = require('stream');
  return {
    __esModule: true,
    default: {
      uploadFile: jest
        .fn()
        .mockResolvedValue({ safeFilename: 'mock-safe-name.jpg', path: '/mock/path' }),
      getFileStream: jest.fn().mockResolvedValue(Readable.from(['mock file content'])),
      deleteFile: jest.fn(),
    },
  };
});

describe('File Upload & Storage Infrastructure', () => {
  const getCookie = (role: string, id: string = 'user-123') => {
    const token = jwt.sign(
      { id, role, type: role === 'Customer' ? 'Customer' : 'Employee' },
      process.env.JWT_SECRET || 'secret',
    );
    return `token=${token}`;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const jwtMock = require('../src/utils/jwt');
    jwtMock.verifyToken = jest.fn((token: string) => jwt.decode(token));
  });

  const mockFileBuffer = Buffer.from('fake image content');

  it('1. Valid upload successfully processes through middleware to DB', async () => {
    (prisma.document.create as jest.Mock).mockResolvedValue({ id: 'doc-1' });

    const res = await request(app)
      .post('/api/v1/documents/upload')
      .set('Cookie', getCookie('PM'))
      .field('referenceType', 'Customer')
      .field('referenceId', 'cust-1')
      .field('documentType', 'ID_PROOF')
      .attach('file', mockFileBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(prisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          originalFilename: 'test.jpg',
          safeFilename: 'mock-safe-name.jpg',
          mimeType: 'image/jpeg',
        }),
      }),
    );
  });

  it('2. Invalid file type (e.g. executable) is blocked by middleware', async () => {
    const res = await request(app)
      .post('/api/v1/documents/upload')
      .set('Cookie', getCookie('PM'))
      .attach('file', mockFileBuffer, {
        filename: 'virus.exe',
        contentType: 'application/x-msdownload',
      });

    expect(res.status).toBe(400); // Bad Request
    expect(res.body.message).toContain('Invalid file type');
  });

  it('4. Unauthorized access (Missing JWT blocked)', async () => {
    const res = await request(app)
      .post('/api/v1/documents/upload')
      // No cookie
      .attach('file', mockFileBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(401);
  });

  it('5. Customer isolation: Customer A cannot download Customer B document', async () => {
    (prisma.document.findFirst as jest.Mock).mockResolvedValue({
      id: 'doc-1',
      referenceType: 'Customer',
      referenceId: 'customer-B', // Document belongs to B
      safeFilename: 'test.pdf',
    });

    const res = await request(app)
      .get('/api/v1/documents/stream/test.pdf')
      .set('Cookie', getCookie('Customer', 'customer-A')); // A trying to access B

    expect(res.status).toBe(403);
  });

  it('6 & 7. Project isolation: FM cannot view Payment Proof from unassigned project', async () => {
    (prisma.document.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.paymentProof.findFirst as jest.Mock).mockResolvedValue({
      safeFilename: 'proof.jpg',
      payment: {
        installment: {
          emiSchedule: {
            property: { projectId: 'project-A' },
          },
        },
      },
    });
    // FM has no assignment
    (prisma.assignment.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/v1/documents/stream/proof.jpg')
      .set('Cookie', getCookie('FM', 'fm-1'));

    expect(res.status).toBe(403);
  });

  it('8. Document access allows authorized users', async () => {
    (prisma.document.findFirst as jest.Mock).mockResolvedValue({
      id: 'doc-1',
      referenceType: 'Customer',
      referenceId: 'customer-A',
      safeFilename: 'test.pdf',
    });

    const res = await request(app)
      .get('/api/v1/documents/stream/test.pdf')
      .set('Cookie', getCookie('Customer', 'customer-A'));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/octet-stream');
  });

  it('9. Replacement/versioning correctly increments version', async () => {
    (prisma.document.findUnique as jest.Mock).mockResolvedValue({ id: 'doc-1', version: 1 });
    (prisma.document.update as jest.Mock).mockResolvedValue({ id: 'doc-1', version: 2 });

    const res = await request(app)
      .post('/api/v1/documents/doc-1/versions')
      .set('Cookie', getCookie('PM'))
      .attach('file', mockFileBuffer, { filename: 'test-v2.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(prisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          version: { increment: 1 },
        }),
      }),
    );
  });
});
