import request from 'supertest';
import app from '../src/server';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../src/utils/jwt');
jest.mock('../src/utils/prisma', () => ({
  customer: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  property: {
    findMany: jest.fn(),
  },
  document: {
    findMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  policyAcceptance: {
    findFirst: jest.fn(),
  },
}));

describe('Customer Portal - Profile & Documents', () => {
  const getCookie = (role: string, id: string = 'cust-1') => {
    const token = jwt.sign({ id, role, type: 'Customer' }, process.env.JWT_SECRET || 'secret');
    return `token=${token}`;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const jwtMock = require('../src/utils/jwt');
    jwtMock.verifyToken = jest.fn((token: string) => jwt.decode(token));
    (prisma.policyAcceptance.findFirst as jest.Mock).mockResolvedValue({ id: 'acc-1' });
  });

  it('1. Customer A sees own profile', async () => {
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
      id: 'cust-1',
      name: 'Alice',
      phone: '123',
    });

    const res = await request(app)
      .get('/api/v1/customers/profile')
      .set('Cookie', getCookie('Customer', 'cust-1'));

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alice');
    expect(prisma.customer.findUnique).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      select: expect.any(Object),
    });
  });

  it('2. Customer A cannot alter immutable identity fields', async () => {
    (prisma.customer.update as jest.Mock).mockResolvedValue({
      id: 'cust-1',
      name: 'Alice',
      phone: '999', // Name remains Alice
    });

    const res = await request(app)
      .put('/api/v1/customers/profile')
      .set('Cookie', getCookie('Customer', 'cust-1'))
      .send({ name: 'Hacker Bob', phone: '999' });

    expect(res.status).toBe(200);

    // Ensure `name` was NOT passed to the update query
    expect(prisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ name: 'Hacker Bob' }), // should only have phone
      }),
    );
  });

  it('3. Customer A sees own documents and property context', async () => {
    (prisma.property.findMany as jest.Mock).mockResolvedValue([
      { id: 'prop-1', propertyNumber: 'A1', project: { name: 'Alpha' } },
    ]);

    (prisma.document.findMany as jest.Mock).mockResolvedValue([
      { id: 'doc-1', referenceType: 'Customer', referenceId: 'cust-1' },
      { id: 'doc-2', referenceType: 'Property', referenceId: 'prop-1' },
    ]);

    const res = await request(app)
      .get('/api/v1/customers/documents')
      .set('Cookie', getCookie('Customer', 'cust-1'));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // Assert the property document got enriched
    const propDoc = res.body.find((d: any) => d.id === 'doc-2');
    expect(propDoc.context.project).toBe('Alpha');
    expect(propDoc.context.property).toBe('A1');
  });

  it('5. Unauthorized requests fail', async () => {
    const res = await request(app).get('/api/v1/customers/profile'); // No cookie

    expect(res.status).toBe(401);
  });
});
