import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import mdRoutes from './routes/md.routes';
import demRoutes from './routes/dem.routes';
import customerRoutes from './routes/customer.routes';
import contentRoutes from './routes/content.routes';
import reportRoutes from './routes/report.routes';
import pmRoutes from './routes/pm.routes';
import fmRoutes from './routes/fm.routes';
import paymentRoutes from './routes/payment.routes';
import documentRoutes from './routes/document.routes';
import portalRoutes from './routes/portal.routes';
import resaleRoutes from './routes/resale.routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Global API Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 2000 : 200, // 2000 for dev, 200 for production
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/md', mdRoutes);
app.use('/api/v1/dem', demRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/system', contentRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/pm', pmRoutes);
app.use('/api/v1/fm', fmRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/portal', portalRoutes);
app.use('/api/v1/resale-requests', resaleRoutes);

// Health check - accessible both with and without /api prefix
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global Error Handler for Multer / File Upload errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    err.message &&
    (err.message.includes('Invalid file type') || err.message.includes('Invalid file extension'))
  ) {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
