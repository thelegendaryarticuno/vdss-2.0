import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorMiddleware } from './middleware/errorMiddleware';
import { config } from './config/env';

const app = express();

// Middleware
app.use(
  cors({
    origin: config.server.corsOrigin === '*' ? true : config.server.corsOrigin,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
