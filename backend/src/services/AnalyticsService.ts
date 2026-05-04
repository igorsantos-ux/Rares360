import prisma from '../lib/prisma.js';

export class AnalyticsService {
    static async getDashboardInsights(clinicId: string) {
        // 1. Procedimento mais rentável
        const transactions = await prisma.transaction.findMany({
            where: { clinicId, type: 'INCOME', NOT: { procedureName: null } }
        });

        const procedureStats = transactions.reduce((acc: any, t) => {
            const name = t.procedureName!;
            if (!acc[name]) acc[name] = { name, revenue: 0, cost: 0, count: 0 };
            acc[name].revenue += Number(t.amount);
            acc[name].cost += Number(t.cost || 0);
            acc[name].count += 1;
            return acc;
        }, {});

        const sortedProcedures = Object.values(procedureStats)
            .map((p: any) => ({
                ...p,
                profit: p.revenue - p.cost,
                margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
                avgTicket: p.revenue / p.count
            }))
            .sort((a, b) => b.profit - a.profit);

        // 2. Pacientes que mais compram & Gestão de Pacientes
        const patients = await prisma.patient.findMany({
            where: { clinicId },
            include: {
                transactions: {
                    where: { type: 'INCOME', status: 'PAID' },
                    orderBy: { date: 'desc' },
                    take: 10
                }
            }
        });

        const patientInsights = patients.map(c => {
            const totalSpent = c.transactions.reduce((acc, t) => acc + Number(t.amount), 0);
            const lastValue = c.transactions[0]?.amount || 0;

            return {
                id: c.id,
                name: c.fullName,
                birthDate: c.birthDate,
                lastVisit: c.lastVisit || c.transactions[0]?.date || null,
                lastValue,
                totalSpent,
                count: c.transactions.length
            };
        }).sort((a, b) => b.totalSpent - a.totalSpent);

        // 3. Ticket Médio por Médico
        const doctors = await prisma.doctor.findMany({
            where: { clinicId },
            include: { transactions: { where: { type: 'INCOME' } } }
        });

        const doctorStats = doctors.map(d => {
            const total = d.transactions.reduce((acc, t) => acc + Number(t.amount), 0);
            return {
                name: d.name,
                avgTicket: d.transactions.length > 0 ? total / d.transactions.length : 0,
                totalRevenue: total,
                count: d.transactions.length
            };
        }).sort((a, b) => b.avgTicket - a.avgTicket);

        // 4. Análise de Leads (Geral ou por Clínica se implementado)
        const leads = await prisma.lead.findMany(); // Leads podem ser compartilhados ou vinculados
        const leadBySource = leads.reduce((acc: any, l) => {
            acc[l.source] = (acc[l.source] || 0) + 1;
            return acc;
        }, {});

        const leadByStatus = leads.reduce((acc: any, l) => {
            acc[l.status] = (acc[l.status] || 0) + 1;
            return acc;
        }, {});

        return {
            proceduresRentability: sortedProcedures,
            patientInsights: patientInsights.slice(0, 10), // Top 10 que mais compram
            doctorPerformance: doctorStats,
            leadsAnalytics: {
                bySource: Object.entries(leadBySource).map(([label, value]) => ({ label, value })),
                byStatus: Object.entries(leadByStatus).map(([label, value]) => ({ label, value })),
                total: leads.length
            }
        };
    }
}
