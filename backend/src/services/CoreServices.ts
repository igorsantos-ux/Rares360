import { Transaction, Doctor, StockItem } from '@prisma/client';
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

    static async createDoctor(data: { name: string; specialty: string; commission: number; clinicId: string }) {
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
    static async getStockStatus(clinicId: string) {
        const items: StockItem[] = await prisma.stockItem.findMany({
            where: { clinicId }
        });

        const totalInventoryValue = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

        // Lógica Curva ABC (Simplificada por Valor de Estoque)
        const sortedItems = [...items].sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price));

        let cumulativeValue = 0;
        return sortedItems.map(item => {
            const itemValue = item.quantity * item.price;
            cumulativeValue += itemValue;
            const percentage = (cumulativeValue / totalInventoryValue) * 100;

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

    static async createStockItem(data: { name: string; quantity: number; minQuantity: number; price: number; category: string; clinicId: string }) {
        return await prisma.stockItem.create({
            data: {
                name: data.name,
                quantity: data.quantity,
                minQuantity: data.minQuantity,
                price: data.price,
                category: data.category,
                clinicId: data.clinicId
            }
        });
    }
}
