import prisma from '../lib/prisma.js';
export class InventoryUsageController {
    static async listByPatient(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const { patientId } = req.query;
            const usages = await prisma.inventoryUsage.findMany({
                where: {
                    clinicId,
                    patientId: String(patientId)
                },
                include: {
                    inventoryItem: { select: { name: true, unit: true, unitCost: true } },
                    appointment: { select: { startTime: true, procedure: { select: { name: true } } } }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(usages);
        }
        catch (error) {
            console.error('Error listing inventory usage:', error);
            res.status(500).json({ error: 'Erro ao listar uso de insumos' });
        }
    }
    static async registerUsage(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const userId = req.user?.id;
            const { patientId, inventoryItemId, quantity, appointmentId, reason } = req.body;
            // Transação Atômica: Registrar Uso + Baixar Estoque + Criar Movimentação
            const result = await prisma.$transaction(async (tx) => {
                // 1. Criar Uso
                const usage = await tx.inventoryUsage.create({
                    data: {
                        quantity: parseFloat(quantity),
                        inventoryItemId,
                        patientId,
                        appointmentId,
                        clinicId
                    }
                });
                // 2. Baixar Estoque
                await tx.inventoryItem.update({
                    where: { id: inventoryItemId },
                    data: {
                        currentStock: { decrement: parseFloat(quantity) }
                    }
                });
                // 3. Registrar Movimento de Saída (Auditoria)
                await tx.stockMovement.create({
                    data: {
                        type: 'OUT',
                        quantity: parseFloat(quantity),
                        reason: reason || `Uso clínico - Paciente ID: ${patientId}`,
                        itemId: inventoryItemId,
                        clinicId,
                        userId
                    }
                });
                return usage;
            });
            res.status(201).json(result);
        }
        catch (error) {
            console.error('Error registering inventory usage:', error);
            res.status(500).json({ error: 'Erro ao registrar baixa de insumo' });
        }
    }
}
