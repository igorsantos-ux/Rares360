import { Transaction, FinancialGoal } from '@prisma/client';
import prisma from '../lib/prisma.js';

export class CashFlowService {
    static async getMonthlyFlow(clinicId: string) {
        const transactions = await prisma.transaction.findMany({
            where: { clinicId }
        });

        const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

        // Projeção futura baseada em transações PENDING
        const futureIncome = transactions.filter(t => t.type === 'INCOME' && t.status === 'PENDING').reduce((acc, t) => acc + t.amount, 0);
        const futureExpense = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING').reduce((acc, t) => acc + t.amount, 0);

        return {
            income,
            expense,
            balance: income - expense,
            projections: {
                futureIncome,
                futureExpense,
                estimatedBalance: (income + futureIncome) - (expense + futureExpense)
            }
        };
    }

    static async getDRE(clinicId: string) {
        const transactions = await prisma.transaction.findMany({
            where: { clinicId }
        });

        const revenue = transactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);

        // Custos Variáveis (Ex: Procedimentos, Insumos)
        const variableCosts = transactions.filter(t => t.type === 'EXPENSE' && t.category === 'Variável').reduce((acc, t) => acc + t.amount, 0);

        // Margem de Contribuição
        const contributionMargin = revenue - variableCosts;

        // Despesas Fixas
        const fixedExpenses = transactions.filter(t => t.type === 'EXPENSE' && t.category === 'Fixo').reduce((acc, t) => acc + t.amount, 0);

        // Resultado Final (EBITDA simplificado)
        const netResult = contributionMargin - fixedExpenses;

        return {
            revenue,
            variableCosts,
            contributionMargin,
            fixedExpenses,
            netResult,
            marginPercent: revenue > 0 ? (contributionMargin / revenue) * 100 : 0
        };
    }
}

export class BillingService {
    static async getBillingAnalytics(clinicId: string) {
        const transactions = await prisma.transaction.findMany({
            where: {
                clinicId,
                type: 'INCOME',
                status: 'PAID'
            },
            include: {
                doctor: true
            }
        });

        const totalBilling = transactions.reduce((acc, t) => acc + t.amount, 0);

        // Por Médico
        const billingByDoctor = transactions.reduce((acc: any, t) => {
            const doctorName = t.doctor?.name || 'Clínica';
            acc[doctorName] = (acc[doctorName] || 0) + t.amount;
            return acc;
        }, {});

        // Por Categoria
        const billingByCategory = transactions.reduce((acc: any, t) => {
            const cat = t.category || 'Geral';
            acc[cat] = (acc[cat] || 0) + t.amount;
            return acc;
        }, {});

        return {
            totalBilling,
            byDoctor: Object.entries(billingByDoctor).map(([name, value]) => ({
                name,
                value,
                percent: totalBilling > 0 ? ((value as number) / totalBilling) * 100 : 0
            })),
            byCategory: Object.entries(billingByCategory).map(([name, value]) => ({
                name,
                value,
                percent: totalBilling > 0 ? ((value as number) / totalBilling) * 100 : 0
            }))
        };
    }
}

export class GoalService {
    static async getGoals(clinicId: string) {
        return await prisma.financialGoal.findMany({
            where: { clinicId }
        });
    }

    static async calculateSmartGoal(clinicId: string, targetProfit: number) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const transactions = await prisma.transaction.findMany({ where: { clinicId } });
        const revenue = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
        const currentProfit = revenue - expenses;

        const goal = await prisma.financialGoal.upsert({
            where: { id: `goal-${clinicId}-${month}-${year}-PROFIT` },
            update: { target: targetProfit, achieved: currentProfit },
            create: {
                id: `goal-${clinicId}-${month}-${year}-PROFIT`,
                month,
                year,
                target: targetProfit,
                achieved: currentProfit,
                type: 'PROFIT',
                clinicId
            }
        });

        const summary = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { clinicId, type: 'INCOME' }
        });
        const totalTransactions = await prisma.transaction.count({
            where: { clinicId, type: 'INCOME' }
        });
        const ticketMedio = totalTransactions > 0 ? (summary._sum.amount || 0) / totalTransactions : 0;

        const estimatedRevenueNeeded = targetProfit / 0.3;
        const proceduresNeeded = ticketMedio > 0 ? Math.ceil(estimatedRevenueNeeded / ticketMedio) : 0;

        return {
            goal,
            projections: {
                estimatedRevenueNeeded,
                proceduresNeeded,
                ticketMedio,
                message: `Para lucrar R$ ${targetProfit.toLocaleString('pt-BR')}, você precisa de aproximadamente ${proceduresNeeded} procedimentos.`
            }
        };
    }
}
