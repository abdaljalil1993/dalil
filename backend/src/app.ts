import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './config/logger';
import { buildSwaggerSpec } from './config/swagger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';
import { UPLOADS_DIR } from './services/StorageService';
import routes from './routes';
import { sitemapHandler } from './routes/v21.routes';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow the web/mobile apps to load /uploads images
  })
);

const allowAll = env.corsOrigins.includes('*');
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowAll || env.corsOrigins.includes(origin.replace(/\/$/, ''))) return cb(null, true);
      logger.warn('CORS blocked', { origin });
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(compression());

app.use((req, _res, next) => {
  if (!env.isProduction) logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

// Local uploads (used when Cloudinary is not configured)
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', index: false }));

app.get('/sitemap.xml', sitemapHandler);
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString(), version: '2.0.0' }));

const spec = buildSwaggerSpec();
app.get('/api/v1/docs.json', (_req, res) => res.json(spec));
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(spec, { explorer: true, customSiteTitle: 'Dalilak API' }));

app.use('/api/v1', globalRateLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
