import { Transaction } from '@prisma/client';
import prisma from '../lib/prisma.js';

export class FinancialService {
    static async getSummary() {
        const transactions: Transaction[] = await prisma.transaction.findMany();

        const revenue = transactions
            .filter((t: Transaction) => t.type === 'INCOME')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        const expenses = transactions
            .filter((t: Transaction) => t.type === 'EXPENSE')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        return {
            revenue,
            expenses,
            netProfit: revenue - expenses,
            margin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0
        };
    }

    static async getBreakEven() {
        const transactions: Transaction[] = await prisma.transaction.findMany();

        // Simplificado: Custos Fixos são os categorizados como 'Fixo'
        const fixedCosts = transactions
            .filter((t: Transaction) => t.type === 'EXPENSE' && t.category === 'Fixo')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        const variableCosts = transactions
            .filter((t: Transaction) => t.type === 'EXPENSE' && t.category !== 'Fixo')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        const totalSales = transactions
            .filter((t: Transaction) => t.type === 'INCOME')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        // Fórmula: Ponto de Equilíbrio = Custos Fixos / (1 - (Custos Variáveis / Vendas))
        const contributionMarginRatio = totalSales > 0 ? 1 - (variableCosts / totalSales) : 0;
        const breakEvenPoint = contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : 0;

        return {
            fixedCosts,
            variableCosts,
            totalSales,
            breakEvenPoint,
            progress: totalSales > 0 ? Math.min((totalSales / breakEvenPoint) * 100, 100) : 0,
            remaining: Math.max(breakEvenPoint - totalSales, 0)
        };
    }

    static async getEvolution() {
        // Obter os últimos 6 meses
        const evolution = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const monthTransactions = await prisma.transaction.findMany({
                where: {
                    date: {
                        gte: date,
                        lt: nextDate
                    }
                }
            });

            const income = monthTransactions
                .filter(t => t.type === 'INCOME')
                .reduce((acc, t) => acc + t.amount, 0);

            const expenses = monthTransactions
                .filter(t => t.type === 'EXPENSE')
                .reduce((acc, t) => acc + t.amount, 0);

            evolution.push({
                month: date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
                income,
                expenses,
                profit: income - expenses
            });
        }

        return evolution;
    }

    static async createTransaction(data: { amount: number; type: 'INCOME' | 'EXPENSE'; category: string; description: string; doctorId?: string; procedureName?: string; cost?: number; customerId?: string }) {
        return await prisma.transaction.create({
            data: {
                amount: data.amount,
                type: data.type,
                category: data.category,
                description: data.description,
                doctorId: data.doctorId || null,
                procedureName: data.procedureName || null,
                cost: data.cost ?? 0,
                customerId: data.customerId || null,
                date: new Date()
            }
        });
    }
}
