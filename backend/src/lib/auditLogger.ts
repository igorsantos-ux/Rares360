import { Request } from 'express';
import { basePrisma } from './prisma.js';

export const createAuditLog = async (data: {
    action: any; // AuditAction enum
    userId: string;
    req: Request;
    clinicId: string;
    entity: string;
    entityId: string;
    oldValues?: object;
    newValues?: object;
}) => {
    const ip = (data.req as any).realIp ||
               data.req.headers['cf-connecting-ip'] as string ||
               data.req.ip || 'unknown';

    const country = data.req.headers['cf-ipcountry'] as string || 'Unknown';
    const userAgent = data.req.headers['user-agent'] || 'Unknown';

    // Mesclar details (país e userAgent) no newValues ou mantê-los se já existirem
    const enrichedNewValues = {
        ...(data.newValues || {}),
        _meta: { country, userAgent }
    };

    return basePrisma.auditLog.create({
        data: {
            action: data.action,
            userId: data.userId,
            clinicId: data.clinicId,
            entity: data.entity,
            entityId: data.entityId,
            ipAddress: ip,
            oldValues: data.oldValues ? data.oldValues : undefined,
            newValues: enrichedNewValues,
            timestamp: new Date(),
        }
    });
};
