export class AppError extends Error {
    statusCode;
    userMessage;
    constructor(statusCode, userMessage, internalMessage) {
        super(internalMessage || userMessage);
        this.statusCode = statusCode;
        this.userMessage = userMessage;
    }
}
export const errorHandler = (err, req, res, _next) => {
    // Log interno detalhado (apenas server-side)
    console.error(`[ERROR] ${req.method} ${req.path}`, {
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        userId: req.user?.id,
        clinicId: req.clinicId,
    });
    // Erro conhecido do app
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.userMessage });
    }
    // Erros do Prisma — nunca expor ao cliente
    if (err.code?.startsWith('P')) {
        return res.status(500).json({ error: 'Erro ao processar dados. Tente novamente.' });
    }
    // Erros de tenant isolation
    if (err.message?.includes('tenant isolation')) {
        return res.status(403).json({ error: 'Acesso negado ao recurso solicitado.' });
    }
    // Erros genéricos
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: statusCode >= 500
            ? 'Erro interno do servidor. Tente novamente mais tarde.'
            : err.userMessage || 'Erro ao processar requisição.'
    });
};
