import { Transaction, FinancialGoal } from '@prisma/client';
import prisma from '../lib/prisma.js';

export class CashFlowService {
    static async getMonthlyFlow(clinicId: string) {
        const today = new Date();
        const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const [payables, receivables] = await Promise.all([
            prisma.accountPayableInstallment.findMany({
                where: {
                    accountPayable: { clinicId },
                    dueDate: { gte: firstDayMonth, lte: lastDayMonth }
                },
                include: { accountPayable: true }
            }),
            prisma.transaction.findMany({
                where: {
                    clinicId,
                    type: 'INCOME',
                    dueDate: { gte: firstDayMonth, lte: lastDayMonth }
                },
                include: { patient: true }
            })
        ]);

        const normalizedPayables = payables.map(p => ({
            id: p.id,
            description: p.accountPayable.supplierName || p.accountPayable.description,
            category: p.accountPayable.costCenter || 'Operacional',
            amount: p.amount,
            date: p.dueDate,
            status: p.status,
            type: 'EXPENSE' as const
        }));

        const normalizedReceivables = receivables.map(r => ({
            id: r.id,
            description: r.patient?.fullName || r.description,
            category: r.category || 'Procedimento',
            amount: r.amount,
            date: r.dueDate || r.date,
            status: r.status,
            type: 'INCOME' as const
        }));

        const transactions = [...normalizedPayables, ...normalizedReceivables].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const totalIncomes = normalizedReceivables
            .filter(r => r.status === 'PAID')
            .reduce((acc, r) => acc + r.amount, 0);

        const totalExpenses = normalizedPayables
            .filter(p => p.status === 'PAGO')
            .reduce((acc, p) => acc + p.amount, 0);

        return {
            summary: {
                balance: totalIncomes - totalExpenses,
                totalIncomes,
                totalExpenses
            },
            transactions
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
            acc[t.category] = (acc[t.category] || 0) + t.amount;
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
