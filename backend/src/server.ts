console.log('🚀 Starting Backend Finance Server...');
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

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

const app = express();

// ═══ SEC-008: Security Headers (Helmet.js) ═══
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
        },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false, // Necessário para uploads de imagens
}));

// Logger de requisições (sem dados sensíveis)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ═══ SEC-003: CORS com allowlist (sem wildcard em produção) ═══
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sem origin (mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);
        // Em dev (sem CORS_ORIGINS definido), permitir tudo
        if (ALLOWED_ORIGINS.length === 0) return callback(null, true);
        // Produção: checar allowlist
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Origem não permitida pelo CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-clinic-id'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.json({ message: 'Rares360 API is online' });
});

// ═══ Rotas públicas ═══
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/leads', leadRoutes);

// ═══ SEC-007: Rate limiting na API geral ═══
app.use('/api', apiLimiter);

// ═══ Rotas protegidas (auth + tenant) ═══
app.use('/api/saas', authMiddleware, tenantMiddleware, adminLimiter, saasRoutes);
app.use('/api/financial', authMiddleware, tenantMiddleware, financialRoutes);
app.use('/api/cash', authMiddleware, tenantMiddleware, cashRoutes);
app.use('/api/core', authMiddleware, tenantMiddleware, coreRoutes);
app.use('/api/reporting', authMiddleware, tenantMiddleware, reportingRoutes);
app.use('/api/analytics', authMiddleware, tenantMiddleware, analyticsRoutes);
app.use('/api/history', authMiddleware, tenantMiddleware, historyRoutes);
app.use('/api/contas-a-pagar', authMiddleware, tenantMiddleware, accountPayableRoutes);
app.use('/api/pendenciais', authMiddleware, tenantMiddleware, receivableRoutes);
app.use('/api/procedures', authMiddleware, tenantMiddleware, procedureRoutes);
app.use('/api/tasks', authMiddleware, tenantMiddleware, taskRoutes);
app.use('/api/upload', authMiddleware, tenantMiddleware, uploadRoutes);
app.use('/api/pricing', authMiddleware, tenantMiddleware, pricingRoutes);
app.use('/api/compliance', authMiddleware, tenantMiddleware, complianceRoutes);
app.use('/api/appointments', authMiddleware, tenantMiddleware, appointmentRoutes);
app.use('/api/clinic', authMiddleware, tenantMiddleware, clinicRoutes);
app.use('/api/pep', authMiddleware, tenantMiddleware, pepRoutes);
app.use('/api/goals', authMiddleware, tenantMiddleware, goalRoutes);
app.use('/api/audit', authMiddleware, tenantMiddleware, auditRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/dre', dreRoutes);
app.use('/api/dfc', dfcRoutes);
app.use('/api/import', authMiddleware, tenantMiddleware, importRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/treatment-plans', authMiddleware, tenantMiddleware, treatmentPlanRoutes);

// ═══ LGPD: Rotas de privacidade e direitos dos titulares ═══
app.use('/api/privacy', authMiddleware, privacyRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Rares360 API is running' });
});

// ═══ SEC-009/SEC-022: Global Error Handler (DEVE ser o último middleware) ═══
app.use(errorHandler);

process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando graciosamente...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('Exceção não capturada:', err);
});

const port = 3001;

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server is officially listening on 0.0.0.0:${port}`);
    MigrationService.runSoftMigrations().then(() => {
        SeedService.autoSeedIfEmpty().catch(err => console.error('Erro no auto-seed background:', err));
    }).catch(err => console.error('Erro no soft-migration background:', err));
});

