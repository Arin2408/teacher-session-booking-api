import express from 'express';
import { connectDB } from './config/db';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import routes from './routes';
import { asyncHandler } from './utils/asyncHandler';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

// Ensures a database connection exists (reused across requests).
app.use(
  asyncHandler(async (_req, _res, next) => {
    await connectDB();
    next();
  }),
);

app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
