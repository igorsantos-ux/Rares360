import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage para propagar o requestId sem precisar passar pela árvore de funções
export const requestContext = new AsyncLocalStorage<{ requestId: string }>();

/**
 * Middleware para gerar um X-Request-ID para tracing de logs
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    let reqId = req.headers['x-request-id'] as string;

    if (!reqId) {
        reqId = uuidv4();
        req.headers['x-request-id'] = reqId;
    }

    res.setHeader('X-Request-ID', reqId);

    requestContext.run({ requestId: reqId }, () => {
        next();
    });
};
