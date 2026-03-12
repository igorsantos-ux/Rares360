import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export class AccountPayableController {
    
    // Lista todas as Contas a Pagar (com parcelas)
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

            const accounts = await prisma.accountPayable.findMany({
                where: { clinicId },
                include: {
                    installments: {
                        orderBy: { dueDate: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let totalPending = 0;
            let totalOverdue = 0;
            let totalDueToday = 0;

            const allInstallments = accounts.flatMap(a => a.installments);

            // Calcula totalizadores e marca vencidos
            allInstallments.forEach(inst => {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0, 0, 0, 0);

                if (inst.status === 'PENDING') {
                    if (dueDate < today) {
                        inst.status = 'OVERDUE';
                    }
                }

                if (inst.status === 'PENDING' || inst.status === 'OVERDUE') {
                    const amt = Number(inst.amount) || 0;
                    totalPending += amt;

                    if (dueDate < today) {
                        totalOverdue += amt;
                    } else if (dueDate.getTime() === today.getTime()) {
                        totalDueToday += amt;
                    }
                }
            });

            return res.json({
                items: accounts,
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
                installments // Array de parcelas vindas do front
            } = req.body;

            if (!description || !totalAmount || !installments || !Array.isArray(installments) || installments.length === 0) {
                return res.status(400).json({ message: 'Dados incompletos. Informe descrição, valor e as parcelas.' });
            }

            // Usar uma transação para garantir a integridade da conta e suas parcelas
            const result = await prisma.$transaction(async (tx) => {
                
                // 1. Cria a Conta Pai
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
                        clinicId
                    }
                });

                // 2. Cria as parcelas
                const installmentsData = installments.map((inst: any, index: number) => {
                    return {
                        accountPayableId: account.id,
                        installmentNumber: inst.installmentNumber || (index + 1),
                        amount: Number(inst.amount),
                        dueDate: new Date(inst.dueDate),
                        status: inst.status || 'PENDING',
                        paymentMethod: paymentMethod || null // Herda da conta pai
                    };
                });

                await tx.accountPayableInstallment.createMany({
                    data: installmentsData
                });

                // Retorna a conta completa para o front
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
