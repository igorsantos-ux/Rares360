import prisma from '../lib/prisma.js';
import { startOfMonth, endOfMonth } from 'date-fns';

export type GoalType = 'COMERCIAL' | 'ESTOQUE' | 'OPERACIONAL';

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

        // 1. Busca a meta PRINCIPAL do mês
        let primaryGoal = await prisma.monthlyGoal.findFirst({
            where: { clinicId, monthYear, isPrimary: true }
        });

        // Se não existir nenhuma meta para o mês, cria a padrão como principal
        if (!primaryGoal) {
            const existingAny = await prisma.monthlyGoal.findFirst({ where: { clinicId, monthYear } });
            
            if (!existingAny) {
                primaryGoal = await prisma.monthlyGoal.create({
                    data: {
                        clinicId,
                        monthYear,
                        name: 'Meta de Faturamento',
                        type: 'COMERCIAL',
                        isPrimary: true,
                        targetValue: 600000,
                        workingDays: 22
                    }
                });
            } else {
                // Se existem outras mas nenhuma principal (erro de integridade ou migração), 
                // tornamos a primeira comercial encontrada em principal
                const firstComercial = await prisma.monthlyGoal.findFirst({
                    where: { clinicId, monthYear, type: 'COMERCIAL' }
                });
                
                if (firstComercial) {
                    primaryGoal = await prisma.monthlyGoal.update({
                        where: { id: firstComercial.id },
                        data: { isPrimary: true }
                    });
                } else {
                    primaryGoal = existingAny; // Fallback
                }
            }
        }

        // 2. Faturamento Atual (Recebido/Pago) - Focamos em transações financeiras para a meta principal comercial
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
        const progress = primaryGoal.targetValue > 0 ? Math.min((currentRevenue / primaryGoal.targetValue) * 100, 100) : 0;

        // 4. GAP
        const gap = Math.max(primaryGoal.targetValue - currentRevenue, 0);

        // 5. Ritmo Necessário
        const daysPassed = this.getBusinessDaysPassed(firstDay, now);
        const daysRemaining = Math.max(primaryGoal.workingDays - daysPassed, 0);
        const requiredPace = daysRemaining > 0 ? gap / daysRemaining : gap;

        // 6. Produtividade (Ticket)
        const ticketMedioDia = daysPassed > 0 ? currentRevenue / daysPassed : 0;
        const uniquePatients = new Set(transactions.map(t => t.patientId).filter(Boolean)).size;
        
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

        const pacientesFaltantes = ticketPorPaciente > 0 ? Math.ceil(gap / ticketPorPaciente) : 0;

        const formatBRL = (val: number) => 
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

        return {
            id: primaryGoal.id,
            name: primaryGoal.name,
            monthYear,
            targetValue: primaryGoal.targetValue,
            workingDays: primaryGoal.workingDays,
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

    static async getMonthlyGoals(clinicId: string, monthYear: string) {
        return await prisma.monthlyGoal.findMany({
            where: { clinicId, monthYear },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }]
        });
    }

    static async saveGoal(clinicId: string, data: { 
        id?: string;
        name?: string;
        type?: GoalType;
        targetValue: number;
        workingDays?: number;
        monthYear: string;
        isPrimary?: boolean;
    }) {
        // Se esta meta está sendo definida como primária, desativamos as outras primárias do mês
        if (data.isPrimary) {
            await prisma.monthlyGoal.updateMany({
                where: { clinicId, monthYear: data.monthYear, isPrimary: true },
                data: { isPrimary: false }
            });
        }

        // Se for a primeira meta do mês, ela DEVE ser primária
        const existingCount = await prisma.monthlyGoal.count({
            where: { clinicId, monthYear: data.monthYear }
        });

        const isPrimary = existingCount === 0 ? true : (data.isPrimary ?? false);

        if (data.id) {
            return await prisma.monthlyGoal.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    type: data.type,
                    targetValue: data.targetValue,
                    workingDays: data.workingDays,
                    isPrimary: isPrimary
                }
            });
        }

        return await prisma.monthlyGoal.create({
            data: {
                clinicId,
                name: data.name || 'Nova Meta',
                type: data.type || 'COMERCIAL',
                targetValue: data.targetValue,
                workingDays: data.workingDays || 22,
                monthYear: data.monthYear,
                isPrimary: isPrimary
            }
        });
    }

    static async deleteGoal(clinicId: string, goalId: string) {
        const goal = await prisma.monthlyGoal.findUnique({ where: { id: goalId } });
        if (!goal || goal.clinicId !== clinicId) throw new Error('Meta não encontrada');
        
        if (goal.isPrimary) throw new Error('Não é possível excluir a meta principal do ciclo');

        return await prisma.monthlyGoal.delete({ where: { id: goalId } });

    static async getGoalsReport(clinicId: string) {
        const now = new Date();
        const monthYear = this.getMonthYearKey(now);
        const [month, year] = monthYear.split('-').map(Number);

        const goals = await prisma.monthlyGoal.findMany({
            where: { clinicId },
            orderBy: [{ monthYear: 'desc' }, { isPrimary: 'desc' }]
        });

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
        
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        let businessDaysRemaining = 0;
        for (let d = now.getDate() + 1; d <= lastDayOfMonth; d++) {
            const date = new Date(year, month - 1, d);
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDaysRemaining++;
        }

        return goals.map(goal => {
            const isCurrentMonth = goal.monthYear === monthYear;
            const isComercial = goal.type === 'COMERCIAL';
            
            const current = (isCurrentMonth && isComercial) ? actualFaturamento : 0;
            const target = goal.targetValue;
            const progress = target > 0 ? (current / target) * 100 : 0;

            return {
                id: goal.id,
                title: goal.name || (goal.isPrimary ? 'Meta Principal' : 'Objetivo'),
                type: goal.type,
                target: target,
                current: current,
                progress: Math.min(progress, 100),
                isPrimary: goal.isPrimary,
                monthYear: goal.monthYear,
                status: progress >= 100 ? 'CONCLUIDA' : 'EM_ANDAMENTO',
                remainingBusinessDays: isCurrentMonth ? businessDaysRemaining : 0
            };
        });
    }
}
