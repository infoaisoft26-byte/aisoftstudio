import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { authRouter } from './src/server/routes/authRoutes';
import { inquiryRouter } from './src/server/routes/inquiryRoutes';
import { projectRouter } from './src/server/routes/projectRoutes';
import { financeRouter } from './src/server/routes/financeRoutes';
import { metaRouter } from './src/server/routes/metaRoutes';
import { cmsRouter } from './src/server/routes/cmsRoutes';
import { chatRouter } from './src/server/routes/chatRoutes';
import { cybersecurityRouter } from './src/server/routes/cybersecurityRoutes';
import { conversationRouter } from './src/server/routes/conversationRoutes';
import { db } from './src/server/db/store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Express middleware
app.use(express.json());

// API Routers
app.use('/api/auth', authRouter);
app.use('/api/inquiries', inquiryRouter);
app.use('/api/projects', projectRouter);
app.use('/api/finance', financeRouter);
app.use('/api/meta', metaRouter);
app.use('/api/cms', cmsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/cybersecurity', cybersecurityRouter);
app.use('/api/conversations', conversationRouter);

// Webhook Direct Routes (for Graph API and Razorpay standard callbacks)
app.use('/api/webhooks/meta', metaRouter);
app.use('/api/webhooks/razorpay', financeRouter);
app.use('/api/webhooks/payment', financeRouter);

// Legacy compatibility route for original enquiry testing
app.get('/api/enquiry-summary', (_req: Request, res: Response) => {
  const inquiries = db.getInquiries();
  const sanitized = inquiries.map((e) => ({
    id: e.id,
    name: e.name,
    businessName: e.businessName,
    service: e.service,
    createdAt: e.createdAt,
    status: e.status,
  }));
  return res.json({ count: inquiries.length, enquiries: sanitized });
});

// Vite Middleware & Static Serving
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(
      `[AI SOFT STUDIO Platform] Running on http://0.0.0.0:${PORT} (Mode: ${
        isProd ? 'production' : 'development'
      })`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
