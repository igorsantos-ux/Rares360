/**
 * ═══════════════════════════════════════════
 * Cache Middleware — Rares360 Performance Layer
 * ═══════════════════════════════════════════
 * Middleware Express genérico para cache de respostas GET.
 * Gera chaves no formato: cache:{clinicId}:{path}:{queryHash}
 */
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { cacheGet, cacheSet } from '../lib/redis.js';

interface CacheOptions {
    ttl: number;          // TTL em segundos
    keyPrefix?: string;   // Prefixo customizado (default: path da rota)
}

function generateCacheKey(req: Request, prefix?: string): string {
    const clinicId = (req as any).clinicId || (req as any).user?.clinicId || 'global';
    const path = prefix || req.baseUrl + req.path;
    const queryString = JSON.stringify(req.query || {});
    const queryHash = crypto.createHash('md5').update(queryString).digest('hex').substring(0, 8);

    return `cache:${clinicId}:${path}:${queryHash}`;
}

export function cacheResponse(options: CacheOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Só cachear GET requests
        if (req.method !== 'GET') return next();

        const cacheKey = generateCacheKey(req, options.keyPrefix);

        try {
            const cached = await cacheGet(cacheKey);
            if (cached) {
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('Content-Type', 'application/json');
                return res.send(cached);
            }
        } catch {
            // Cache miss or error — proceed normally
        }

        // Interceptar res.json para salvar no cache
        const originalJson = res.json.bind(res);
        res.json = function (body: any) {
            // Só cachear respostas de sucesso (2xx)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const serialized = JSON.stringify(body);
                cacheSet(cacheKey, serialized, options.ttl).catch(() => { });
            }
            res.setHeader('X-Cache', 'MISS');
            return originalJson(body);
        };

        next();
    };
}

// ═══ Presets de Cache por Tipo de Rota ═══

/** Dashboard financeiro — dados mudam a cada transação, mas não precisa ser tempo real */
export const cacheDashboard = cacheResponse({ ttl: 300, keyPrefix: 'dashboard' });       // 5 min

/** DRE — relatórios pesados, raramente mudam */
export const cacheDRE = cacheResponse({ ttl: 900, keyPrefix: 'dre' });                   // 15 min

/** Listagem SaaS Admin — moderadamente frequente */
export const cacheSaaSClinics = cacheResponse({ ttl: 120, keyPrefix: 'saas-clinics' });   // 2 min

/** Listagem de usuários — mudanças infrequentes */
export const cacheSaaSUsers = cacheResponse({ ttl: 60, keyPrefix: 'saas-users' });        // 1 min

/** CRM Tasks — dados mais dinâmicos, cache curto */
export const cacheTasks = cacheResponse({ ttl: 30, keyPrefix: 'tasks' });                 // 30 seg

/** Cache genérico de 2 minutos para listas */
export const cacheList = cacheResponse({ ttl: 120 });                                     // 2 min
