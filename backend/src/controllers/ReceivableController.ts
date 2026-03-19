import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { CashSecurity } from '../middleware/CashSecurity.js';

export class ReceivableController {
    
    // Lista todos os Recebimentos / Pendenciais com paginação e analytics
    // Listagem de recebíveis (Pendenciais)
    static async list(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            if (!clinicId) {
                return res.status(400).json({ message: 'Clínica não identificada.' });
            }

            const { 
                page = 1, 
                limit = 20, 
                filter, 
                search = '',
                startDate,
                endDate
            } = req.query;

            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString().split('T')[0];

            // Filtro base: Apenas Entradas (INCOME)
            let where: any = {
                clinicId,
                type: 'INCOME'
            };

            // Filtros rápidos
            if (filter === 'overdue') {
                where.status = { not: 'RECEBIDO' };
                where.dueDate = { lt: today }; 
            } else if (filter === 'today') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                where.status = { not: 'RECEBIDO' };
                where.dueDate = {
                    gte: today,
                    lt: tomorrow
                };
            } else if (filter === 'recebidos') {
                where.status = 'RECEBIDO';
            } else if (filter === 'pending') {
                where.status = 'PENDENTE';
            }

            // Filtro de Data (startDate / endDate)
            if (startDate || endDate) {
                where.dueDate = {
                    ...(where.dueDate || {}),
                    ...(startDate ? { gte: new Date(startDate as string) } : {}),
                    ...(endDate ? { lte: new Date(endDate as string) } : {})
                };
            }

            // Busca por descrição ou paciente
            if (search) {
                where.OR = [
                    { description: { contains: String(search), mode: 'insensitive' } },
                    { patient: { fullName: { contains: String(search), mode: 'insensitive' } } },
                    { procedureName: { contains: String(search), mode: 'insensitive' } }
                ];
            }

            // 1. Busca os itens paginados
            const transactions = await prisma.transaction.findMany({
                where,
                include: {
                    patient: { select: { id: true, fullName: true } },
                    doctor: { select: { id: true, name: true } },
                    procedureExecution: true
                },
                orderBy: [
                    { status: 'desc' }, // PENDENTE vem antes de RECEBIDO/PAID alfabeticamente? 
                    // No sistema o user quer RECEBIDO, PENDENTE, ATRASADO.
                    // PAID (R) vs PENDING (P). 
                    { dueDate: 'asc' }
                ],
                skip,
                take
            });

            // 2. Conta total
            const totalItems = await prisma.transaction.count({ where });

            // 3. Analytics Summary
            try {
                // Buscamos todas as transações de entrada para o summary analítico
                const allIncome = await prisma.transaction.findMany({
                    where: { clinicId, type: 'INCOME' },
                    select: { 
                        amount: true, 
                        dueDate: true, 
                        status: true, 
                        procedureName: true,
                        category: true,
                        date: true 
                    }
                });

                let totalPending = 0;
                let totalOverdue = 0;
                let totalReceivedMonth = 0;
                
                const currentMonth = today.getUTCMonth();
                const currentYear = today.getUTCFullYear();

                const procedureMap: Record<string, number> = {};
                const monthlyMap: Record<string, any> = {};

                // Preparar meses para o gráfico (últimos 6 meses)
                const monthKeys: string[] = [];
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
                    monthKeys.push(key);
                    monthlyMap[key] = { month: key };
                }

                allIncome.forEach(t => {
                    const amt = Number(t.amount) || 0;
                    const status = String(t.status).toUpperCase();
                    const dueDate = t.dueDate || t.date;
                    const procedure = t.procedureName || t.category || 'Geral';
                    
                    // Totais de Cards
                    if (status !== 'RECEBIDO' && status !== 'PAID') {
                        totalPending += amt;
                        if (dueDate && dueDate < today) {
                            totalOverdue += amt;
                        }
                    } else {
                        // Recebido no mês atual
                        const valDate = t.date || t.dueDate;
                        if (valDate && valDate.getUTCMonth() === currentMonth && valDate.getUTCFullYear() === currentYear) {
                            totalReceivedMonth += amt;
                        }
                    }

                    // Distribuição por Procedimento (Apenas Pendentes para o Donut, ou tudo? User pediu "procedureDistribution")
                    // Geralmente Donut de Pendenciais foca no que tem a receber.
                    if (status !== 'RECEBIDO' && status !== 'PAID') {
                        procedureMap[procedure] = (procedureMap[procedure] || 0) + amt;
                    }

                    // Comparativo Mensal (Evolução de Entradas)
                    if (dueDate) {
                        const mKey = dueDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
                        if (monthlyMap[mKey]) {
                            monthlyMap[mKey][procedure] = (monthlyMap[mKey][procedure] || 0) + amt;
                        }
                    }
                });

                const procedureDistribution = Object.entries(procedureMap).map(([name, value]) => ({
                    name,
                    value,
                    percentage: totalPending > 0 ? Number(((value / totalPending) * 100).toFixed(1)) : 0
                })).sort((a, b) => b.value - a.value);

                const monthlyComparison = Object.values(monthlyMap);

                return res.json({
                    items: transactions.map(t => ({
                        ...t,
                        status: MapStatus(t.status, t.dueDate, today)
                    })),
                    totalItems,
                    totalPages: Math.ceil(totalItems / Number(limit)),
                    summary: {
                        totalPending,
                        totalOverdue,
                        totalReceived: totalReceivedMonth,
                        procedureDistribution,
                        monthlyComparison
                    }
                });

            } catch (err) {
                console.error('Error in analytic summary:', err);
                return res.json({ items: transactions, totalItems, summary: {} });
            }

        } catch (error: any) {
            console.error('Error listing receivables:', error);
            return res.status(500).json({ message: 'Erro ao buscar pendenciais', error: error.message });
        }
    }

    // Cria um novo recebimento
    static async create(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            if (!clinicId) {
                return res.status(400).json({ message: 'Clínica não identificada para o lançamento.' });
            }
            const { 
                description, 
                patientId, 
                procedureName, 
                amount, 
                dueDate, 
                status = 'PENDENTE',
                fileUrl,
                category,
                paymentMethod
            } = req.body;

            if (!description || !amount || !dueDate) {
                console.error('Campos obrigatórios ausentes:', { description, amount, dueDate });
                return res.status(400).json({ message: 'Descrição, valor e data de vencimento são obrigatórios.' });
            }

            const transactionDate = new Date(dueDate);

            const transaction = await prisma.transaction.create({
                data: {
                    description,
                    amount: Number(amount),
                    netAmount: Number(amount),
                    type: 'INCOME',
                    status: status === 'RECEBIDO' ? 'PAID' : 'PENDING',
                    category: category || 'Procedimentos',
                    procedureName: procedureName || description || 'Geral',
                    paymentMethod: paymentMethod || 'Outros',
                    dueDate: transactionDate,
                    date: transactionDate, // Sincroniza com a data selecionada
                    fileUrl,
                    patientId,
                    clinicId: clinicId!
                }
            });

            return res.status(201).json(transaction);
        } catch (error: any) {
            console.error('--- CRITICAL ERROR: ReceivableController.create ---');
            console.error('Payload recebido:', req.body);
            console.error('ClinicId identificado:', (req as any).clinicId);
            console.error('Prisma Error:', error);
            return res.status(500).json({ 
                message: 'Erro ao criar lançamento de entrada', 
                error: error.message,
                details: error.code || 'UNKNOWN_ERROR'
            });
        }
    }

    // Atualiza status (Baixa rápida)
    static async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const clinicId = (req as any).clinicId;
            const trans = await prisma.transaction.findUnique({
                where: { id, clinicId }
            });

            if (!trans) return res.status(404).json({ error: 'Not found' });

            // Bloqueio se o dia estiver fechado
            await CashSecurity.validateClosure(clinicId, trans.date);

            const updated = await prisma.transaction.update({
                where: { id },
                data: { 
                    status: status === 'RECEBIDO' ? 'PAID' : 'PENDING',
                    date: status === 'RECEBIDO' ? new Date() : undefined
                }
            });

            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ message: 'Erro ao atualizar status', error: error.message });
        }
    }

    // Exclui
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const clinicId = (req as any).clinicId;
            const trans = await prisma.transaction.findUnique({
                where: { id, clinicId }
            });

            if (!trans) return res.status(404).json({ error: 'Not found' });

            // Bloqueio se o dia estiver fechado
            await CashSecurity.validateClosure(clinicId, trans.date);

            await prisma.transaction.delete({ where: { id } });
            return res.json({ message: 'Excluído com sucesso' });
        } catch (error: any) {
            return res.status(500).json({ message: 'Erro ao excluir', error: error.message });
        }
    }
}

// Funções Auxiliares
function MapStatus(status: string, dueDate: Date | null, today: Date) {
    const s = String(status).toUpperCase();
    if (s === 'PAID' || s === 'RECEBIDO') return 'RECEBIDO';
    if (dueDate && new Date(dueDate) < today) return 'ATRASADO';
    return 'PENDENTE';
}
