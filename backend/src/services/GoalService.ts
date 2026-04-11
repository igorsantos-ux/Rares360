import prisma from '../lib/prisma.js';
import { startOfMonth, endOfMonth, differenceInBusinessDays, addDays, getDay, isWeekend } from 'date-fns';

export class GoalService {
    private static getMonthYearKey(date: Date = new Date()): string {
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${m}-${y}`;
    }

    private static getBusinessDaysPassed(start: Date, end: Date): number {
        let count = 0;
        let cur = new Date(start);
        const today = new Date(end);
        today.setHours(0, 0, 0, 0);

        while (cur < today) {
            const day = cur.getDay();
            if (day !== 0 && day !== 6) count++;
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    }

    static async getStats(clinicId: string) {
        const now = new Date();
        const monthYear = this.getMonthYearKey(now);
        const firstDay = startOfMonth(now);
        const lastDay = endOfMonth(now);

        // 1. Busca ou cria a meta do mês
        let goal = await prisma.monthlyGoal.findUnique({
            where: { clinicId_monthYear: { clinicId, monthYear } }
        });

        if (!goal) {
            goal = await prisma.monthlyGoal.create({
                data: {
                    clinicId,
                    monthYear,
                    revenueTarget: 600000,
                    workingDays: 22
                }
            });
        }

        // 2. Faturamento Atual (Recebido/Pago)
        const transactions = await prisma.transaction.findMany({
            where: {
                clinicId,
                type: 'INCOME',
                status: { in: ['PAID', 'RECEBIDO', 'PAGO'] },
                date: { gte: firstDay, lte: lastDay }
            }
        });

        const currentRevenue = transactions.reduce((acc, t) => acc + (t.netAmount || t.amount), 0);
        
        // 3. Progresso
        const progress = Math.min((currentRevenue / goal.revenueTarget) * 100, 100);

        // 4. GAP
        const gap = Math.max(goal.revenueTarget - currentRevenue, 0);

        // 5. Ritmo Necessário
        const daysPassed = this.getBusinessDaysPassed(firstDay, now);
        const daysRemaining = Math.max(goal.workingDays - daysPassed, 0);
        const requiredPace = daysRemaining > 0 ? gap / daysRemaining : gap;

        // 6. Produtividade (Ticket)
        // Ticket Médio Dia
        const ticketMedioDia = daysPassed > 0 ? currentRevenue / daysPassed : 0;

        // Ticket Médio Paciente
        const uniquePatients = new Set(transactions.map(t => t.patientId).filter(Boolean)).size;
        
        // Se pacientes for 0, tentamos buscar o ticket histórico dos últimos 3 meses
        let ticketPorPaciente = uniquePatients > 0 ? currentRevenue / uniquePatients : 0;
        
        if (ticketPorPaciente === 0) {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            
            const historicTransactions = await prisma.transaction.findMany({
                where: {
                    clinicId,
                    type: 'INCOME',
                    status: { in: ['PAID', 'RECEBIDO', 'PAGO'] },
                    date: { gte: threeMonthsAgo }
                }
            });

            const histRevenue = historicTransactions.reduce((acc, t) => acc + (t.netAmount || t.amount), 0);
            const histPatients = new Set(historicTransactions.map(t => t.patientId).filter(Boolean)).size;
            ticketPorPaciente = histPatients > 0 ? histRevenue / histPatients : 0;
        }

        // Faltam p/ Meta (Pacientes)
        const pacientesFaltantes = ticketPorPaciente > 0 ? Math.ceil(gap / ticketPorPaciente) : 0;

        const formatBRL = (val: number) => 
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

        return {
            monthYear,
            revenueTarget: goal.revenueTarget,
            workingDays: goal.workingDays,
            currentRevenue,
            currentRevenueFormatted: formatBRL(currentRevenue),
            progress: Math.round(progress),
            gap,
            gapFormatted: formatBRL(gap),
            requiredPace,
            requiredPaceFormatted: formatBRL(requiredPace),
            ticketMedioDia,
            ticketMedioDiaFormatted: formatBRL(ticketMedioDia),
            ticketPorPaciente,
            ticketPorPacienteFormatted: formatBRL(ticketPorPaciente),
            pacientesFaltantes,
            daysPassed,
            daysRemaining
        };
    }

    static async updateGoal(clinicId: string, data: { revenueTarget?: number; workingDays?: number; monthYear?: string }) {
        const monthYear = data.monthYear || this.getMonthYearKey();
        return await prisma.monthlyGoal.upsert({
            where: { clinicId_monthYear: { clinicId, monthYear } },
            update: {
                revenueTarget: data.revenueTarget,
                workingDays: data.workingDays
            },
            create: {
                clinicId,
                monthYear,
                revenueTarget: data.revenueTarget || 600000,
                workingDays: data.workingDays || 22
            }
        });
    }
}
