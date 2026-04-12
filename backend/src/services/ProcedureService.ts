import prisma from '../lib/prisma.js';

export class ProcedureService {
    static calculateFinance(data: {
        fixedCost: number;
        variableCost: number;
        taxes: number;
        commission: number;
        basePrice: number;
    }) {
        const { fixedCost, variableCost, taxes, commission, basePrice } = data;

        const taxAmount = basePrice * (taxes / 100);
        const commissionAmount = basePrice * (commission / 100);
        const totalCost = fixedCost + variableCost + taxAmount + commissionAmount;
        
        const profit = basePrice - totalCost;
        const margin = basePrice > 0 ? (profit / basePrice) * 100 : 0;

        return {
            totalCost,
            profit,
            margin
        };
    }

    static async list(clinicId: string, params: {
        page?: number;
        limit?: number;
        category?: string;
        search?: string;
    }) {
        const { page = 1, limit = 10, category, search } = params;
        const skip = (page - 1) * limit;

        const where: any = { clinicId };

        if (category) {
            where.category = category;
        }

        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive'
            };
        }

        const [items, total] = await Promise.all([
            prisma.procedure.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.procedure.count({ where })
        ]);

        return {
            items: items.map(item => {
                const finance = this.calculateFinance({
                    fixedCost: item.fixedCost,
                    variableCost: item.variableCost,
                    taxes: item.taxes,
                    commission: item.commission,
                    basePrice: item.basePrice
                });
                return { ...item, ...finance };
            }),
            total,
            pages: Math.ceil(total / limit)
        };
    }

    static async create(clinicId: string, data: any) {
        const finance = this.calculateFinance({
            fixedCost: data.fixedCost || 0,
            variableCost: data.variableCost || 0,
            taxes: data.taxes || 0,
            commission: data.commission || 0,
            basePrice: data.basePrice || 0
        });

        return await prisma.procedure.create({
            data: {
                ...data,
                clinicId,
                totalCost: finance.totalCost,
                currentPrice: data.basePrice // Preço de venda praticado
            }
        });
    }

    static async update(id: string, clinicId: string, data: any) {
        const finance = this.calculateFinance({
            fixedCost: data.fixedCost || 0,
            variableCost: data.variableCost || 0,
            taxes: data.taxes || 0,
            commission: data.commission || 0,
            basePrice: data.basePrice || 0
        });

        return await prisma.procedure.update({
            where: { id, clinicId },
            data: {
                ...data,
                totalCost: finance.totalCost,
                currentPrice: data.basePrice
            }
        });
    }

    static async delete(id: string, clinicId: string) {
        return await prisma.procedure.delete({
            where: { id, clinicId }
        });
    }

    static async getById(id: string, clinicId: string) {
        const item = await prisma.procedure.findFirst({
            where: { id, clinicId }
        });

        if (!item) return null;

        const finance = this.calculateFinance({
            fixedCost: item.fixedCost,
            variableCost: item.variableCost,
            taxes: item.taxes,
            commission: item.commission,
            basePrice: item.basePrice
        });

        return { ...item, ...finance };
    }

    static async listPending(clinicId: string) {
        return await prisma.procedureExecution.findMany({
            where: { clinicId, status: 'PENDENTE' },
            include: { patient: true },
            orderBy: { billedAt: 'desc' }
        });
    }

    static async getByPatient(clinicId: string, patientId: string) {
        return await prisma.procedureExecution.findMany({
            where: { clinicId, patientId },
            orderBy: { billedAt: 'desc' }
        });
    }

    static async execute(id: string, clinicId: string) {
        return await prisma.procedureExecution.update({
            where: { id, clinicId },
            data: { 
                status: 'EXECUTADO',
                executedAt: new Date()
            }
        });
    }
}
