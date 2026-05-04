/**
 * SEC-007: Rate Limiting por endpoint
 * Proteção contra brute force, DDoS e abuso de API
 */
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis.js';
import { Request } from 'express';

// Helper que extrai IP real do Cloudflare e normaliza IPv6
const getClientIp = (req: Request): string => {
  const cfIp = req.headers['cf-connecting-ip'];
  const realIp = Array.isArray(cfIp) ? cfIp[0] : cfIp || req.ip || '127.0.0.1';
  // Usar ipKeyGenerator para normalizar IPv4-mapped IPv6 (::ffff:x.x.x.x)
  return ipKeyGenerator(realIp);
}

// Rate limit para login — agressivo (força bruta)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const email = req.body?.email?.toLowerCase().trim();
    return email ? `${ip}:${email}` : ip;
  },
  skip: (req) => process.env.NODE_ENV === 'development',
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true },
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:login:'
  }) : undefined,
});

// Rate limit para API geral — Aumentado para acomodar PM2 cluster (4 instâncias)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: getClientIp,
  skip: (req) => process.env.NODE_ENV === 'development',
  message: { error: 'Limite de requisições excedido.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true },
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:api:'
  }) : undefined,
});

// Rate limit para endpoints admin — Aumentado para suportar carga do modo Global
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  keyGenerator: getClientIp,
  skip: (req) => process.env.NODE_ENV === 'development',
  message: { error: 'Limite admin excedido.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true },
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:admin:'
  }) : undefined,
});
