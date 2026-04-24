import { Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import prisma from '../lib/prisma.js';

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    console.log(`[AUTH DEBUG] Path: ${req.originalUrl} | Method: ${req.method} | AuthHeader Present: ${!!authHeader}`);

    if (!authHeader) {
        console.warn(`[AUTH ERROR] Token ausente para a rota: ${req.originalUrl}`);
        return res.status(401).json({ error: 'Token não fornecido', message: 'Token não fornecido' });
    }

    const [, token] = authHeader.split(' ');

    try {
        const decoded = AuthService.verifyToken(token);

        if (!decoded) {
            console.error('--- FALHA NA VERIFICAÇÃO DO TOKEN ---');
            console.error('Token capturado:', token.substring(0, 20) + '...');
            return res.status(401).json({ error: 'Token inválido ou expirado', message: 'Token inválido ou expirado' });
        }

        req.user = decoded;
        req.userId = decoded.id;
        
        // Bloqueia rotas se precisar trocar a senha e a rota não for a de trocar a senha ou impersonate
        const isSafeRoute = req.originalUrl.includes('/auth/update-password') || req.originalUrl.includes('/saas/impersonate');
        
        if (decoded.mustChangePassword && !isSafeRoute) {
             return res.status(403).json({ error: 'Troca de senha obrigatória', requirePasswordChange: true });
        }

        next();
    } catch (err: any) {
        console.error('--- ERRO CATASTRÓFICO NO AUTH MIDDLEWARE ---', err);
        return res.status(401).json({ error: 'Erro de autenticação', message: err.message });
    }
};

export const roleMiddleware = (allowedRoles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado: permissão insuficiente', message: 'Acesso negado: permissão insuficiente' });
        }
        next();
    };
};

import { tenantContext } from '../lib/context.js';

export const tenantMiddleware = async (req: any, res: Response, next: NextFunction) => {
    if (req.user.role !== 'ADMIN_GLOBAL') {
        if (!req.user.clinicId) {
            return res.status(403).json({ error: 'Usuário sem clínica vinculada', message: 'Usuário sem clínica vinculada' });
        }
        req.clinicId = req.user.clinicId;
    }

    const clinicId = req.clinicId;
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    
    tenantContext.run({ clinicId, userId, ipAddress }, () => {
        next();
    });
};
