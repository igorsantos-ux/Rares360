import { Transaction, Doctor, InventoryItem, MovementType } from '@prisma/client';
import prisma from '../lib/prisma.js';

export class MedicalService {
    static async getProductivity(clinicId: string) {
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
    }) {
        return await prisma.doctor.create({
            data: {
                name: data.name,
                specialty: data.specialty,
                commission: data.commission,
                clinicId: data.clinicId,
                crm: data.crm,
                phone: data.phone,
                isActive: data.isActive !== undefined ? data.isActive : true
            } as any
        });
    }

    static async updateDoctor(id: string, clinicId: string, data: any) {
        return await prisma.doctor.update({
            where: { id, clinicId },
            data: {
                name: data.name,
                specialty: data.specialty,
                commission: data.commission !== undefined ? Number(data.commission) : undefined,
                crm: data.crm,
                phone: data.phone,
                isActive: data.isActive
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

        const totalInventoryValue = items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);

        // Lógica Curva ABC (Simplificada por Valor de Estoque)
        const sortedItems = [...items].sort((a, b) => (b.quantity * b.unitCost) - (a.quantity * a.unitCost));

        let cumulativeValue = 0;
        return sortedItems.map(item => {
            const itemValue = item.quantity * item.unitCost;
            cumulativeValue += itemValue;
            const totalValueSum = totalInventoryValue || 1;
            const percentage = (cumulativeValue / totalValueSum) * 100;

            let categoryABC = 'C';
            if (percentage <= 70) categoryABC = 'A';
            else if (percentage <= 90) categoryABC = 'B';

            return {
                ...item,
                totalValue: itemValue,
                status: item.quantity <= item.minQuantity ? 'BELOW_MINIMUM' : 'OK',
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
                    quantity: existingItem.quantity + Number(data.quantity),
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
        userId?: string 
    }) {
        return await prisma.$transaction(async (tx) => {
            // 1. Criar o registro de movimentação
            const movement = await tx.stockMovement.create({
                data: {
                    itemId: data.itemId,
                    type: data.type,
                    quantity: data.quantity,
                    reason: data.reason,
                    clinicId: data.clinicId,
                    userId: data.userId
                }
            });

            // 2. Buscar item atual para atualizar saldo
            const item = await tx.inventoryItem.findUnique({
                where: { id: data.itemId }
            });

            if (!item) throw new Error("Item não encontrado");

            // 3. Validar saldo negativo para saídas
            if (data.type === 'SAIDA' && item.quantity < data.quantity) {
                throw new Error(`Saldo insuficiente. Estoque atual: ${item.quantity}`);
            }

            // 4. Calcular novo saldo
            const newQuantity = data.type === 'ENTRADA' 
                ? item.quantity + data.quantity 
                : item.quantity - data.quantity;

            // 5. Atualizar item
            await tx.inventoryItem.update({
                where: { id: data.itemId },
                data: { 
                    quantity: newQuantity,
                    lastRestock: data.type === 'ENTRADA' ? new Date() : item.lastRestock
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
