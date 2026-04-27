import client from 'prom-client';
// Criar o registry global do Prometheus
const register = new client.Registry();
// Habilitar métricas default do Node.js (GC, Memória, CPU)
client.collectDefaultMetrics({ register });
// ═══ Métricas Customizadas ═══
// Histograma de duração de requisições por Rota e Status Code
export const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duração das requisições HTTP em segundos',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5]
});
register.registerMetric(httpRequestDurationMicroseconds);
// Controlador total de requisições
export const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total de requisições HTTP processadas',
    labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestsTotal);
/**
 * Middleware para medir e contar requisições para o Prometheus
 */
export const prometheusMiddleware = (req, res, next) => {
    // Não metrificar a própria rota de métricas
    if (req.path === '/api/metrics' || req.path === '/api/health')
        return next();
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        // Reduzir cardinalidade agrupando parâmetros da rota (ex: /user/:id ao invés de /user/123)
        const route = req.route ? req.route.path : req.path;
        httpRequestsTotal.inc({
            method: req.method,
            route: route,
            status_code: res.statusCode
        });
        end({
            method: req.method,
            route: route,
            status_code: res.statusCode
        });
    });
    next();
};
export const getPrometheusMetrics = async () => {
    return await register.metrics();
};
