import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { parse as parseYaml } from 'yaml';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';
import { logger } from './utils/logger.js';

function mountDocs(app) {
  const file = path.resolve(process.cwd(), 'docs/openapi.yaml');

  if (!fs.existsSync(file)) {
    return;
  }

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(parseYaml(fs.readFileSync(file, 'utf8')))
  );
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = req.headers['x-request-id'] ?? randomUUID();
        res.setHeader('X-Request-Id', id);

        return id;
      },
    }),
  );
  mountDocs(app); // before helmet: Swagger UI needs inline scripts that the default CSP blocks
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL || 'http://localhost:5173',
      allowedHeaders: ['Content-Type', 'X-Rider-Id', 'Idempotency-Key', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'Idempotent-Replayed'],
    }),
  );
  app.use(express.json({ limit: '50kb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false
    }));
  }

  app.get(
    '/health',
    (_req, res) => {
      const dbUp = mongoose.connection.readyState === 1;
      res.status(dbUp ? 200 : 503).json({
        status: dbUp ? 'ok' : 'degraded',
        db: dbUp ? 'up' : 'down'
      });
    }
  );
  app.use('/api/v1', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
