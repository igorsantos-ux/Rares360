/**
 * SEC-007: Rate Limiting por endpoint
 * Proteção contra brute force, DDoS e abuso de API
 */
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis.js';
import { Request } from 'express';

// Função para extrair IP real de forma compatível com as validações de IPv6 da lib
const getClientIp = (req: Request): string => {
  // Se estivermos atrás do Cloudflare, o realIp (extraído do header cf-connecting-ip) é o mais confiável
  // Caso contrário, usamos o req.ip que já foi validado pelo 'trust proxy' do Express
  return (req as any).realIp || req.ip || 'unknown';
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

// Rate limit para API geral — Aumentado para suportar dashboards complexos
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 300, // Aumentado de 100 para 300
  keyGenerator: getClientIp,
  message: { error: 'Limite de requisições excedido.' },
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }) : undefined,
});

// Rate limit para endpoints admin — Aumentado para suportar carga do modo Global
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150, // Aumentado de 30 para 150
  keyGenerator: getClientIp,
  message: { error: 'Limite de requisições admin excedido.' },
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }) : undefined,
});
