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
    static async createDoctor(data) {
        return await prisma.doctor.create({
            data: {
                name: data.name,
                specialty: data.specialty,
                commission: data.commission,
                clinicId: data.clinicId
            }
        });
    }
}
export class InventoryService {
    static async getStockStatus(clinicId) {
        const items = await prisma.inventoryItem.findMany({
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
            if (percentage <= 70)
                categoryABC = 'A';
            else if (percentage <= 90)
                categoryABC = 'B';
            return {
                ...item,
                totalValue: itemValue,
                status: item.quantity <= item.minQuantity ? 'BELOW_MINIMUM' : 'OK',
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
}
