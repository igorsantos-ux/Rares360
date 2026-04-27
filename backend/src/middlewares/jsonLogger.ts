import { Request, Response, NextFunction } from 'express';
import { requestContext } from './requestId.js';

/**
 * Console log que cospe JSON para ser ingerível via Loki, ELK, Datadog ou CloudWatch
 */
export const jsonLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const context = requestContext.getStore();

        const logData = {
            timestamp: new Date().toISOString(),
            level: res.statusCode >= 400 ? 'WARN' : 'INFO',
            service: 'rares360-api',
            requestId: context?.requestId || 'unknown',
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            userAgent: req.get('User-Agent') || 'unknown',
            clientIp: req.ip || req.socket.remoteAddress || 'unknown',
            message: `HTTP ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`
        };

        if (res.statusCode >= 500) {
            logData.level = 'ERROR';
            console.error(JSON.stringify(logData));
        } else if (res.statusCode >= 400) {
            console.warn(JSON.stringify(logData));
        } else {
            console.log(JSON.stringify(logData));
        }
    });

    next();
};
