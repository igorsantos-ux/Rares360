import prisma from '../lib/prisma.js';
export class MedicalService {
    static async getProductivity(clinicId) {
        const doctors = await prisma.doctor.findMany({
            where: { clinicId },
            include: { transactions: { where: { type: 'INCOME' } } }
        });
        return doctors.map(doc => {
            const grossRevenue = doc.transactions.reduce((acc, t) => acc + t.amount, 0);
            const doctorPart = grossRevenue * doc.commission;
            const clinicPart = grossRevenue - doctorPart;
            return {
                id: doc.id,
                name: doc.name,
                specialty: doc.specialty,
                grossRevenue,
                doctorPart,
                clinicPart,
                commissionRate: doc.commission * 100
            };
        });
    }
    static async listDoctors(clinicId) {
        return await prisma.doctor.findMany({
            where: { clinicId },
            orderBy: { name: 'asc' }
        });
    }
    static async createDoctor(data) {
        return await prisma.doctor.create({
            data: {
                ...data,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                isActive: data.isActive !== undefined ? data.isActive : true,
                defaultDuration: data.defaultDuration || 30
            }
        });
    }
    static async updateDoctor(id, clinicId, data) {
        return await prisma.doctor.update({
            where: { id, clinicId },
            data: {
                ...data,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                commission: data.commission !== undefined ? Number(data.commission) : undefined,
                consultationValue: data.consultationValue !== undefined ? Number(data.consultationValue) : undefined,
                repasseValue: data.repasseValue !== undefined ? Number(data.repasseValue) : undefined,
                defaultDuration: data.defaultDuration !== undefined ? Number(data.defaultDuration) : undefined,
            }
        });
    }
    static async deleteDoctor(id, clinicId) {
        return await prisma.doctor.delete({
            where: { id, clinicId }
        });
    }
}
export class InventoryService {
    static async getStockStatus(clinicId) {
        const items = await prisma.inventoryItem.findMany({
            where: { clinicId }
        });
        const totalInventoryValue = items.reduce((acc, item) => acc + (item.currentStock * item.unitCost), 0);
        // Lógica Curva ABC (Simplificada por Valor de Estoque)
        const sortedItems = [...items].sort((a, b) => (b.currentStock * b.unitCost) - (a.currentStock * a.unitCost));
        let cumulativeValue = 0;
        return sortedItems.map(item => {
            const itemValue = item.currentStock * item.unitCost;
            cumulativeValue += itemValue;
            const totalValueSum = totalInventoryValue || 1;
            const percentage = (cumulativeValue / totalValueSum) * 100;
            let categoryABC = 'C';
            if (percentage <= 70)
                categoryABC = 'A';
            else if (percentage <= 90)
                categoryABC = 'B';
            return {
                ...item,
                totalValue: itemValue,
                status: item.currentStock <= item.minQuantity ? 'BELOW_MINIMUM' : 'OK',
                categoryABC
            };
        });
    }
    static async createStockItem(data) {
        const existingItem = await prisma.inventoryItem.findFirst({
            where: {
                name: { equals: data.name, mode: 'insensitive' },
                clinicId: data.clinicId
            }
        });
        if (existingItem) {
            return await prisma.inventoryItem.update({
                where: { id: existingItem.id },
                data: {
                    currentStock: existingItem.currentStock + Number(data.currentStock || data.quantity || 0),
                    minQuantity: Number(data.minQuantity),
                    unitCost: Number(data.unitCost),
                    category: data.category,
                    unit: data.unit,
                    supplier: data.supplier,
                    batch: data.batch,
                    expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
                    lastRestock: new Date()
                }
            });
        }
        return await prisma.inventoryItem.create({
            data: {
                ...data,
                expirationDate: data.expirationDate ? new Date(data.expirationDate) : null
            }
        });
    }
    static async registerMovement(data) {
        return await prisma.$transaction(async (tx) => {
            // 1. Criar o registro de movimentação
            const movement = await tx.stockMovement.create({
                data: {
                    itemId: data.itemId,
                    type: data.type,
                    quantity: data.quantity,
                    reason: data.reason,
                    date: data.date ? new Date(data.date) : new Date(),
                    clinicId: data.clinicId,
                    userId: data.userId,
                    importBatchId: data.importBatchId
                }
            });
            // 2. Buscar item atual para atualizar saldo
            const item = await tx.inventoryItem.findUnique({
                where: { id: data.itemId }
            });
            if (!item)
                throw new Error("Item não encontrado");
            // 3. Validar saldo negativo para saídas
            if (data.type === 'OUT' && item.currentStock < data.quantity) {
                if (!data.importBatchId) { // No caso de importação, não bloqueamos para permitir ajustes retroativos? 
                    // Melhor bloquear por segurança em ambos
                    throw new Error(`Saldo insuficiente para item ${item.name}. Estoque atual: ${item.currentStock}`);
                }
            }
            // 4. Calcular novo saldo
            const newQuantity = data.type === 'IN'
                ? item.currentStock + data.quantity
                : item.currentStock - data.quantity;
            // 5. Atualizar item
            await tx.inventoryItem.update({
                where: { id: data.itemId },
                data: {
                    currentStock: newQuantity,
                    lastRestock: data.type === 'IN' ? new Date() : item.lastRestock
                }
            });
            return movement;
        });
    }
    static async getMovementHistory(clinicId) {
        return await prisma.stockMovement.findMany({
            where: { clinicId },
            include: {
                item: { select: { name: true, unit: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }
}
