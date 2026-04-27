import { AuthService } from '../services/AuthService.js';
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido', message: 'Token não fornecido' });
    }
    const [, token] = authHeader.split(' ');
    try {
        const decoded = AuthService.verifyToken(token);
        if (!decoded) {
            // SEC-014: Nunca logar trechos do token
            return res.status(401).json({ error: 'Token inválido ou expirado', message: 'Token inválido ou expirado' });
        }
        req.user = decoded;
        req.userId = decoded.id;
        // Bloqueia rotas se precisar trocar a senha e a rota não for a de trocar a senha, me ou impersonate
        const isSafeRoute = req.originalUrl.includes('/auth/update-password') ||
            req.originalUrl.includes('/auth/me') ||
            req.originalUrl.includes('/saas/impersonate');
        if (decoded.mustChangePassword && !isSafeRoute) {
            return res.status(403).json({ error: 'Troca de senha obrigatória', requirePasswordChange: true });
        }
        next();
    }
    catch (err) {
        console.error('[AUTH] Erro no middleware de autenticação');
        return res.status(401).json({ error: 'Erro de autenticação' });
    }
};
export const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado: permissão insuficiente', message: 'Acesso negado: permissão insuficiente' });
        }
        next();
    };
};
import { tenantContext } from '../lib/context.js';
export const tenantMiddleware = async (req, res, next) => {
    if (req.user?.adminAccessContext?.clinicId) {
        req.clinicId = req.user.adminAccessContext.clinicId;
    }
    else if (req.user.role !== 'ADMIN_GLOBAL') {
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
