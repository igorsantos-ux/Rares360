import { Transaction } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { TaskService } from './TaskService.js';

export class FinancialService {
    static async getSummary(clinicId: string, startDate?: Date, endDate?: Date) {
        const where: any = { clinicId };
        
        if (startDate || endDate) {
            where.date = {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {})
            };
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const [transactions, paidInstallments, pendingInstallments, goal] = await Promise.all([
            prisma.transaction.findMany({ where }),
            prisma.accountPayableInstallment.findMany({
                where: {
                    accountPayable: { clinicId },
                    status: 'PAGO',
                    paidAt: where.date || { gte: startOfMonth, lte: endOfMonth }
                },
                include: { accountPayable: true }
            }),
            prisma.accountPayableInstallment.findMany({
                where: {
                    accountPayable: { clinicId },
                    status: 'PENDENTE',
                    dueDate: where.date || { gte: startOfMonth, lte: endOfMonth }
                },
                include: { accountPayable: true }
            }),
            prisma.financialGoal.findFirst({
                where: {
                    clinicId,
                    month: (startDate || now).getMonth() + 1,
                    year: (startDate || now).getFullYear()
                }
            })
        ]);

        const normalizedPaidInstallments = paidInstallments.map(p => ({
            amount: p.amount,
            type: 'EXPENSE',
            status: 'PAID'
        }));

        const normalizedPendingInstallments = pendingInstallments.map(p => ({
            amount: p.amount,
            type: 'EXPENSE',
            status: 'PENDING'
        }));

        const incomeTransactions = transactions.filter((t: any) => t.type === 'INCOME');
        const expenseTransactions = transactions.filter((t: any) => t.type === 'EXPENSE');

        const grossRevenue = incomeTransactions.reduce((acc: number, t: any) => acc + t.amount, 0);
        const netRevenue = incomeTransactions.reduce((acc: number, t: any) => acc + (t.netAmount || t.amount), 0);
        const receivedRevenue = incomeTransactions
            .filter((t: any) => ['PAID', 'RECEBIDO', 'PAGO'].includes(t.status))
            .reduce((acc: number, t: any) => acc + (t.netAmount || t.amount), 0);
        
        const paidExpenses = expenseTransactions
            .filter((t: any) => ['PAID', 'RECEBIDO', 'PAGO'].includes(t.status))
            .reduce((acc: number, t: any) => acc + t.amount, 0) + 
            normalizedPaidInstallments.reduce((acc: number, t: any) => acc + t.amount, 0);

        const pendingExpenses = expenseTransactions
            .filter((t: any) => ['PENDING', 'PENDENTE'].includes(t.status))
            .reduce((acc: number, t: any) => acc + t.amount, 0) + 
            normalizedPendingInstallments.reduce((acc: number, t: any) => acc + t.amount, 0);

        const pendingReceivables = incomeTransactions
            .filter((t: any) => ['PENDING', 'PENDENTE'].includes(t.status))
            .reduce((acc: number, t: any) => acc + t.amount, 0);

        const uniquePatients = new Set(incomeTransactions.map((t: any) => t.patientId).filter(Boolean)).size;

        return {
            grossRevenue,
            netRevenue,
            receivedRevenue,
            revenue: grossRevenue, // Manter compatibilidade
            expenses: paidExpenses,
            netProfit: netRevenue - paidExpenses,
            pendingReceivables,
            pendingPayables: pendingExpenses,
            totalPatients: uniquePatients,
            goal: goal?.target || 600000, // Default 600k as requested if none found
            margin: netRevenue > 0 ? ((netRevenue - paidExpenses) / netRevenue) * 100 : 0
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

    static async getEvolution(clinicId: string, startDate?: Date, endDate?: Date) {
        const evolution = [];
        const now = new Date();
        const end = endDate || now;
        const start = startDate || new Date(end.getFullYear(), end.getMonth() - 6, 1);

        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        while (current <= end) {
            const date = new Date(current);
            const nextDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);

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
            current = nextDate;
        }

        return evolution;
    }

    static async getDailyEvolution(clinicId: string, startDate?: Date, endDate?: Date) {
        const dailyData = [];
        const now = new Date();
        const end = endDate || now;
        const start = startDate || new Date(end.getFullYear(), end.getMonth(), 1);
        
        const transactions = await prisma.transaction.findMany({
            where: {
                clinicId,
                type: 'INCOME',
                date: {
                    gte: start,
                    lte: end
                }
            },
            orderBy: { date: 'asc' }
        });

        const goal = await prisma.financialGoal.findFirst({
            where: {
                clinicId,
                month: start.getMonth() + 1,
                year: start.getFullYear()
            }
        });

        const target = goal?.target || 600000;
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const dailyTarget = target / 30; // Baseado em média mensal de 30 dias

        let accumulated = 0;
        let accumulatedTarget = 0;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

            const dayIncome = transactions
                .filter(t => t.date >= dayStart && t.date <= dayEnd)
                .reduce((acc, t) => acc + t.amount, 0);

            accumulated += dayIncome;
            accumulatedTarget += dailyTarget;

            dailyData.push({
                day: d.getDate(),
                date: d.toLocaleDateString('pt-BR'),
                income: dayIncome,
                accumulated,
                target: accumulatedTarget
            });
        }

        return dailyData;
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
        return await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
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

            // Se for faturamento de procedimento, criamos a execução pendente e gatilho de CRM
            if (data.type === 'INCOME' && data.category === 'Procedimentos' && data.patientId) {
                const procedure = await tx.procedure.findFirst({
                    where: { 
                        name: { equals: data.procedureName || data.description, mode: 'insensitive' },
                        clinicId: data.clinicId
                    }
                });

                await tx.procedureExecution.create({
                    data: {
                        clinicId: data.clinicId,
                        patientId: data.patientId,
                        procedureId: procedure?.id || null,
                        procedureName: data.procedureName || data.description,
                        transactionId: transaction.id,
                        status: 'PENDENTE',
                        billedAt: new Date()
                    }
                });

                // GATILHO CRM: Follow-up automático
                await TaskService.triggerFollowUp(data.clinicId, {
                    patientId: data.patientId,
                    procedureName: data.procedureName || data.description,
                    transactionDate: new Date()
                });
            }

            return transaction;
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

        const [transactions, paidInstallments] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: { date: 'desc' },
                include: {
                    doctor: true,
                    patient: true,
                    procedureExecution: true // Incluindo o status de execução
                }
            }),
            prisma.accountPayableInstallment.findMany({
                where: {
                    accountPayable: { clinicId },
                    status: 'PAGO',
                    paidAt: where.date
                },
                include: { accountPayable: true }
            })
        ]);

        const normalizedInstallments = paidInstallments.map(p => ({
            id: p.id,
            description: p.accountPayable.supplierName || p.accountPayable.description,
            amount: p.amount,
            type: 'EXPENSE',
            status: 'PAID',
            paymentMethod: p.paymentMethod || p.accountPayable.paymentMethod || 'Outros',
            category: p.accountPayable.costCenter || 'Geral',
            date: p.paidAt || p.dueDate,
            isInstallment: true
        }));

        return [...transactions, ...normalizedInstallments].sort(
            (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
}
