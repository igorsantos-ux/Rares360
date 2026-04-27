console.log('🚀 Starting Backend Finance Server...');
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import http from 'http';

import authRoutes from './routes/authRoutes.js';
import saasRoutes from './routes/saasRoutes.js';
import financialRoutes from './routes/financialRoutes.js';
import coreRoutes from './routes/coreRoutes.js';
import reportingRoutes from './routes/reportingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import accountPayableRoutes from './routes/accountPayableRoutes.js';
import receivableRoutes from './routes/receivableRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import clinicRoutes from './routes/clinicRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import dreRoutes from './routes/dreRoutes.js';
import dfcRoutes from './routes/dfcRoutes.js';

import importRoutes from './routes/importRoutes.js';
import cashRoutes from './routes/cashRoutes.js';
import procedureRoutes from './routes/procedureRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import pepRoutes from './routes/pepRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import managementRoutes from './routes/managementRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import treatmentPlanRoutes from './routes/treatmentPlanRoutes.js';
import privacyRoutes from './routes/privacyRoutes.js';
import { SeedService } from './services/SeedService.js';
import { MigrationService } from './services/MigrationService.js';

import { authMiddleware, tenantMiddleware } from './middlewares/authMiddleware.js';
import { loginLimiter, apiLimiter, adminLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { getRedisHealth } from './lib/redis.js';
import { geminiCircuitBreaker, emailCircuitBreaker } from './lib/circuitBreaker.js';
import { basePrisma } from './lib/prisma.js';

import { requestIdMiddleware } from './middlewares/requestId.js';
import { jsonLoggerMiddleware } from './middlewares/jsonLogger.js';
import { prometheusMiddleware, getPrometheusMetrics } from './middlewares/metricsMiddleware.js';

const app = express();

// ═══ SEC-011: Confiar no Proxy (Easypanel/Nginx/Cloudflare) para IP Real ═══
app.set('trust proxy', true);

// Middleware para extrair IP real do header CF-Connecting-IP
app.use((req, res, next) => {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) {
    (req as any).realIp = Array.isArray(cfIp) ? cfIp[0] : cfIp;
  } else {
    (req as any).realIp = req.ip;
  }
  next();
});

declare global {
  namespace Express {
    interface Request {
      realIp: string;
    }
  }
}

// ═══ PERF-001: Compressão HTTP (gzip/brotli) ═══
app.use(compression({
    threshold: 1024,  // Comprimir apenas respostas > 1KB
    level: 6,         // Nível de compressão balanceado (1-9)
}));

// ═══ SEC-008: Security Headers (Helmet.js ajustado para Cloudflare) ═══
app.use(helmet({
  // Cloudflare já gerencia HSTS
  hsts: false,
  // Cloudflare já gerencia X-Frame-Options
  frameguard: false,
  // Cloudflare não cobre as políticas abaixo
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://api.rares360.com.br", "https://generativelanguage.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.cloudflare.com", "https://fonts.gstatic.com"],
      frameSrc: ["https://challenges.cloudflare.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  },
  // xContentTypeOptions já é ativado por padrão
  // noSniff também não precisa ser explícito
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
  dnsPrefetchControl: { allow: false },
  // hidePoweredBy já é ativado por padrão
  crossOriginEmbedderPolicy: false,
}));

// ═══ SEC-003: CORS com allowlist ═══
const allowedOrigins = [
  'https://rares360.com.br',
  'https://www.rares360.com.br',
  'https://app.rares360.com.br',
  'https://api.rares360.com.br',
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://localhost:5173',
  ] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    // Mobile apps e Postman locais também não mandam origin às vezes. Vamos aceitar se estiver na allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origem não permitida: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'CF-Connecting-IP',
    'x-clinic-id'
  ],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400
}));

app.use((req, res, next) => {
  const isHttps = req.headers['cf-visitor']
    ? JSON.parse(req.headers['cf-visitor'] as string).scheme === 'https'
    : req.secure;
  
  if (process.env.NODE_ENV === 'production' && !isHttps) {
    console.warn(`Requisição não-HTTPS detectada de ${(req as any).realIp}`);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.json({ message: 'Rares360 API is online' });
});

// ═══ Rotas públicas ═══
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/leads', apiLimiter, leadRoutes);

// ═══ SEC-007: Rate limiting na API geral ═══
// Removido o global para evitar 'Double Count' em rotas que já tem adminLimiter
// app.use('/api', apiLimiter); 

// ═══ PERF-007: Distributed Tracing & Logging ═══
app.use(requestIdMiddleware);
app.use(jsonLoggerMiddleware);
app.use(prometheusMiddleware);

// ═══ Rotas protegidas (auth + tenant) ═══
app.use('/api/saas', authMiddleware, tenantMiddleware, adminLimiter, saasRoutes);
app.use('/api/financial', authMiddleware, tenantMiddleware, apiLimiter, financialRoutes);
app.use('/api/cash', authMiddleware, tenantMiddleware, apiLimiter, cashRoutes);
app.use('/api/core', authMiddleware, tenantMiddleware, apiLimiter, coreRoutes);
app.use('/api/reporting', authMiddleware, tenantMiddleware, apiLimiter, reportingRoutes);
app.use('/api/analytics', authMiddleware, tenantMiddleware, apiLimiter, analyticsRoutes);
app.use('/api/history', authMiddleware, tenantMiddleware, apiLimiter, historyRoutes);
app.use('/api/contas-a-pagar', authMiddleware, tenantMiddleware, apiLimiter, accountPayableRoutes);
app.use('/api/pendenciais', authMiddleware, tenantMiddleware, apiLimiter, receivableRoutes);
app.use('/api/procedures', authMiddleware, tenantMiddleware, apiLimiter, procedureRoutes);
app.use('/api/tasks', authMiddleware, tenantMiddleware, apiLimiter, taskRoutes);
app.use('/api/upload', authMiddleware, tenantMiddleware, apiLimiter, uploadRoutes);
app.use('/api/pricing', authMiddleware, tenantMiddleware, apiLimiter, pricingRoutes);
app.use('/api/compliance', authMiddleware, tenantMiddleware, apiLimiter, complianceRoutes);
app.use('/api/appointments', authMiddleware, tenantMiddleware, apiLimiter, appointmentRoutes);
app.use('/api/clinic', authMiddleware, tenantMiddleware, apiLimiter, clinicRoutes);
app.use('/api/pep', authMiddleware, tenantMiddleware, apiLimiter, pepRoutes);
app.use('/api/goals', authMiddleware, tenantMiddleware, apiLimiter, goalRoutes);
app.use('/api/audit', authMiddleware, tenantMiddleware, apiLimiter, auditRoutes);
app.use('/api/management', authMiddleware, tenantMiddleware, apiLimiter, managementRoutes);
app.use('/api/integrations', authMiddleware, tenantMiddleware, apiLimiter, integrationRoutes);
app.use('/api/dre', authMiddleware, tenantMiddleware, apiLimiter, dreRoutes);
app.use('/api/dfc', authMiddleware, tenantMiddleware, apiLimiter, dfcRoutes);
app.use('/api/import', authMiddleware, tenantMiddleware, apiLimiter, importRoutes);
app.use('/api/inventory', authMiddleware, tenantMiddleware, apiLimiter, inventoryRoutes);
app.use('/api/treatment-plans', authMiddleware, tenantMiddleware, apiLimiter, treatmentPlanRoutes);

// ═══ LGPD: Rotas de privacidade e direitos dos titulares ═══
app.use('/api/privacy', authMiddleware, privacyRoutes);

// ═══ PERF-002: Health Check Detalhado ═══
app.get('/api/health', async (req, res) => {
    const startTime = process.uptime();
    const memUsage = process.memoryUsage();

    // Database health
    let dbHealth = { status: 'down', latency_ms: -1 };
    try {
        const dbStart = Date.now();
        await basePrisma.$queryRaw`SELECT 1`;
        dbHealth = { status: 'up', latency_ms: Date.now() - dbStart };
    } catch {
        dbHealth = { status: 'down', latency_ms: -1 };
    }

    // Redis health
    const redisHealth = await getRedisHealth();

    // Circuit Breaker states
    const geminiState = geminiCircuitBreaker.getState();
    const emailState = emailCircuitBreaker.getState();

    // Overall status
    const isDbUp = dbHealth.status === 'up';
    const overallStatus = isDbUp ? (redisHealth.status === 'up' ? 'healthy' : 'degraded') : 'unhealthy';

    res.status(isDbUp ? 200 : 503).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: {
            database: dbHealth,
            redis: redisHealth,
            gemini: { status: geminiState === 'OPEN' ? 'circuit_open' : 'up' },
            email: { status: emailState === 'OPEN' ? 'circuit_open' : 'up' },
        },
        memory: {
            used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
            total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
            rss_mb: Math.round(memUsage.rss / 1024 / 1024),
        },
        uptime_seconds: Math.round(startTime),
    });
});

// ═══ PERF-003: Prometheus Metrics Endpoint ═══
app.get('/api/metrics', async (req, res) => {
    try {
        const metrics = await getPrometheusMetrics();
        res.setHeader('Content-Type', 'text/plain; version=0.0.4');
        res.send(metrics);
    } catch (err) {
        res.status(500).send('Erro ao gerar métricas');
    }
});

// ═══ SEC-009/SEC-022: Global Error Handler (DEVE ser o último middleware) ═══
app.use(errorHandler);

// ═══ PERF-004: Graceful Shutdown ═══
const port = 3001;
const server = http.createServer(app);

function gracefulShutdown(signal: string) {
    console.log(`\n[${signal}] Iniciando shutdown gracioso...`);
    const shutdownTimeout = setTimeout(() => {
        console.error('[Shutdown] Timeout de 30s atingido. Forçando encerramento.');
        process.exit(1);
    }, 30_000);

    server.close(() => {
        console.log('[Shutdown] Servidor HTTP fechado.');
        basePrisma.$disconnect().then(() => {
            console.log('[Shutdown] Conexão com banco encerrada.');
            clearTimeout(shutdownTimeout);
            process.exit(0);
        }).catch(() => {
            clearTimeout(shutdownTimeout);
            process.exit(0);
        });
    });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
    console.error('Exceção não capturada:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Promise não tratada:', reason);
});

server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server is officially listening on 0.0.0.0:${port}`);
    MigrationService.runSoftMigrations().then(() => {
        SeedService.autoSeedIfEmpty().catch(err => console.error('Erro no auto-seed background:', err));
    }).catch(err => console.error('Erro no soft-migration background:', err));
});

