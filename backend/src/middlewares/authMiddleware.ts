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
    // Para ADMIN_GLOBAL, permitimos sobrescrever o clinicId via header ou query para suporte/gestão
    let clinicId = req.headers['x-target-clinic-id'] || req.headers['x-clinic-id'] || req.query.targetClinicId;

    if (req.user.role !== 'ADMIN_GLOBAL') {
        // Se não for Admin Global, ignoramos qualquer tentativa de injeção de ID
        if (!req.user.clinicId) {
            return res.status(403).json({ error: 'Usuário sem clínica vinculada', message: 'Usuário sem clínica vinculada' });
        }
        clinicId = req.user.clinicId;
    }

    if (!clinicId && req.user.role !== 'ADMIN_GLOBAL') {
        return res.status(401).json({ error: 'Clinic ID não identificado', message: 'Clinic ID não identificado' });
    }

    // Se houver uma troca de contexto por um ADMIN_GLOBAL, registramos no log de auditoria
    if (req.user.role === 'ADMIN_GLOBAL' && clinicId && clinicId !== req.user.clinicId) {
        try {
            // Buscamos o nome da clínica para o log (opcional, melhora a leitura)
            const targetClinic = await prisma.clinic.findUnique({
                where: { id: clinicId as string },
                select: { name: true }
            });

            await prisma.adminAuditLog.create({
                data: {
                    adminId: req.user.id,
                    adminName: req.user.name,
                    targetClinicId: clinicId as string,
                    targetClinicName: targetClinic?.name || 'Clínica Desconhecida',
                    action: 'CONTEXT_SWITCH'
                }
            });
            
            console.log(`[AUDIT] Admin ${req.user.name} trocou contexto para clínica: ${targetClinic?.name}`);
        } catch (logError) {
            console.error('Erro ao gravar log de auditoria:', logError);
            // Seguimos em frente mesmo se o log falhar para não travar o sistema
        }
    }

    // Injeta o clinicId no req e no contexto global do AsyncLocalStorage
    req.clinicId = clinicId;
    
    tenantContext.run({ clinicId }, () => {
        next();
    });
};
