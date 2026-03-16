import { Transaction } from '@prisma/client';
import prisma from '../lib/prisma.js';

export class FinancialService {
    static async getSummary(clinicId: string, startDate?: Date, endDate?: Date) {
        const where: any = { clinicId };
        
        if (startDate || endDate) {
            where.date = {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {})
            };
        }

        const transactions: Transaction[] = await prisma.transaction.findMany({
            where
        });

        const revenue = transactions
            .filter((t: Transaction) => t.type === 'INCOME')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        const currentExpenses = transactions
            .filter((t: Transaction) => t.type === 'EXPENSE')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        const pendingReceivables = transactions
            .filter((t: Transaction) => t.type === 'INCOME' && t.status === 'PENDING')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        const pendingPayables = transactions
            .filter((t: Transaction) => t.type === 'EXPENSE' && t.status === 'PENDING')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        return {
            revenue,
            expenses: currentExpenses,
            netProfit: revenue - currentExpenses,
            pendingReceivables,
            pendingPayables,
            margin: revenue > 0 ? ((revenue - currentExpenses) / revenue) * 100 : 0
        };
    }

    static async getBreakEven(clinicId: string, startDate?: Date, endDate?: Date) {
        const where: any = { clinicId };
        
        if (startDate || endDate) {
            where.date = {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {})
            };
        }

        const transactions: Transaction[] = await prisma.transaction.findMany({
            where
        });

        const fixedCosts = transactions
            .filter((t: Transaction) => t.type === 'EXPENSE' && t.category === 'Fixo')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        const variableCosts = transactions
            .filter((t: Transaction) => t.type === 'EXPENSE' && t.category !== 'Fixo')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        const totalSales = transactions
            .filter((t: Transaction) => t.type === 'INCOME')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

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

    static async getEvolution(clinicId: string) {
        const evolution = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const monthTransactions = await prisma.transaction.findMany({
                where: {
                    clinicId,
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

    static async createTransaction(data: {
        amount: number;
        type: 'INCOME' | 'EXPENSE';
        category: string;
        description: string;
        clinicId: string;
        doctorId?: string;
        procedureName?: string;
        cost?: number;
        patientId?: string;
        status?: string;
        paymentMethod?: string;
        netAmount?: number;
    }) {
        return await prisma.transaction.create({
            data: {
                amount: data.amount,
                netAmount: data.netAmount || data.amount,
                type: data.type,
                status: data.status || 'PAID',
                paymentMethod: data.paymentMethod || 'Outros',
                category: data.category,
                description: data.description,
                doctorId: data.doctorId || null,
                procedureName: data.procedureName || null,
                cost: data.cost ?? 0,
                patientId: data.patientId || null,
                clinicId: data.clinicId,
                date: new Date()
            }
        });
    }

    static async getTransactions(clinicId: string, startDate?: Date, endDate?: Date) {
        const where: any = { clinicId };
        
        if (startDate || endDate) {
            where.date = {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {})
            };
        }

        return await prisma.transaction.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                doctor: true,
                patient: true
            }
        });
    }
}
