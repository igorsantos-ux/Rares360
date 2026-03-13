console.log('🚀 Starting Backend Finance Server...');
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
import importRoutes from './routes/importRoutes.js';
import { SeedService } from './services/SeedService.js';
dotenv.config();
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
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.get('/', (req, res) => {
    res.json({ message: 'Heath Finance API is online' });
});
app.use('/api/auth', authRoutes);
app.use('/api/saas', saasRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/core', coreRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/contas-a-pagar', accountPayableRoutes);
app.use('/api/pendenciais', receivableRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/import', importRoutes);
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando graciosamente...');
    process.exit(0);
});
process.on('uncaughtException', (err) => {
    console.error('Exceção não capturada:', err);
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Heath Finance API is running' });
});
const port = 3001;
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server is officially listening on 0.0.0.0:${port}`);
    SeedService.autoSeedIfEmpty().catch(err => console.error('Erro no auto-seed background:', err));
});
