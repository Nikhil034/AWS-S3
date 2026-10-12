import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import productsRouter from './routes/products.js';
import uploadsRouter from './routes/uploads.js';

export const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/products', productsRouter);
app.use('/api/uploads', uploadsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});
