import { Request, Response } from 'express';
import { CashFlowService, BillingService } from '../services/ReportingServices.js';
import { GoalService } from '../services/GoalService.js';
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
            const data = await GoalService.getGoalsReport(req.clinicId);
            res.json(data);
        } catch (error) {
            console.error('Erro getGoals Report:', error);
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

            // Buscar todos os dados no banco DE UMA VEZ
            const allExpenses = await prisma.accountPayableInstallment.findMany({
                where: {
                    accountPayable: { clinicId },
                    dueDate: { gte: start, lte: end }
                },
                select: { amount: true, dueDate: true }
            });

            const allIncomes = await prisma.transaction.findMany({
                where: {
                    clinicId,
                    type: 'INCOME',
                    date: { gte: start, lte: end }
                },
                select: { amount: true, date: true }
            });

            if (interval === 'day') {
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const current = new Date(d);
                    const next = new Date(d);
                    next.setDate(next.getDate() + 1);

                    const currentExp = allExpenses
                        .filter(e => e.dueDate && e.dueDate >= current && e.dueDate < next)
                        .reduce((sum, e) => sum + e.amount, 0);

                    const currentInc = allIncomes
                        .filter(i => i.date >= current && i.date < next)
                        .reduce((sum, i) => sum + i.amount, 0);

                    chartData.push({
                        label: current.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                        receita: currentInc,
                        despesa: currentExp
                    });
                }
            } else if (interval === 'week') {
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
                    const current = new Date(d);
                    const next = new Date(d);
                    next.setDate(next.getDate() + 7);

                    const currentExp = allExpenses
                        .filter(e => e.dueDate && e.dueDate >= current && e.dueDate < next)
                        .reduce((sum, e) => sum + e.amount, 0);

                    const currentInc = allIncomes
                        .filter(i => i.date >= current && i.date < next)
                        .reduce((sum, i) => sum + i.amount, 0);

                    chartData.push({
                        label: `W-${current.getDate()}/${current.getMonth() + 1}`,
                        receita: currentInc,
                        despesa: currentExp
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

                    const currentExp = allExpenses
                        .filter(e => e.dueDate && e.dueDate >= first && e.dueDate <= last)
                        .reduce((sum, e) => sum + e.amount, 0);

                    const currentInc = allIncomes
                        .filter(i => i.date >= first && i.date <= last)
                        .reduce((sum, i) => sum + i.amount, 0);

                    chartData.push({
                        label: first.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
                        receita: currentInc,
                        despesa: currentExp
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
            // Nota: O método calculateSmartGoal na verdade deveria estar no novo GoalService se quisermos unificar, 
            // mas como é uma funcionalidade específica de projeção, por enquanto manteremos o erro ou removeremos 
            // se o ReportingServices.GoalService foi removido.
            // Para não quebrar, vou retornar vazio por ora ou redirecionar se implementado.
            res.json({ message: 'Funcionalidade em transição' });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getDrillDown(req: any, res: Response) {
        try {
            const { type, value, startDate, endDate } = req.query;

            if (!type || !value) {
                return res.status(400).json({ error: 'Parâmetros "type" e "value" são obrigatórios.' });
            }

            const data = await BillingService.getDrillDown({
                clinicId: req.clinicId,
                type: type as string,
                value: value as string,
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined
            });

            res.json(data);
        } catch (error: any) {
            console.error('Erro getDrillDown:', error);
            res.status(500).json({ error: 'Falha ao buscar detalhamento.' });
        }
    }
}
