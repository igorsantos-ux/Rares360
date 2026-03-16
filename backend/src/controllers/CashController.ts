import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CashController {
    static async checkStatus(req: any, res: Response) {
        try {
            const { date } = req.query;
            const clinicId = req.clinicId;

            if (!date) return res.status(400).json({ error: 'Data é obrigatória' });

            const targetDate = new Date(date as string);
            targetDate.setHours(0, 0, 0, 0);

            const closure = await prisma.dailyClosure.findUnique({
                where: {
                    clinicId_date: {
                        clinicId,
                        date: targetDate
                    }
                },
                include: {
                    closedBy: {
                        select: { name: true }
                    }
                }
            });

            if (!closure) {
                return res.json({ status: 'OPEN', message: 'Dia aberto para movimentações' });
            }

            res.json({
                status: closure.status,
                closureInfo: closure
            });
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    }

    static async closeDay(req: any, res: Response) {
        try {
            const { date } = req.body;
            const clinicId = req.clinicId;
            const userId = req.userId;

            if (!date) return res.status(400).json({ error: 'Data é obrigatória' });

            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);

            // 1. Verificar se já está fechado
            const existing = await prisma.dailyClosure.findUnique({
                where: { clinicId_date: { clinicId, date: targetDate } }
            });

            if (existing && existing.status === 'CLOSED') {
                return res.status(400).json({ error: 'O dia já está fechado' });
            }

            // 2. Buscar totais das transações do dia
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            const transactions = await prisma.transaction.findMany({
                where: {
                    clinicId,
                    date: {
                        gte: targetDate,
                        lt: nextDay
                    }
                }
            });

            const income = transactions
                .filter(t => t.type === 'INCOME')
                .reduce((acc, t) => acc + t.amount, 0);

            const expense = transactions
                .filter(t => t.type === 'EXPENSE')
                .reduce((acc, t) => acc + t.amount, 0);

            // 3. Buscar saldo inicial (do dia anterior fechado)
            const yesterday = new Date(targetDate);
            yesterday.setDate(yesterday.getDate() - 1);

            const lastClosure = await prisma.dailyClosure.findUnique({
                where: { clinicId_date: { clinicId, date: yesterday } }
            });

            const openingBalance = lastClosure ? lastClosure.closingBalance : 0;
            const closingBalance = openingBalance + income - expense;

            // 4. Criar ou atualizar fechamento
            const result = await prisma.dailyClosure.upsert({
                where: { clinicId_date: { clinicId, date: targetDate } },
                update: {
                    openingBalance,
                    totalIncomes: income,
                    totalExpenses: expense,
                    closingBalance,
                    status: 'CLOSED',
                    closedById: userId,
                    closedAt: new Date()
                },
                create: {
                    clinicId,
                    date: targetDate,
                    openingBalance,
                    totalIncomes: income,
                    totalExpenses: expense,
                    closingBalance,
                    status: 'CLOSED',
                    closedById: userId
                }
            });

            res.json(result);
        } catch (error) {
            console.error('Erro ao fechar dia:', error);
            res.status(500).json({ error: 'Erro interno ao realizar fechamento' });
        }
    }
}
