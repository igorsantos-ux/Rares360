/**
 * SEC-007: Rate Limiting por endpoint
 * Proteção contra brute force, DDoS e abuso de API
 */
import rateLimit from 'express-rate-limit';

// Login: 10 tentativas por 15 min por IP
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.connection?.remoteAddress || 'unknown',
});

// API geral: 100 req/min por IP
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'Limite de requisições atingido. Tente novamente em breve.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Admin/SaaS: 30 req/min por IP
export const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Limite de requisições administrativas atingido.' },
    standardHeaders: true,
    legacyHeaders: false,
});
