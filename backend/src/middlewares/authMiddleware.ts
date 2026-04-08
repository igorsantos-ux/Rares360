import { Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import prisma from '../lib/prisma.js';

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
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
    
    tenantContext.run({ clinicId }, () => {
        next();
    });
};
