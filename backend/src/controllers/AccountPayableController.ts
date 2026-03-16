import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { CashSecurity } from '../middleware/CashSecurity.js';

export class AccountPayableController {
    
    // Lista todas as Contas a Pagar (Parcelas individuais) com paginação e filtros
    static async list(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            if (!clinicId) {
                return res.status(401).json({ message: 'Clínica não identificada.' });
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

            // Filtro base
            let where: any = {
                accountPayable: { clinicId }
            };

            // Filtros rápidos por status de vencimento
            const todayISO = new Date().toISOString().split('T')[0]; // "2026-03-12"
            const nextDay = new Date();
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayISO = nextDay.toISOString().split('T')[0];

            // Filtros rápidos por status de vencimento
            if (filter === 'overdue') {
                where.status = 'PENDENTE';
                where.dueDate = { lt: new Date(todayISO) }; 
            } else if (filter === 'today') {
                where.status = 'PENDENTE';
                where.dueDate = {
                    gte: new Date(todayISO),
                    lt: new Date(nextDayISO)
                };
            } else if (filter === 'upcoming') {
                where.status = 'PENDENTE';
                where.dueDate = { gte: new Date(nextDayISO) };
            } else if (filter === 'pagas') {
                where.status = 'PAGO';
            }

            // Filtro de Data (startDate / endDate)
            if (startDate || endDate) {
                where.dueDate = {
                    ...(where.dueDate || {}),
                    ...(startDate ? { gte: new Date(startDate as string) } : {}),
                    ...(endDate ? { lte: new Date(endDate as string) } : {})
                };
            }

            // Busca por descrição ou fornecedor (se houver termo)
            if (search) {
                where.accountPayable = {
                    ...where.accountPayable,
                    OR: [
                        { description: { contains: String(search), mode: 'insensitive' } },
                        { supplierName: { contains: String(search), mode: 'insensitive' } }
                    ]
                };
            }

            // 1. Busca os itens paginados (Parcelas)
            const installments = await prisma.accountPayableInstallment.findMany({
                where,
                include: {
                    accountPayable: true
                },
                orderBy: [
                    { status: 'desc' }, // PENDENTE vem antes de PAGO alfabeticamente (desc)
                    { dueDate: 'asc' }  // Mais antigas primeiro dentro do mesmo status
                ],
                skip,
                take
            });

            // 2. Conta total para paginação
            const totalItems = await prisma.accountPayableInstallment.count({ where });

            // 3. Busca Totalizadores Globais
            let totalPending = 0;
            let totalOverdue = 0;
            let totalDueToday = 0;

            try {
                const allUnpaid = await prisma.accountPayableInstallment.findMany({
                    where: {
                        accountPayable: { clinicId },
                        status: { not: 'PAGO' } // PENDENTE, ATRASADO, etc.
                    },
                    select: { 
                        amount: true, 
                        dueDate: true,
                        accountPayable: {
                            select: { costCenter: true }
                        }
                    }
                });

                const costCenterMap: Record<string, number> = {};

                allUnpaid.forEach(inst => {
                    const instDateISO = inst.dueDate.toISOString().split('T')[0];
                    const amt = Number(inst.amount) || 0;
                    const center = inst.accountPayable?.costCenter || 'Geral';

                    totalPending += amt;

                    if (instDateISO < todayISO) {
                        totalOverdue += amt;
                    } else if (instDateISO === todayISO) {
                        totalDueToday += amt;
                    }

                    // Agrupamento para distribuição
                    costCenterMap[center] = (costCenterMap[center] || 0) + amt;
                });

                // Formatar Distribuição por Centro de Custo
                const distribution = Object.entries(costCenterMap).map(([name, value]) => ({
                    name,
                    value,
                    percentage: totalPending > 0 ? Number(((value / totalPending) * 100).toFixed(1)) : 0
                })).sort((a, b) => b.value - a.value);

                // --- 4. Busca Evolução Mensal (Comparativo por Centro de Custo) ---
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                
                const allRecent = await prisma.accountPayableInstallment.findMany({
                    where: {
                        accountPayable: { clinicId },
                        dueDate: { gte: sixMonthsAgo }
                    },
                    select: {
                        amount: true,
                        dueDate: true,
                        accountPayable: {
                            select: { costCenter: true }
                        }
                    },
                    orderBy: { dueDate: 'asc' }
                });

                const monthlyMap: Record<string, any> = {};

                allRecent.forEach(inst => {
                    const date = new Date(inst.dueDate);
                    const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
                    const center = inst.accountPayable?.costCenter || 'Geral';
                    const amt = Number(inst.amount) || 0;

                    if (!monthlyMap[monthKey]) {
                        monthlyMap[monthKey] = { month: monthKey };
                    }
                    
                    monthlyMap[monthKey][center] = (monthlyMap[monthKey][center] || 0) + amt;
                });

                const monthlyComparison = Object.values(monthlyMap);

                return res.json({
                    items: installments,
                    totalItems,
                    totalPages: Math.ceil(totalItems / Number(limit)),
                    currentPage: Number(page),
                    summary: {
                        totalPending,
                        totalOverdue,
                        totalDueToday,
                        costCenterDistribution: distribution,
                        monthlyComparison
                    }
                });
            } catch (summaryError) {
                console.error('Erro ao calcular resumo:', summaryError);
            }
        } catch (error: any) {
            console.error('Erro ao listar contas a pagar:', error);
            return res.status(500).json({ message: 'Erro interno ao buscar contas a pagar', error: error.message });
        }
    }

    // Cria uma Conta a Pagar (À vista ou Parcelada)
    static async create(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            if (!clinicId) {
                return res.status(401).json({ message: 'Clínica não identificada.', error: 'MISSING_CLINIC_ID' });
            }

            const {
                description,
                documentNumber,
                totalAmount,
                paymentMethod,
                isInstallment,
                installmentsCount,
                installmentInterval,
                supplierName,
                supplierCnpj,
                interestValue,
                penaltyValue,
                bank,
                observation,
                fileUrl,
                costCenter,
                costType,
                installments // Array de parcelas vindas do front
            } = req.body;

            if (!description || !totalAmount || !installments || !Array.isArray(installments) || installments.length === 0) {
                console.error('Campos obrigatórios de Contas a Pagar ausentes:', { description, totalAmount, installments });
                return res.status(400).json({ message: 'Dados incompletos. Informe descrição, valor e as parcelas.' });
            }

            // Obrigatoriedade de Centro de Custo e Tipo (v14.0)
            if (!costCenter || !costType) {
                return res.status(400).json({ message: 'Centro de Custo e Tipo de Custo são obrigatórios.' });
            }

            const result = await prisma.$transaction(async (tx) => {
                const account = await tx.accountPayable.create({
                    data: {
                        description,
                        documentNumber: documentNumber || null,
                        totalAmount: Number(totalAmount),
                        paymentMethod: paymentMethod || null,
                        isInstallment: Boolean(isInstallment),
                        installmentsCount: Number(installmentsCount) || 1,
                        installmentInterval: installmentInterval || null,
                        supplierName: supplierName || null,
                        supplierCnpj: supplierCnpj || null,
                        interestValue: Number(interestValue) || 0,
                        penaltyValue: Number(penaltyValue) || 0,
                        bank: bank || null,
                        observation: observation || null,
                        fileUrl: fileUrl || null,
                        costCenter: costCenter || null,
                        costType: costType || null,
                        status: 'PENDENTE',
                        clinicId
                    }
                });
 
                 const installmentsData = installments.map((inst: any, index: number) => {
                     return {
                         accountPayableId: account.id,
                         installmentNumber: inst.installmentNumber || (index + 1),
                         amount: Number(inst.amount),
                         dueDate: new Date(inst.dueDate),
                         status: inst.status || 'PENDENTE',
                         paidAt: inst.status === 'PAGO' ? new Date(inst.dueDate) : null,
                         paymentMethod: paymentMethod || null
                     };
                 });
 
                 await tx.accountPayableInstallment.createMany({
                     data: installmentsData
                 });

                return tx.accountPayable.findUnique({
                    where: { id: account.id },
                    include: { installments: true }
                });
            });

            return res.status(201).json(result);
            
        } catch (error: any) {
            console.error('Erro ao criar conta a pagar:', error);
            return res.status(500).json({ message: 'Erro ao cadastrar conta a pagar', error: error.message });
        }
    }

    // Atualiza o status de uma parcela
    static async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'].includes(status)) {
                return res.status(400).json({ message: 'Status inválido' });
            }

            const installment = await prisma.accountPayableInstallment.findUnique({
                where: { id }
            });

            if (!installment) return res.status(404).json({ message: 'Parcela não encontrada' });

            // Bloqueio se o dia estiver fechado
            const clinicId = (req as any).user?.clinicId;
            await CashSecurity.validateClosure(clinicId, installment.dueDate);

            const updated = await prisma.accountPayableInstallment.update({
                where: { id },
                data: { 
                    status,
                    paidAt: status === 'PAGO' ? new Date() : null
                }
            });

            return res.json(updated);
        } catch (error: any) {
            console.error('Erro ao atualizar status:', error);
            return res.status(500).json({ message: 'Erro ao atualizar status', error: error.message });
        }
    }

    // Exclui uma parcela
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Busca a parcela para ver se é a última da conta pai
            const installment = await prisma.accountPayableInstallment.findUnique({
                where: { id },
                select: { accountPayableId: true }
            });

            if (!installment) {
                return res.status(404).json({ message: 'Parcela não encontrada' });
            }

            const clinicId = (req as any).user?.clinicId;
            // Bloqueio se o dia estiver fechado (usando a data base da parcela)
            const installmentData = await prisma.accountPayableInstallment.findUnique({
                where: { id }
            });
            if (installmentData) {
                await CashSecurity.validateClosure(clinicId, installmentData.dueDate);
            }

            // Exclui a parcela
            await prisma.accountPayableInstallment.delete({
                where: { id }
            });

            // Verifica se ainda existem outras parcelas para a mesma conta
            const remaining = await prisma.accountPayableInstallment.count({
                where: { accountPayableId: installment.accountPayableId }
            });

            // Se não houver mais parcelas, exclui a conta pai
            if (remaining === 0) {
                await prisma.accountPayable.delete({
                    where: { id: installment.accountPayableId }
                });
            }

            return res.json({ message: 'Parcela excluída com sucesso' });
        } catch (error: any) {
            console.error('Erro ao excluir parcela:', error);
            return res.status(500).json({ message: 'Erro ao excluir parcela', error: error.message });
        }
    }

    // Exclui a conta pai e todas as suas parcelas (Cascateamento no Prisma)
    static async deleteSeries(req: Request, res: Response) {
        try {
            const { id } = req.params; // id da AccountPayable (conta pai)

            const account = await prisma.accountPayable.findUnique({
                where: { id },
                select: { id: true }
            });

            if (!account) {
                return res.status(404).json({ message: 'Conta não encontrada' });
            }

            // Exclui a conta pai (isso deletará as parcelas via Cascade no DB)
            await prisma.accountPayable.delete({
                where: { id }
            });

            return res.json({ message: 'Série de parcelas excluída com sucesso' });
        } catch (error: any) {
            console.error('Erro ao excluir série:', error);
            return res.status(500).json({ message: 'Erro ao excluir série', error: error.message });
        }
    }
}
