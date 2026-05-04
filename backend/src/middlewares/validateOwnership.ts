import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

/**
 * SEC-010: Middleware de Validação de Propriedade (IDOR Protection)
 * Garante que o recurso solicitado (por ID) pertence à clínica do usuário logado.
 * 
 * @param modelName O nome do modelo no Prisma (ex: 'patient', 'financialTransaction')
 * @param idParam O nome do parâmetro na rota (default: 'id')
 */
export const validateOwnership = (modelName: string, idParam = 'id') => {
    return async (req: any, res: Response, next: NextFunction) => {
        try {
            // ADMIN_GLOBAL bypasses tenant checks unless they are impersonating (handled by clinicId presence)
            if (req.user?.role === 'ADMIN_GLOBAL' && !req.clinicId) {
                return next();
            }

            const resourceId = req.params[idParam];
            if (!resourceId) {
                return res.status(400).json({ error: 'ID do recurso não fornecido.' });
            }

            const clinicId = req.clinicId;
            if (!clinicId) {
                return res.status(403).json({ error: 'Sessão inválida para acesso a dados específicos de clínica.' });
            }

            // Acesso dinâmico ao Prisma Model
            const model = (prisma as any)[modelName];
            if (!model) {
                console.error(`[SEC-010] Modelo Prisma '${modelName}' não encontrado na validação IDOR.`);
                return res.status(500).json({ error: 'Erro interno na validação de permissões.' });
            }

            // Verifica se o recurso existe e pertence à clínica
            const resource = await model.findFirst({
                where: {
                    id: resourceId,
                    clinicId: clinicId
                },
                select: { id: true }
            });

            if (!resource) {
                console.warn(`[SEC-010] Tentativa de acesso não autorizada a ${modelName}/${resourceId} por clinicId ${clinicId}`);
                return res.status(404).json({ error: 'Recurso não encontrado ou acesso negado.' });
            }

            next();
        } catch (error) {
            console.error('[SEC-010] Erro na validação de IDOR:', error);
            res.status(500).json({ error: 'Erro na verificação de permissões.' });
        }
    };
};
