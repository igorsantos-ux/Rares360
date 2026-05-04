import { Transaction, Doctor, InventoryItem, MovementType } from '@prisma/client';
import prisma from '../lib/prisma.js';

export class MedicalService {
    static async getProductivity(clinicId: string) {
        const doctors = await prisma.doctor.findMany({
            where: { clinicId },
            include: { transactions: { where: { type: 'INCOME' } } }
        });

        return doctors.map(doc => {
            const commissionRate = Number(doc.commission);
            const grossRevenue = doc.transactions.reduce((acc, t) => acc + Number(t.amount), 0);
            const doctorPart = grossRevenue * commissionRate;
            const clinicPart = grossRevenue - doctorPart;

            return {
                id: doc.id,
                name: doc.name,
                specialty: doc.specialty,
                grossRevenue,
                doctorPart,
                clinicPart,
                commissionRate: commissionRate * 100
            };
        });
    }

    static async listDoctors(clinicId: string) {
        return await prisma.doctor.findMany({
            where: { clinicId },
            orderBy: { name: 'asc' }
        });
    }

    static async createDoctor(data: {
        name: string;
        specialty: string;
        commission: number;
        clinicId: string;
        crm?: string;
        phone?: string;
        isActive?: boolean;
        cpf?: string;
        birthDate?: Date | string;
        email?: string;
        crmUf?: string;
        rqe?: string;
        consultationValue?: number;
        repasseType?: string;
        repasseValue?: number;
        pixKey?: string;
        defaultDuration?: number;
        availability?: any;
    }) {
        return await prisma.doctor.create({
            data: {
                ...data,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                isActive: data.isActive !== undefined ? data.isActive : true,
                defaultDuration: data.defaultDuration || 30
            } as any
        });
    }

    static async updateDoctor(id: string, clinicId: string, data: any) {
        return await prisma.doctor.update({
            where: { id, clinicId },
            data: {
                ...data,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                commission: data.commission !== undefined ? Number(data.commission) : undefined,
                consultationValue: data.consultationValue !== undefined ? Number(data.consultationValue) : undefined,
                repasseValue: data.repasseValue !== undefined ? Number(data.repasseValue) : undefined,
                defaultDuration: data.defaultDuration !== undefined ? Number(data.defaultDuration) : undefined,
            } as any
        });
    }

    static async deleteDoctor(id: string, clinicId: string) {
        return await prisma.doctor.delete({
            where: { id, clinicId }
        });
    }
}

export class InventoryService {
    static async getStockStatus(clinicId: string) {
        const items: InventoryItem[] = await prisma.inventoryItem.findMany({
            where: { clinicId }
        });

        const totalInventoryValue = items.reduce((acc, item) => acc + (Number(item.currentStock) * Number(item.unitCost)), 0);

        // Lógica Curva ABC (Simplificada por Valor de Estoque)
        const sortedItems = [...items].sort((a, b) => (Number(b.currentStock) * Number(b.unitCost)) - (Number(a.currentStock) * Number(a.unitCost)));

        let cumulativeValue = 0;
        return sortedItems.map(item => {
            const currentStock = Number(item.currentStock);
            const unitCost = Number(item.unitCost);
            const minQuantity = Number(item.minQuantity);
            const itemValue = currentStock * unitCost;
            cumulativeValue += itemValue;
            const totalValueSum = totalInventoryValue || 1;
            const percentage = (cumulativeValue / totalValueSum) * 100;

            let categoryABC = 'C';
            if (percentage <= 70) categoryABC = 'A';
            else if (percentage <= 90) categoryABC = 'B';

            return {
                ...item,
                totalValue: itemValue,
                status: currentStock <= minQuantity ? 'BELOW_MINIMUM' : 'OK',
                categoryABC
            };
        });
    }

    static async createStockItem(data: any) {
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
                    currentStock: Number(existingItem.currentStock) + Number(data.currentStock || data.quantity || 0),
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

    static async registerMovement(data: {
        itemId: string,
        type: MovementType,
        quantity: number,
        reason: string,
        clinicId: string,
        date?: Date | string,
        userId?: string,
        importBatchId?: string
    }) {
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

            if (!item) throw new Error("Item não encontrado");

            // 3. Validar saldo negativo para saídas
            if (data.type === 'OUT' && Number(item.currentStock) < data.quantity) {
                if (!data.importBatchId) { // No caso de importação, não bloqueamos para permitir ajustes retroativos? 
                    // Melhor bloquear por segurança em ambos
                    throw new Error(`Saldo insuficiente para item ${item.name}. Estoque atual: ${Number(item.currentStock)}`);
                }
            }

            // 4. Calcular novo saldo
            const currentStock = Number(item.currentStock);
            const newQuantity = data.type === 'IN'
                ? currentStock + data.quantity
                : currentStock - data.quantity;

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

    static async getMovementHistory(clinicId: string) {
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
