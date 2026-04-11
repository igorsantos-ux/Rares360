console.log('🚀 Starting Backend Finance Server...');
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
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

import importRoutes from './routes/importRoutes.js';
import cashRoutes from './routes/cashRoutes.js';
import procedureRoutes from './routes/procedureRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import pepRoutes from './routes/pepRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import { SeedService } from './services/SeedService.js';
import { MigrationService } from './services/MigrationService.js';



const app = express();

// Logger de requisições - MOVIDO PARA O TOPO para capturar tudo (inclusive OPTIONS/CORS)
app.use((req, res, next) => {
    const origin = req.headers.origin || 'No Origin';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${origin}`);
    next();
});

// Configuração robusta de CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-clinic-id'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.json({ message: 'Rares360 API is online' });
});

import { authMiddleware, tenantMiddleware } from './middlewares/authMiddleware.js';

app.use('/api/auth', authRoutes);
app.use('/api/saas', authMiddleware, tenantMiddleware, saasRoutes);
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
app.use('/api/leads', leadRoutes);

app.use('/api/import', authMiddleware, tenantMiddleware, importRoutes);

process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando graciosamente...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('Exceção não capturada:', err);
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Rares360 API is running' });
});

const port = 3001;

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server is officially listening on 0.0.0.0:${port}`);
    MigrationService.runSoftMigrations().then(() => {
        SeedService.autoSeedIfEmpty().catch(err => console.error('Erro no auto-seed background:', err));
    }).catch(err => console.error('Erro no soft-migration background:', err));
});
