import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export class PatientController {
    static async list(req: any, res: Response) {
        try {
            let clinicId = req.clinicId || (req as any).user?.clinicId;

            if (!clinicId) {
                const firstClinic = await prisma.clinic.findFirst();
                if (!firstClinic) return res.status(401).json({ message: 'Clínica não identificada' });
                clinicId = firstClinic.id;
            }

            const patients = await prisma.patient.findMany({
                where: { clinicId },
                include: {
                    transactions: {
                        where: { type: 'INCOME' }
                    },
                    inventoryUsages: {
                        include: { inventoryItem: true }
                    }
                },
                orderBy: { fullName: 'asc' }
            });

            const analyticalPatients = patients.map(p => {
                // Cálculo de LTV (Pagos)
                const paidTransactions = p.transactions.filter(t => t.status === 'PAID' || t.status === 'RECEBIDO');
                const totalSpent = paidTransactions.reduce((acc, t) => acc + t.amount, 0);

                // Cálculo de Custos de Insumos
                const totalInventoryCost = p.inventoryUsages.reduce((acc, usage) => {
                    return acc + (usage.quantity * (usage.inventoryItem?.unitCost || 0));
                }, 0);

                // Margem de Rentabilidade
                const marginValue = totalSpent - totalInventoryCost;
                const marginPercentage = totalSpent > 0 ? (marginValue / totalSpent) * 100 : 0;

                const visitCount = p.transactions.length;

                const sortedTrans = [...p.transactions].sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return dateB - dateA;
                });
                const lastVisit = sortedTrans[0]?.date || null;

                const averageTicket = visitCount > 0 ? totalSpent / visitCount : 0;
                const procedures = Array.from(new Set(p.transactions.map(t => t.procedureName).filter(Boolean)));

                let classification = 'BRONZE';
                if (totalSpent >= 10000) classification = 'DIAMANTE';
                else if (totalSpent >= 5000) classification = 'OURO';
                else if (totalSpent >= 2000) classification = 'PRATA';

                return {
                    ...p,
                    totalSpent,
                    totalInventoryCost,
                    profitabilityMargin: marginPercentage,
                    isHighProfitability: marginPercentage > 70,
                    visitCount,
                    lastVisit,
                    averageTicket,
                    procedures,
                    classification
                };
            });

            const now = new Date();
            const thisMonth = now.getMonth();
            const birthdaysMonth = patients.filter(p => {
                if (!p.birthDate) return false;
                const bDate = new Date(p.birthDate);
                return bDate.getMonth() === thisMonth;
            }).length;

            const globalTotalSpent = analyticalPatients.reduce((acc, p) => acc + p.totalSpent, 0);
            const globalVisitCount = analyticalPatients.reduce((acc, p) => acc + p.visitCount, 0);
            const globalAvgTicket = globalVisitCount > 0 ? globalTotalSpent / globalVisitCount : 0;

            res.json({
                data: analyticalPatients,
                summary: {
                    totalPatients: patients.length,
                    monthlyBirthdays: birthdaysMonth,
                    averageClinicTicket: globalAvgTicket
                }
            });
        } catch (error: any) {
            console.error('Error listing patients:', error);
            res.status(500).json({ error: 'Erro ao listar pacientes' });
        }
    }

    static async getById(req: any, res: Response) {
        try {
            const { id } = req.params;
            const clinicId = req.clinicId || (req as any).user?.clinicId;

            const patient = await prisma.patient.findUnique({
                where: { id },
                include: {
                    transactions: { orderBy: { date: 'desc' }, take: 5 },
                    appointments: {
                        include: { professional: true, room: true, procedure: true },
                        orderBy: { startTime: 'desc' },
                        take: 5
                    },
                    evolutions: {
                        include: { professional: { select: { name: true } } },
                        orderBy: { date: 'desc' },
                        take: 5
                    },
                    prescriptions: { orderBy: { createdAt: 'desc' }, take: 5 },
                    inventoryUsages: { include: { inventoryItem: true }, take: 10 },
                    proposals: { orderBy: { createdAt: 'desc' }, take: 5 }
                }
            });

            if (!patient || patient.clinicId !== clinicId) {
                return res.status(404).json({ error: 'Paciente não encontrado' });
            }

            // Rentabilidade para o Header (Paciente de Alta Rentabilidade)
            const totalSpent = patient.transactions
                .filter(t => t.type === 'INCOME' && (t.status === 'PAID' || t.status === 'RECEBIDO' || t.status === 'PAGO'))
                .reduce((acc, t) => acc + t.amount, 0);

            const totalInventoryCost = patient.inventoryUsages.reduce((acc, usage) => {
                return acc + (usage.quantity * (usage.inventoryItem?.unitCost || 0));
            }, 0);

            const marginPercentage = totalSpent > 0 ? ((totalSpent - totalInventoryCost) / totalSpent) * 100 : 0;

            res.json({
                ...patient,
                analytics: {
                    totalSpent,
                    profitabilityMargin: marginPercentage,
                    isHighProfitability: marginPercentage > 70
                }
            });
        } catch (error: any) {
            console.error('Error getting patient:', error);
            res.status(500).json({ error: 'Erro ao buscar detalhes do paciente' });
        }
    }

    static async getDashboard(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const clinicId = (req as any).clinicId || (req as any).user?.clinicId;

            // 1. LTV (Somatório de todas as transações pagas)
            const ltvAggregate = await prisma.transaction.aggregate({
                where: {
                    patientId: id,
                    clinicId,
                    type: 'INCOME',
                    status: { in: ['PAID', 'RECEBIDO', 'PAGO'] }
                },
                _sum: { amount: true }
            });

            // 2. Última Consulta
            const lastTransaction = await prisma.transaction.findFirst({
                where: {
                    patientId: id,
                    clinicId,
                    type: 'INCOME'
                },
                orderBy: { date: 'desc' }
            });

            // 3. Próximo Agendamento
            const nextAppointment = await prisma.appointment.findFirst({
                where: {
                    patientId: id,
                    clinicId,
                    startTime: { gte: new Date() },
                    status: { notIn: ['CANCELADO', 'FALTA'] }
                },
                include: { professional: true, procedure: true },
                orderBy: { startTime: 'asc' }
            });

            // 4. Dados Cadastrais Básicos
            const patient = await prisma.patient.findUnique({
                where: { id },
                select: {
                    fullName: true,
                    birthDate: true,
                    profession: true,
                    healthInsurance: true,
                    allergies: true,
                    historyOfAllergies: true,
                    phone: true,
                    email: true
                }
            });

            res.json({
                ltv: ltvAggregate._sum.amount || 0,
                lastVisit: lastTransaction ? {
                    date: lastTransaction.date,
                    procedure: lastTransaction.procedureName || lastTransaction.description
                } : null,
                nextAppointment: nextAppointment ? {
                    date: nextAppointment.startTime,
                    doctor: nextAppointment.professional.name,
                    procedure: nextAppointment.procedure?.name || 'Consulta'
                } : null,
                demographics: patient
            });
        } catch (error: any) {
            console.error('Error getting patient dashboard:', error);
            res.status(500).json({ error: 'Erro ao calcular dashboard do paciente' });
        }
    }

    static async getHistory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const clinicId = (req as any).clinicId || (req as any).user?.clinicId;

            const history = await prisma.transaction.findMany({
                where: {
                    patientId: id,
                    clinicId,
                    status: { in: ['PAID', 'RECEBIDO', 'PAGO'] }
                },
                orderBy: {
                    date: 'desc'
                },
                select: {
                    id: true,
                    date: true,
                    description: true,
                    procedureName: true,
                    amount: true,
                    paymentMethod: true,
                    category: true
                }
            });

            res.json(history);
        } catch (error: any) {
            console.error('Error getting patient history:', error);
            res.status(500).json({ error: 'Erro ao buscar histórico do paciente' });
        }
    }

    static async create(req: any, res: Response) {
        try {
            const clinicId = req.clinicId || (req as any).user?.clinicId;
            const data = req.body;

            const cleanData = { ...data };
            if (cleanData.weight === '') delete cleanData.weight;
            if (cleanData.height === '') delete cleanData.height;

            const patient = await prisma.patient.create({
                data: {
                    ...cleanData,
                    clinicId,
                    birthDate: data.birthDate ? new Date(data.birthDate) : null,
                    weight: cleanData.weight ? parseFloat(cleanData.weight) : null,
                    height: cleanData.height ? parseFloat(cleanData.height) : null,
                    smoker: data.smoker === true || data.smoker === 'true',
                    tags: Array.isArray(data.tags) ? data.tags : []
                }
            });

            res.status(201).json(patient);
        } catch (error: any) {
            console.error('Error creating patient:', error);
            res.status(500).json({ error: 'Erro ao criar paciente' });
        }
    }

    static async update(req: any, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;

            const cleanData = { ...data };
            const forbiddenFields = [
                'id', 'clinicId', 'transactions', 'createdAt', 'updatedAt',
                'totalSpent', 'visitCount', 'lastVisit', 'averageTicket',
                'procedures', 'classification', 'analytics', 'appointments',
                'evolutions', 'prescriptions', 'inventoryUsages', 'proposals'
            ];

            forbiddenFields.forEach(field => delete (cleanData as any)[field]);

            const updatePayload: any = {
                ...cleanData,
                smoker: data.smoker === true || data.smoker === 'true',
                weight: (data.weight !== undefined && data.weight !== '') ? parseFloat(data.weight) : null,
                height: (data.height !== undefined && data.height !== '') ? parseFloat(data.height) : null,
                tags: Array.isArray(data.tags) ? data.tags : undefined
            };

            if (data.birthDate) {
                updatePayload.birthDate = new Date(data.birthDate);
            } else if (data.birthDate === '') {
                updatePayload.birthDate = null;
            }

            const patient = await prisma.patient.update({
                where: { id },
                data: updatePayload
            });

            res.json(patient);
        } catch (error: any) {
            console.error('❌ Erro no update do paciente:', error);
            if (error.code === 'P2002') {
                return res.status(400).json({ error: 'Este CPF já está cadastrado para outro paciente.' });
            }
            res.status(500).json({ error: 'Erro interno ao atualizar paciente' });
        }
    }

    static async delete(req: any, res: Response) {
        try {
            const { id } = req.params;

            // Check for financial records before deleting
            const transactionCount = await prisma.transaction.count({
                where: { patientId: id }
            });

            if (transactionCount > 0) {
                return res.status(400).json({
                    error: 'Não é possível excluir um paciente com histórico financeiro.',
                    details: 'Este paciente possui faturas atreladas. Recomenda-se apenas desativar o cadastro.'
                });
            }

            await prisma.patient.delete({ where: { id } });
            res.json({ message: 'Paciente excluído com sucesso' });
        } catch (error: any) {
            console.error('Error deleting patient:', error);
            res.status(500).json({ error: 'Erro ao excluir paciente' });
        }
    }
}

