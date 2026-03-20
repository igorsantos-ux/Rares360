import { Transaction, FinancialGoal } from '@prisma/client';
import prisma from '../lib/prisma.js';

export class CashFlowService {
    static async getMonthlyFlow(clinicId: string, startDate?: Date, endDate?: Date) {
        const today = new Date();
        const start = startDate || new Date(today.getFullYear(), today.getMonth(), 1);
        const end = endDate || new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const [payables, receivables] = await Promise.all([
            prisma.accountPayableInstallment.findMany({
                where: {
                    accountPayable: { clinicId },
                    dueDate: { gte: start, lte: end }
                },
                include: { accountPayable: true }
            }),
            prisma.transaction.findMany({
                where: {
                    clinicId,
                    type: 'INCOME',
                    dueDate: { gte: start, lte: end }
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

    static async getDRE(clinicId: string, startDate?: Date, endDate?: Date) {
        const where: any = { clinicId };
        
        if (startDate || endDate) {
            where.date = {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {})
            };
        }

        const transactions = await prisma.transaction.findMany({
            where
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
            revenue: revenue || 0,
            variableCosts: variableCosts || 0,
            contributionMargin: contributionMargin || 0,
            fixedExpenses: fixedExpenses || 0,
            netResult: netResult || 0,
            marginPercent: revenue > 0 ? (contributionMargin / revenue) * 100 : 0
        };
    }
}

interface BillingAnalyticsParams {
    clinicId: string;
    startDate?: Date;
    endDate?: Date;
    groupBy?: string; // 'day' | 'week' | 'month'
}

export class BillingService {
    static async getBillingAnalytics({ clinicId, startDate, endDate, groupBy = 'month' }: BillingAnalyticsParams) {
        
        // 1. Definir o período atual
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate || now;

        // 2. Definir o período ANTERIOR para cálculo de crescimento
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const prevStart = new Date(start.getTime() - diffTime);
        const prevEnd = new Date(end.getTime() - diffTime);

        // 3. Buscar transações do Período Atual (PAGAS)
        const currentTransactions = await prisma.transaction.findMany({
            where: {
                clinicId,
                type: 'INCOME',
                status: 'PAID',
                date: { gte: start, lte: end }
            },
            include: { doctor: true, patient: true }
        });

        // 4. Buscar transações do Período Anterior
        const previousTransactions = await prisma.transaction.findMany({
            where: {
                clinicId,
                type: 'INCOME',
                status: 'PAID',
                date: { gte: prevStart, lte: prevEnd }
            }
        });

        // --- CÁLCULOS DOS KPIs ---
        const totalBilling = currentTransactions.reduce((acc, t) => acc + t.amount, 0);
        const totalPreviousBilling = previousTransactions.reduce((acc, t) => acc + t.amount, 0);
        
        const countCurrent = currentTransactions.length;
        const averageTicket = countCurrent > 0 ? totalBilling / countCurrent : 0;
        
        let growthPercentage = 0;
        if (totalPreviousBilling > 0) {
            growthPercentage = ((totalBilling - totalPreviousBilling) / totalPreviousBilling) * 100;
        } else if (totalBilling > 0) {
            growthPercentage = 100; // Crescimento infinito se anterior for 0
        }

        // --- CÁLCULO DA TIMELINE (BarChart) ---
        // Agrupar por data (dia, semana, mês)
        const timelineMap: Record<string, { total: number, count: number }> = {};
        currentTransactions.forEach(t => {
            let key = '';
            const d = new Date(t.date);
            if (groupBy === 'day') {
                key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            } else if (groupBy === 'month') {
                key = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
            } else {
                // week fallback
                const weekNumber = Math.ceil(d.getDate() / 7);
                key = `Sem ${weekNumber} - ${d.toLocaleDateString('pt-BR', { month: 'short' })}`;
            }

            if (!timelineMap[key]) timelineMap[key] = { total: 0, count: 0 };
            timelineMap[key].total += t.amount;
            timelineMap[key].count += 1;
        });

        const timeline = Object.entries(timelineMap).map(([label, data]) => ({
            label,
            total: data.total,
            count: data.count
        }));

        // Melhor período para KPI
        let bestPeriod = { label: '---', value: 0 };
        if (timeline.length > 0) {
            const max = timeline.reduce((prev, current) => (prev.total > current.total) ? prev : current);
            bestPeriod = { label: max.label, value: max.total };
        }

        // --- CÁLCULOS DOS RANKINGS ---
        const procMap: Record<string, number> = {};
        const doctorMap: Record<string, number> = {};
        const categoryMap: Record<string, number> = {}; // Top Categories
        const patientMap: Record<string, { value: number, count: number, name: string, id: string, avatarUrl: string | null }> = {};
        
        currentTransactions.forEach(t => {
            // Procedimentos
            const proc = t.procedureName || 'Sem Procedimento';
            procMap[proc] = (procMap[proc] || 0) + t.amount;
            
            // Médicos
            const doc = t.doctor?.name || 'Clínica';
            doctorMap[doc] = (doctorMap[doc] || 0) + t.amount;

            // Categorias (usaremos como Vendedores/Sellers proxy pois a regra de Vendedor não está clara no BD)
            const cat = t.category || 'Outros';
            categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;

            // Pacientes (VIPs)
            if (t.patient) {
                const pId = t.patient.id;
                if (!patientMap[pId]) {
                    patientMap[pId] = {
                        id: pId,
                        name: t.patient.fullName,
                        avatarUrl: t.patient.photoUrl || null,
                        value: 0,
                        count: 0
                    };
                }
                patientMap[pId].value += t.amount;
                patientMap[pId].count += 1;
            }
        });

        const sortRank = (map: Record<string, number>) => 
            Object.entries(map)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10); // Top 10

        // Processando Ranking VIP e verificando Novo/Recorrente
        const patientIds = Object.keys(patientMap);
        let previousPurchasers = new Set<string>();
        if (patientIds.length > 0) {
            const previousTransactionsForPatients = await prisma.transaction.findMany({
                where: {
                    clinicId,
                    type: 'INCOME',
                    status: 'PAID',
                    patientId: { in: patientIds },
                    date: { lt: start } // Qualquer transação antes do período atual
                },
                select: { patientId: true }
            });
            previousPurchasers = new Set(previousTransactionsForPatients.map(t => t.patientId).filter(Boolean) as string[]);
        }

        const patientRankings = Object.values(patientMap)
            .map(p => ({
                name: p.name,
                value: p.value,
                count: p.count,
                id: p.id,
                avatarUrl: p.avatarUrl,
                isNew: !previousPurchasers.has(p.id)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 20); // Top 20 VIPs

        // --- DISTRIBUIÇÕES (Pie Charts) ---
        const originMap: Record<string, number> = {};
        const paymentMap: Record<string, number> = {};

        currentTransactions.forEach(t => {
            const origin = t.patient?.origin || 'Outros';
            originMap[origin] = (originMap[origin] || 0) + 1; // Usando Count para Origem (quantos pacientes vieram)
            
            const pay = t.paymentMethod || 'Não Informado';
            paymentMap[pay] = (paymentMap[pay] || 0) + t.amount; // Usando Faturamento para Formas de Recebimento
        });

        const buildDist = (map: Record<string, number>) => 
            Object.entries(map).map(([name, value]) => ({ name, value }));

        return {
            kpis: {
                totalBilling,
                averageTicket,
                bestPeriod,
                growthPercentage
            },
            timeline,
            rankings: {
                procedures: sortRank(procMap),
                doctors: sortRank(doctorMap),
                categories: sortRank(categoryMap),
                patients: patientRankings
            },
            distributions: {
                origins: buildDist(originMap),
                paymentMethods: buildDist(paymentMap)
            }
        };
    }
}

export class GoalService {
    static async getGoals(clinicId: string) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const goals = await prisma.financialGoal.findMany({
            where: { clinicId }
        });

        // Para metas de faturamento do mês atual, calculamos o progresso real
        const currentMonthFaturamento = await prisma.transaction.aggregate({
            where: {
                clinicId,
                type: 'INCOME',
                status: 'PAID',
                date: {
                    gte: new Date(year, month - 1, 1),
                    lte: new Date(year, month, 0, 23, 59, 59)
                }
            },
            _sum: { amount: true }
        });

        const actualFaturamento = currentMonthFaturamento._sum.amount || 0;
        const remainingBusinessDays = this.getRemainingBusinessDays();

        return goals.map(goal => {
            const isCurrentMonth = goal.month === month && goal.year === year;
            const isFaturamento = goal.type.toUpperCase() === 'FATURAMENTO' || goal.type.toUpperCase() === 'FINANCE';

            return {
                ...goal,
                current: (isCurrentMonth && isFaturamento) ? actualFaturamento : goal.achieved,
                remainingBusinessDays: isCurrentMonth ? remainingBusinessDays : 0,
                status: (goal.achieved >= goal.target) ? 'CONCLUIDA' : 'EM_ANDAMENTO'
            };
        });
    }

    private static getRemainingBusinessDays(): number {
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        let businessDays = 0;

        for (let day = today.getDate() + 1; day <= lastDayOfMonth; day++) {
            const date = new Date(today.getFullYear(), today.getMonth(), day);
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
                businessDays++;
            }
        }
        return Math.max(businessDays, 0);
    }

    static async calculateSmartGoal(clinicId: string, targetProfit: number) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const transactions = await prisma.transaction.findMany({ where: { clinicId } });
        const revenue = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0) || 0;
        const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0) || 0;
        const currentProfit = (revenue || 0) - (expenses || 0);

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
