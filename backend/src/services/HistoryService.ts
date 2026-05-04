import prisma from '../lib/prisma.js';

export class HistoryService {
    static async getYearlySummary(year: number = 2026, clinicId: string) {
        const transactions = await prisma.transaction.findMany({
            where: {
                clinicId,
                date: {
                    gte: new Date(`${year}-01-01`),
                    lte: new Date(`${year}-12-31`)
                }
            }
        });

        // Agrupamento por mês
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        const monthlyData = monthNames.map((name, index) => {
            const monthTransactions = transactions.filter(t => t.date.getMonth() === index);
            const revenue = monthTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + Number(t.amount), 0);
            const expenses = monthTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + Number(t.amount), 0);
            return {
                name,
                revenue,
                expenses,
                profit: revenue - expenses
            };
        });

        return monthlyData;
    }

    static async getDetailedProcedures(clinicId: string) {
        return await prisma.transaction.findMany({
            where: {
                clinicId,
                type: 'INCOME',
                NOT: { procedureName: null }
            },
            include: {
                doctor: true,
                patient: true
            },
            orderBy: {
                date: 'desc'
            }
        });
    }

    static async getWeeklyAnalysis(month: number, clinicId: string, year: number = 2026) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const transactions = await prisma.transaction.findMany({
            where: {
                clinicId,
                date: {
                    gte: startDate,
                    lte: endDate
                },
                type: 'INCOME'
            }
        });

        // Agrupar por semanas (aproximadamente)
        const weeklyData = [
            { week: 'Semana 1', revenue: 0 },
            { week: 'Semana 2', revenue: 0 },
            { week: 'Semana 3', revenue: 0 },
            { week: 'Semana 4', revenue: 0 },
        ];

        transactions.forEach(t => {
            const day = t.date.getDate();
            const amount = Number(t.amount);
            if (day <= 7) weeklyData[0].revenue += amount;
            else if (day <= 14) weeklyData[1].revenue += amount;
            else if (day <= 21) weeklyData[2].revenue += amount;
            else weeklyData[3].revenue += amount;
        });

        return weeklyData;
    }
}
