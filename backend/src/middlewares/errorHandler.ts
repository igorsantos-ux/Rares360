/**
 * SEC-009 + SEC-022: Global Error Handler
 * Captura todos os erros não tratados e retorna respostas seguras
 * sem expor detalhes internos (stack traces, mensagens do Prisma, etc.)
 */
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    statusCode: number;
    userMessage: string;

    constructor(statusCode: number, userMessage: string, internalMessage?: string) {
        super(internalMessage || userMessage);
        this.statusCode = statusCode;
        this.userMessage = userMessage;
    }
}

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    // Log interno detalhado (apenas server-side)
    console.error(`[ERROR] ${req.method} ${req.path}`, {
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        userId: (req as any).user?.id,
        clinicId: (req as any).clinicId,
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
