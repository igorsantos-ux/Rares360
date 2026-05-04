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
            .reduce((acc, r) => acc + Number(r.amount), 0);

        const totalExpenses = normalizedPayables
            .filter(p => p.status === 'PAGO')
            .reduce((acc, p) => acc + Number(p.amount), 0);

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

        const revenue = transactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((acc, t) => acc + Number(t.amount), 0);

        // Custos Variáveis (Ex: Procedimentos, Insumos)
        const variableCosts = transactions.filter(t => t.type === 'EXPENSE' && t.category === 'Variável').reduce((acc, t) => acc + Number(t.amount), 0);

        // Margem de Contribuição
        const contributionMargin = revenue - variableCosts;

        // Despesas Fixas
        const fixedExpenses = transactions.filter(t => t.type === 'EXPENSE' && t.category === 'Fixo').reduce((acc, t) => acc + Number(t.amount), 0);

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
        const totalBilling = currentTransactions.reduce((acc, t) => acc + Number(t.amount), 0);
        const totalPreviousBilling = previousTransactions.reduce((acc, t) => acc + Number(t.amount), 0);

        const countCurrent = currentTransactions.length;
        const averageTicket = countCurrent > 0 ? totalBilling / countCurrent : 0;

        let growthPercentage = 0;
        if (totalPreviousBilling > 0) {
            growthPercentage = ((totalBilling - totalPreviousBilling) / totalPreviousBilling) * 100;
        } else if (totalBilling > 0) {
            growthPercentage = 100; // Crescimento infinito se anterior for 0
        }

        // --- CÁLCULO DA TIMELINE (BarChart) ---
        // Pre-preencher mapa para garantir os "zeros" no gráfico (dias sem vendas)
        const timelineMap: Record<string, { total: number, count: number }> = {};

        const iterDate = new Date(start);
        iterDate.setHours(0, 0, 0, 0);
        const loopEnd = new Date(end);
        loopEnd.setHours(23, 59, 59, 999);

        let iterations = 0;
        while (iterDate <= loopEnd && iterations < 400) {
            let key = '';
            if (groupBy === 'day') {
                key = `${String(iterDate.getDate()).padStart(2, '0')}/${String(iterDate.getMonth() + 1).padStart(2, '0')}`;
                iterDate.setDate(iterDate.getDate() + 1);
            } else if (groupBy === 'month') {
                key = iterDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
                iterDate.setMonth(iterDate.getMonth() + 1);
            } else {
                const weekNumber = Math.ceil(iterDate.getDate() / 7);
                key = `Sem ${weekNumber} - ${iterDate.toLocaleDateString('pt-BR', { month: 'short' })}`;
                iterDate.setDate(iterDate.getDate() + 7);
            }
            if (!timelineMap[key]) {
                timelineMap[key] = { total: 0, count: 0 };
            }
            iterations++;
        }

        currentTransactions.forEach(t => {
            let key = '';
            const d = new Date(t.date);
            if (groupBy === 'day') {
                key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            } else if (groupBy === 'month') {
                key = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
            } else {
                const weekNumber = Math.ceil(d.getDate() / 7);
                key = `Sem ${weekNumber} - ${d.toLocaleDateString('pt-BR', { month: 'short' })}`;
            }

            if (timelineMap[key]) {
                timelineMap[key].total += Number(t.amount);
                timelineMap[key].count += 1;
            } else {
                timelineMap[key] = { total: Number(t.amount), count: 1 };
            }
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
        const procMap: Record<string, { total: number, count: number }> = {};
        const doctorMap: Record<string, { total: number, count: number }> = {};
        const categoryMap: Record<string, { total: number, count: number }> = {}; // Top Categories
        const patientMap: Record<string, { value: number, count: number, name: string, id: string, avatarUrl: string | null }> = {};

        currentTransactions.forEach(t => {
            // Procedimentos
            const proc = t.procedureName || 'Sem Procedimento';
            if (!procMap[proc]) procMap[proc] = { total: 0, count: 0 };
            procMap[proc].total += Number(t.amount);
            procMap[proc].count += 1;

            // Médicos
            const doc = (t as any).doctorName || t.doctor?.name || 'Clínica';
            if (!doctorMap[doc]) doctorMap[doc] = { total: 0, count: 0 };
            doctorMap[doc].total += Number(t.amount);
            doctorMap[doc].count += 1;

            // Categorias (usaremos como Vendedores/Sellers proxy pois a regra de Vendedor não está clara no BD)
            const cat = t.category || 'Outros';
            if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
            categoryMap[cat].total += Number(t.amount);
            categoryMap[cat].count += 1;

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
                patientMap[pId].value += Number(t.amount);
                patientMap[pId].count += 1;
            }
        });

        const sortRank = (map: Record<string, { total: number, count: number }>) =>
            Object.entries(map)
                .map(([name, data]) => ({
                    name,
                    value: data.total,
                    count: data.count,
                    average: data.count > 0 ? data.total / data.count : 0
                }))
                .sort((a, b) => b.value - a.value);

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
                average: p.count > 0 ? p.value / p.count : 0,
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
            const origin = (t.patient?.origin || 'Outros').trim().toUpperCase();
            originMap[origin] = (originMap[origin] || 0) + 1;

            const pay = (t.paymentMethod || 'Não Informado').trim().toUpperCase();
            paymentMap[pay] = (paymentMap[pay] || 0) + Number(t.amount);
        });

        const buildDist = (map: Record<string, number>) =>
            Object.entries(map)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

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

    static async getDrillDown({ clinicId, type, value, startDate, endDate }: {
        clinicId: string;
        type: string;
        value: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate || now;

        // Build dynamic where clause based on drill-down type
        const baseWhere: any = {
            clinicId,
            type: 'INCOME',
            status: 'PAID',
            date: { gte: start, lte: end }
        };

        switch (type.toUpperCase()) {
            case 'PROCEDURE':
                baseWhere.procedureName = value;
                break;
            case 'DOCTOR':
                baseWhere.OR = [
                    { doctorName: value },
                    { doctor: { name: value } }
                ];
                break;
            case 'CATEGORY':
                baseWhere.category = value;
                break;
            case 'ORIGIN':
                baseWhere.patient = { origin: value };
                break;
            case 'PAYMENT_METHOD':
                baseWhere.paymentMethod = value;
                break;
            default:
                baseWhere.description = { contains: value, mode: 'insensitive' };
        }

        const transactions = await prisma.transaction.findMany({
            where: baseWhere,
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        photoUrl: true
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: 50
        });

        const total = transactions.reduce((acc, t) => acc + Number(t.amount), 0);
        const count = transactions.length;
        const averageTicket = count > 0 ? total / count : 0;

        return {
            summary: {
                total,
                count,
                averageTicket
            },
            items: transactions.map(t => ({
                id: t.id,
                date: t.date,
                description: t.description,
                procedureName: t.procedureName,
                doctorName: t.doctorName || t.doctor?.name || 'Clínica',
                patientName: t.patient?.fullName || 'N/A',
                patientId: t.patient?.id || null,
                patientPhone: (t.patient as any)?.phone || null,
                paymentMethod: t.paymentMethod || 'Não Informado',
                amount: Number(t.amount),
                status: t.status
            }))
        };
    }
}

