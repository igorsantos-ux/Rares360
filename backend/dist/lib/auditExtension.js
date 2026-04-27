import { getClinicId, getUserId, getIpAddress } from './context.js';
export const auditExtension = (prisma) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    // Nós não auditamos o próprio histórico de auditoria
                    if (model === 'AuditLog') {
                        return query(args);
                    }
                    const auditableOperations = ['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany'];
                    if (!auditableOperations.includes(operation)) {
                        return query(args);
                    }
                    const clinicId = getClinicId();
                    const userId = getUserId();
                    const ipAddress = getIpAddress();
                    // Se não tiver clinicId garantido no contexto (ex: Scripts), não forçamos um log, 
                    // mas podemos opcionalmente logar clinic='SYSTEM'.
                    // Por se tratar de segurança, tentamos logar de qualquer forma.
                    const fallbackClinicId = clinicId || 'SYSTEM';
                    let oldValues = null;
                    // Captura de valores antigos para Update/Delete
                    if (['update', 'delete', 'updateMany', 'deleteMany'].includes(operation)) {
                        try {
                            // Se tiver `where`, tentamos buscar o registro antes
                            if (args.where) {
                                // @ts-ignore
                                oldValues = await prisma[model].findMany({
                                    where: args.where,
                                    take: 1 // simplificação: focamos no primeiro em caso de updateMany
                                });
                                if (oldValues && oldValues.length > 0) {
                                    oldValues = oldValues[0];
                                }
                            }
                        }
                        catch (e) {
                            console.error(`AuditLog: Erro ao buscar oldValues para ${model}`, e);
                        }
                    }
                    // 1. Executa a query efetiva
                    const result = await query(args);
                    // 2. Registra o audit
                    try {
                        let actionType = 'UPDATE';
                        if (operation.includes('create'))
                            actionType = 'CREATE';
                        if (operation.includes('delete'))
                            actionType = 'DELETE';
                        let newValues = null;
                        if (actionType !== 'DELETE') {
                            newValues = operation.includes('Many') ? args.data : result;
                        }
                        let entityId = 'UNKNOWN';
                        if (result && result.id) {
                            entityId = result.id;
                        }
                        else if (oldValues && oldValues.id) {
                            entityId = oldValues.id;
                        }
                        else if (args.where && args.where.id) {
                            entityId = args.where.id;
                        }
                        // Em operações Many sem retornar ids exatos, entityId fica UNKNOWN.
                        await prisma.auditLog.create({
                            data: {
                                clinicId: fallbackClinicId,
                                userId: userId || null,
                                action: actionType,
                                entity: model,
                                entityId: String(entityId),
                                oldValues: oldValues ? JSON.stringify(oldValues) : null,
                                newValues: newValues ? JSON.stringify(newValues) : null,
                                ipAddress: ipAddress || null,
                            }
                        });
                    }
                    catch (e) {
                        console.error(`AuditLog: Falha crítica ao salvar o log de ${model}`, e);
                    }
                    return result;
                }
            }
        }
    });
};
