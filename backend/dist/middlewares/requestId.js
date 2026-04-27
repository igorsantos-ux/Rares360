import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';
// AsyncLocalStorage para propagar o requestId sem precisar passar pela árvore de funções
export const requestContext = new AsyncLocalStorage();
/**
 * Middleware para gerar um X-Request-ID para tracing de logs
 */
export const requestIdMiddleware = (req, res, next) => {
    let reqId = req.headers['x-request-id'];
    if (!reqId) {
        reqId = uuidv4();
        req.headers['x-request-id'] = reqId;
    }
    res.setHeader('X-Request-ID', reqId);
    requestContext.run({ requestId: reqId }, () => {
        next();
    });
};
