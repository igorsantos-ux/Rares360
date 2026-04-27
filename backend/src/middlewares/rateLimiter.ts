/**
 * SEC-007: Rate Limiting por endpoint
 * Proteção contra brute force, DDoS e abuso de API
 */
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis.js';
import { Request } from 'express';

// Função para extrair IP real
const getClientIp = (req: Request): string => {
  return (req as any).realIp || 
         req.headers['cf-connecting-ip'] as string || 
         req.ip || 
         'unknown';
}

// Rate limit para login — mais restritivo
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  keyGenerator: getClientIp,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }) : undefined,
});

// Rate limit para API geral
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  keyGenerator: getClientIp,
  message: { error: 'Limite de requisições excedido.' },
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }) : undefined,
});

// Rate limit para endpoints admin — mais restritivo
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: getClientIp,
  message: { error: 'Limite de requisições admin excedido.' },
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }) : undefined,
});
