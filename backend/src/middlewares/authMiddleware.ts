import { Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const [, token] = authHeader.split(' ');

    const decoded = AuthService.verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.user = decoded;
    req.userId = decoded.id;
    next();
};

export const roleMiddleware = (allowedRoles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
        }
        next();
    };
};

export const tenantMiddleware = (req: any, res: Response, next: NextFunction) => {
    // Para ADMIN_GLOBAL, permitimos sobrescrever o clinicId via header para suporte/gestão
    const impersonatedClinicId = req.headers['x-clinic-id'];

    if (req.user.role === 'ADMIN_GLOBAL' && impersonatedClinicId) {
        req.clinicId = impersonatedClinicId;
        return next();
    }

    if (!req.user.clinicId && req.user.role !== 'ADMIN_GLOBAL') {
        return res.status(403).json({ error: 'Usuário sem clínica vinculada' });
    }

    // Injeta o clinicId do usuário logado
    req.clinicId = req.user.clinicId;
    next();
};
