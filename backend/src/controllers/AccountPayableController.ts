import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export class AccountPayableController {
    
    // Lista todas as Contas a Pagar (Parcelas individuais) com paginação e filtros
    static async list(req: Request, res: Response) {
        try {
            let clinicId = (req as any).user?.clinicId;
            if (!clinicId && (req as any).user?.role === 'ADMIN_GLOBAL') {
                const firstClinic = await prisma.clinic.findFirst();
                clinicId = firstClinic?.id;
            }

            if (!clinicId) {
                return res.status(401).json({ message: 'Clínica não identificada.' });
            }

            const { 
                page = 1, 
                limit = 20, 
                filter, 
                search = '' 
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
            if (filter === 'overdue') {
                where.status = 'PENDING';
                where.dueDate = { lt: today };
            } else if (filter === 'today') {
                where.status = 'PENDING';
                where.dueDate = {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                };
            } else if (filter === 'upcoming') {
                where.status = 'PENDING';
                where.dueDate = { gte: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
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
                orderBy: { dueDate: 'asc' },
                skip,
                take
            });

            // 2. Conta total para paginação
            const totalItems = await prisma.accountPayableInstallment.count({ where });

            // 3. Busca Totalizadores Globais (Sem paginação/filtro de status para o resumo fixo)
            const allUnpaid = await prisma.accountPayableInstallment.findMany({
                where: {
                    accountPayable: { clinicId },
                    status: 'PENDING'
                },
                select: { amount: true, dueDate: true }
            });

            let totalPending = 0;
            let totalOverdue = 0;
            let totalDueToday = 0;

            allUnpaid.forEach(inst => {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const amt = Number(inst.amount) || 0;

                totalPending += amt;

                if (dueDate < today) {
                    totalOverdue += amt;
                } else if (dueDate.getTime() === today.getTime()) {
                    totalDueToday += amt;
                }
            });

            return res.json({
                items: installments,
                totalItems,
                totalPages: Math.ceil(totalItems / Number(limit)),
                currentPage: Number(page),
                summary: {
                    totalPending,
                    totalOverdue,
                    totalDueToday
                }
            });
        } catch (error: any) {
            console.error('Erro ao listar contas a pagar:', error);
            return res.status(500).json({ message: 'Erro interno ao buscar contas a pagar', error: error.message });
        }
    }

    // Cria uma Conta a Pagar (À vista ou Parcelada)
    static async create(req: Request, res: Response) {
        try {
            let clinicId = (req as any).user?.clinicId;
            if (!clinicId && (req as any).user?.role === 'ADMIN_GLOBAL') {
                const firstClinic = await prisma.clinic.findFirst();
                clinicId = firstClinic?.id;
            }

            if (!clinicId) {
                return res.status(401).json({ message: 'Clínica não identificada.' });
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
                return res.status(400).json({ message: 'Dados incompletos. Informe descrição, valor e as parcelas.' });
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
                        clinicId
                    }
                });

                const installmentsData = installments.map((inst: any, index: number) => {
                    return {
                        accountPayableId: account.id,
                        installmentNumber: inst.installmentNumber || (index + 1),
                        amount: Number(inst.amount),
                        dueDate: new Date(inst.dueDate),
                        status: inst.status || 'PENDING',
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
}
}
