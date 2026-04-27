import prisma from '../lib/prisma.js';
export class AuditController {
    static async logSensitiveView(req, res) {
        try {
            const { entity, entityId, targetField } = req.body;
            const clinicId = req.clinicId || req.user?.clinicId;
            const userId = req.userId || req.user?.id || 'unknown';
            const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
            if (!entity || !entityId) {
                return res.status(400).json({ error: 'entity e entityId são obrigatórios' });
            }
            await prisma.auditLog.create({
                data: {
                    clinicId,
                    userId,
                    action: 'VIEW_SENSITIVE',
                    entity,
                    entityId,
                    ipAddress,
                    newValues: JSON.stringify({ visualizedField: targetField }),
                }
            });
            res.status(200).json({ message: 'Log registrado' });
        }
        catch (error) {
            console.error('AuditController: erro ao registrar VIEW_SENSITIVE', error);
            res.status(500).json({ error: 'Erro de auditoria' });
        }
    }
}
