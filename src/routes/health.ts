import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Attempt to run a simple query to verify DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'OK', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(503).json({ status: 'ERROR', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

export default router;
