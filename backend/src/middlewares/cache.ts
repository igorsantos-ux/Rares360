import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis.js';

/**
 * Middleware para cachear requisições GET.
 * PERF-005: Cache Básico para rotas pesadas.
 * 
 * @param ttl Segundos para manter em cache
 */
export const cacheRoute = (ttl = 60) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (req.method !== 'GET' || !redis) {
            return next();
        }

        const clinicId = (req as any).clinicId || 'global';
        const key = `cache:${clinicId}:${req.originalUrl}`;

        try {
            const cachedBody = await redis.get(key);
            if (cachedBody) {
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('Content-Type', 'application/json');
                return res.send(cachedBody);
            }

            res.setHeader('X-Cache', 'MISS');
            const originalSend = res.send.bind(res);

            // Intercepta a resposta para salvar no Redis
            res.send = (body: any) => {
                redis.setex(key, ttl, body).catch((err: any) => {
                    console.error('[CACHE ERROR] Falha ao salvar no Redis:', err);
                });
                return originalSend(body);
            };

            next();
        } catch (error) {
            console.error('[CACHE ERROR] Falha ao consultar o Redis:', error);
            next();
        }
    };
};
