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
import { SeedService } from './services/SeedService.js';

dotenv.config();

// Auto-seed se o banco estiver vazio
SeedService.autoSeedIfEmpty();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/saas', saasRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/core', coreRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/history', historyRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Heath Finance API is running' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
