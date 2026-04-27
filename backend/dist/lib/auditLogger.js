import { basePrisma } from './prisma.js';
export const createAuditLog = async (data) => {
    const ip = data.req.realIp ||
        data.req.headers['cf-connecting-ip'] ||
        data.req.ip || 'unknown';
    const country = data.req.headers['cf-ipcountry'] || 'Unknown';
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
