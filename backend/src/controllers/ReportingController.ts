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

            // Capturar parâmetros de data
            const { startDate, endDate } = req.query;
            const today = new Date();
            
            // Início do período (padrão 1º dia do mês atual)
            const start = startDate ? new Date(startDate as string) : new Date(today.getFullYear(), today.getMonth(), 1);
            // Fim do período (padrão último dia do mês atual)
            const end = endDate ? new Date(endDate as string) : new Date(today.getFullYear(), today.getMonth() + 1, 0);

            // 1. Contas a Pagar (Pendentes e Atrasadas - Sem filtro de data, tudo que deve)
            const unpaidInstallments = await prisma.accountPayableInstallment.aggregate({
                where: {
                    accountPayable: { clinicId },
                    status: { not: 'PAGO' }
                },
                _sum: { amount: true }
            });

            // 2. Despesas Totais (Período Selecionado)
            const periodExpenses = await prisma.accountPayableInstallment.aggregate({
                where: {
                    accountPayable: { clinicId },
                    dueDate: {
                        gte: start,
                        lte: end
                    }
                },
                _sum: { amount: true }
            });

            // 3. Receitas e Faturamento (Período Selecionado)
            const periodRevenue = await prisma.transaction.aggregate({
                where: {
                    clinicId,
                    type: 'INCOME',
                    date: {
                        gte: start,
                        lte: end
                    }
                },
                _sum: { amount: true }
            });

            const periodPaidRevenue = await prisma.transaction.aggregate({
                where: {
                    clinicId,
                    type: 'INCOME',
                    status: 'PAID',
                    date: {
                        gte: start,
                        lte: end
                    }
                },
                _sum: { amount: true }
            });

            const pendingRevenue = await prisma.transaction.aggregate({
                where: {
                    clinicId,
                    type: 'INCOME',
                    status: 'PENDING'
                },
                _sum: { amount: true }
            });

            // 4. Gráfico de Evolução Adaptativo
            const chartData = [];
            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
            
            let interval = 'month';
            if (diffDays <= 31) interval = 'day';
            else if (diffDays <= 90) interval = 'week';

            if (interval === 'day') {
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const current = new Date(d);
                    const next = new Date(d);
                    next.setDate(next.getDate() + 1);

                    const exp = await prisma.accountPayableInstallment.aggregate({
                        where: { accountPayable: { clinicId }, dueDate: { gte: current, lt: next } },
                        _sum: { amount: true }
                    });

                    const inc = await prisma.transaction.aggregate({
                        where: { clinicId, type: 'INCOME', date: { gte: current, lt: next } },
                        _sum: { amount: true }
                    });

                    chartData.push({
                        label: current.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                        receita: inc._sum.amount || 0,
                        despesa: exp._sum.amount || 0
                    });
                }
            } else if (interval === 'week') {
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
                    const current = new Date(d);
                    const next = new Date(d);
                    next.setDate(next.getDate() + 7);

                    const exp = await prisma.accountPayableInstallment.aggregate({
                        where: { accountPayable: { clinicId }, dueDate: { gte: current, lt: next } },
                        _sum: { amount: true }
                    });

                    const inc = await prisma.transaction.aggregate({
                        where: { clinicId, type: 'INCOME', date: { gte: current, lt: next } },
                        _sum: { amount: true }
                    });

                    chartData.push({
                        label: `W-${current.getDate()}/${current.getMonth() + 1}`,
                        receita: inc._sum.amount || 0,
                        despesa: exp._sum.amount || 0
                    });
                }
            } else {
                // Mensal (Padrão ou períodos longos)
                const startMonth = start.getMonth();
                const startYear = start.getFullYear();
                const endMonth = end.getMonth();
                const endYear = end.getFullYear();
                
                let curMonth = startMonth;
                let curYear = startYear;

                while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
                    const first = new Date(curYear, curMonth, 1);
                    const last = new Date(curYear, curMonth + 1, 0);

                    const exp = await prisma.accountPayableInstallment.aggregate({
                        where: { accountPayable: { clinicId }, dueDate: { gte: first, lte: last } },
                        _sum: { amount: true }
                    });

                    const inc = await prisma.transaction.aggregate({
                        where: { clinicId, type: 'INCOME', date: { gte: first, lte: last } },
                        _sum: { amount: true }
                    });

                    chartData.push({
                        label: first.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
                        receita: inc._sum.amount || 0,
                        despesa: exp._sum.amount || 0
                    });

                    curMonth++;
                    if (curMonth > 11) {
                        curMonth = 0;
                        curYear++;
                    }
                }
            }

            return res.json({
                cards: {
                    faturamentoTotal: periodRevenue._sum.amount || 0,
                    recebimentosLiquidos: periodPaidRevenue._sum.amount || 0,
                    contasAPagar: unpaidInstallments._sum.amount || 0,
                    contasAReceber: pendingRevenue._sum.amount || 0,
                    despesasTotais: periodExpenses._sum.amount || 0,
                    margin: 0
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
