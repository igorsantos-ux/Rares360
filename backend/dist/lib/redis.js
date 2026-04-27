/**
 * ═══════════════════════════════════════════
 * Redis Client — Rares360 Performance Layer
 * ═══════════════════════════════════════════
 * Fallback gracioso: se Redis não estiver disponível,
 * a aplicação continua funcionando sem cache.
 */
import RedisLib from 'ioredis';
let redis = null;
let isRedisAvailable = false;
function createRedisClient() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
        console.warn('[Redis] ⚠️ REDIS_URL não configurada. Cache desabilitado.');
        return null;
    }
    try {
        const client = new RedisLib(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times > 5) {
                    console.warn('[Redis] ❌ Máximo de tentativas atingido. Desabilitando cache.');
                    isRedisAvailable = false;
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 3000);
            },
            lazyConnect: true,
            enableReadyCheck: true,
            connectTimeout: 5000,
        });
        client.on('connect', () => {
            isRedisAvailable = true;
            console.log('[Redis] ✅ Conectado com sucesso');
        });
        client.on('error', (err) => {
            isRedisAvailable = false;
            console.warn('[Redis] ⚠️ Erro de conexão:', err.message);
        });
        client.on('close', () => {
            isRedisAvailable = false;
        });
        // Attempt connection (non-blocking)
        client.connect().catch(() => {
            console.warn('[Redis] ⚠️ Falha na conexão inicial. Operando sem cache.');
        });
        return client;
    }
    catch (err) {
        console.warn('[Redis] ⚠️ Falha ao criar cliente Redis:', err);
        return null;
    }
}
redis = createRedisClient();
// ═══ Cache Helper Functions ═══
export async function cacheGet(key) {
    if (!isRedisAvailable || !redis)
        return null;
    try {
        return await redis.get(key);
    }
    catch {
        return null;
    }
}
export async function cacheSet(key, value, ttlSeconds) {
    if (!isRedisAvailable || !redis)
        return;
    try {
        await redis.set(key, value, 'EX', ttlSeconds);
    }
    catch {
        // Silently fail — cache is optional
    }
}
export async function cacheDelete(pattern) {
    if (!isRedisAvailable || !redis)
        return;
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }
    catch {
        // Silently fail
    }
}
export async function invalidateCache(clinicId, ...prefixes) {
    for (const prefix of prefixes) {
        await cacheDelete(`cache:${clinicId}:${prefix}*`);
    }
}
// ═══ Health Check ═══
export async function getRedisHealth() {
    if (!isRedisAvailable || !redis) {
        return { status: 'down', latency_ms: -1 };
    }
    try {
        const start = Date.now();
        await redis.ping();
        return { status: 'up', latency_ms: Date.now() - start };
    }
    catch {
        return { status: 'down', latency_ms: -1 };
    }
}
export { redis, isRedisAvailable };
export default redis;
