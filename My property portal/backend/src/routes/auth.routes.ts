import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, changePassword, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // Limit each IP to 10 requests per windowMs (100 for dev)
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authLimiter, login);
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, authLimiter, changePassword);
router.post('/reset-password', authenticate, authLimiter, resetPassword);

export default router;
