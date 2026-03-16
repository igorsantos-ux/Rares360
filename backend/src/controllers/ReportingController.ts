import { Request, Response } from 'express';
import { CashFlowService, GoalService, BillingService } from '../services/ReportingServices.js';
import { FinancialService } from '../services/FinancialService.js';
import prisma from '../lib/prisma.js';

export class ReportingController {
    static async getDashboardKPIs(req: any, res: Response) {
        try {
            const clinicId = req.clinicId;
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : undefined;
            const end = endDate ? new Date(endDate as string) : undefined;

            const summary = await FinancialService.getSummary(clinicId, start, end);
            const flow = await CashFlowService.getMonthlyFlow(clinicId, start, end);

            res.json({ ...summary, ...flow });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getCashFlow(req: any, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : undefined;
            const end = endDate ? new Date(endDate as string) : undefined;
            const data = await CashFlowService.getMonthlyFlow(req.clinicId, start, end);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getDRE(req: any, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : undefined;
            const end = endDate ? new Date(endDate as string) : undefined;
            const data = await CashFlowService.getDRE(req.clinicId, start, end);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getBillingAnalytics(req: any, res: Response) {
        try {
            const { startDate, endDate, groupBy } = req.query;
            const params = {
                clinicId: req.clinicId,
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
                groupBy: (groupBy as string) || 'month'
            };
            const data = await BillingService.getBillingAnalytics(params);
            res.json(data);
        } catch (error) {
            console.error('Erro getBillingAnalytics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getGoals(req: any, res: Response) {
        try {
            const data = await GoalService.getGoals(req.clinicId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getDashboardData(req: any, res: Response) {
        try {
            let clinicId = req.clinicId || (req as any).user?.clinicId;

            // Suporte para ADMIN_GLOBAL ver dados de uma clínica teste se não estiver vinculado
            if (!clinicId && (req as any).user?.role === 'ADMIN_GLOBAL') {
                const firstClinic = await prisma.clinic.findFirst();
                clinicId = firstClinic?.id;
            }

            if (!clinicId) return res.status(401).json({ message: 'Clínica não identificada' });

            const today = new Date();
            const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            // 1. Contas a Pagar (Pendentes e Atrasadas - Sem filtro de data, tudo que deve)
            const unpaidInstallments = await prisma.accountPayableInstallment.aggregate({
                where: {
                    accountPayable: { clinicId },
                    status: { not: 'PAGO' }
                },
                _sum: { amount: true }
            });

            // 2. Despesas Totais (Tudo do mês atual, independente do status)
            const monthExpenses = await prisma.accountPayableInstallment.aggregate({
                where: {
                    accountPayable: { clinicId },
                    dueDate: {
                        gte: firstDayMonth,
                        lte: lastDayMonth
                    }
                },
                _sum: { amount: true }
            });

            // 3. Receitas e Faturamento (Mês Atual)
            // Faturamento Total = Tudo gerado no mês (INCOME)
            const monthRevenue = await prisma.transaction.aggregate({
                where: {
                    clinicId,
                    type: 'INCOME',
                    dueDate: {
                        gte: firstDayMonth,
                        lte: lastDayMonth
                    }
                },
                _sum: { amount: true }
            });

            // Recebimentos Líquidos = Tudo RECEBIDO (PAID) no mês atual
            const monthPaidRevenue = await prisma.transaction.aggregate({
                where: {
                    clinicId,
                    type: 'INCOME',
                    status: 'PAID',
                    date: {
                        gte: firstDayMonth,
                        lte: lastDayMonth
                    }
                },
                _sum: { amount: true }
            });

            // Contas a Receber = Tudo que NÃO foi pago (TOTAL PENDENTE + ATRASADO)
            const pendingRevenue = await prisma.transaction.aggregate({
                where: {
                    clinicId,
                    type: 'INCOME',
                    status: 'PENDING'
                },
                _sum: { amount: true }
            });

            // 4. Gráfico de Evolução (Últimos 6 meses)
            const chartData = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const nextDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

                const expenses = await prisma.accountPayableInstallment.aggregate({
                    where: {
                        accountPayable: { clinicId },
                        dueDate: {
                            gte: date,
                            lt: nextDate
                        }
                    },
                    _sum: { amount: true }
                });

                const income = await prisma.transaction.aggregate({
                    where: {
                        clinicId,
                        type: 'INCOME',
                        dueDate: {
                            gte: date,
                            lt: nextDate
                        }
                    },
                    _sum: { amount: true }
                });

                chartData.push({
                    month: date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
                    receita: income._sum.amount || 0,
                    despesa: expenses._sum.amount || 0
                });
            }

            return res.json({
                cards: {
                    faturamentoTotal: monthRevenue._sum.amount || 0,
                    recebimentosLiquidos: monthPaidRevenue._sum.amount || 0,
                    contasAPagar: unpaidInstallments._sum.amount || 0,
                    contasAReceber: pendingRevenue._sum.amount || 0,
                    despesasTotais: monthExpenses._sum.amount || 0,
                    margin: 0 // Mock por enquanto
                },
                chartData
            });

        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            return res.json({
                cards: {
                    faturamentoTotal: 0,
                    recebimentosLiquidos: 0,
                    contasAPagar: 0,
                    contasAReceber: 0,
                    despesasTotais: 0,
                    margin: 0
                },
                chartData: []
            });
        }
    }

    static async postSmartGoal(req: any, res: Response) {
        try {
            const { targetProfit } = req.body;
            const data = await GoalService.calculateSmartGoal(req.clinicId, Number(targetProfit));
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
