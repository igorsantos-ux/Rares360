import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export class PricingController {
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const { name, sellingPrice, totalCost, netProfit, profitMargin, cardFeePercentage, taxPercentage, fixedCost, commission, supplies } = req.body;
            const clinicId = (req as any).user.clinicId;

            if (!clinicId) {
                res.status(403).json({ error: 'Acesso negado. Clínica não identificada.' });
                return;
            }

            const simulation = await prisma.$transaction(async (tx) => {
                const newSimulation = await tx.pricingSimulation.create({
                    data: {
                        name,
                        sellingPrice: Number(sellingPrice),
                        totalCost: Number(totalCost),
                        netProfit: Number(netProfit),
                        profitMargin: Number(profitMargin),
                        cardFeePercentage: Number(cardFeePercentage),
                        taxPercentage: Number(taxPercentage),
                        fixedCost: Number(fixedCost),
                        commission: Number(commission),
                        clinicId
                    }
                });

                if (supplies && supplies.length > 0) {
                    await tx.pricingSupply.createMany({
                        data: supplies.map((supply: any) => ({
                            name: supply.name,
                            quantity: Number(supply.quantity),
                            cost: Number(supply.cost),
                            pricingSimulationId: newSimulation.id
                        }))
                    });
                }

                return newSimulation;
            });

            res.status(201).json({ message: 'Simulação de precificação salva com sucesso', simulation });
        } catch (error) {
            console.error('Erro ao salvar simulação de precificação:', error);
            res.status(500).json({ error: 'Erro interno ao salvar simulação.' });
        }
    }

    static async list(req: Request, res: Response): Promise<void> {
        try {
            const clinicId = (req as any).user.clinicId;

            if (!clinicId) {
                res.status(403).json({ error: 'Acesso negado. Clínica não identificada.' });
                return;
            }

            const simulations = await prisma.pricingSimulation.findMany({
                where: { clinicId },
                include: { supplies: true },
                orderBy: { updatedAt: 'desc' }
            });

            res.json(simulations);
        } catch (error) {
            console.error('Erro ao listar simulações de precificação:', error);
            res.status(500).json({ error: 'Erro interno ao listar simulações.' });
        }
    }

    static async diagnosis(req: Request, res: Response): Promise<void> {
        try {
            const clinicId = (req as any).user.clinicId;

            if (!clinicId) {
                res.status(403).json({ error: 'Acesso negado. Clínica não identificada.' });
                return;
            }

            const procedures = await prisma.procedurePricing.findMany({
                where: { clinicId },
                include: { supplies: true },
                orderBy: { name: 'asc' }
            });

            // Lógica de Diagnóstico Quantitativo (Markup Divisor)
            const diagnosis = procedures.map(proc => {
                const totalCost = proc.totalCost;
                const currentPrice = proc.currentPrice;
                const targetMargin = proc.targetMargin;

                const netProfit = currentPrice - totalCost;
                const currentMargin = currentPrice > 0 ? (netProfit / currentPrice) * 100 : 0;
                
                // Preço Sugerido = Custo / (1 - Margem Desejada%)
                const suggestedPrice = targetMargin < 100 ? totalCost / (1 - (targetMargin / 100)) : totalCost;

                return {
                    ...proc,
                    netProfit,
                    currentMargin,
                    suggestedPrice
                };
            });

            res.json(diagnosis);
        } catch (error) {
            console.error('Erro no diagnóstico de precificação:', error);
            res.status(500).json({ error: 'Erro ao processar diagnóstico de margens.' });
        }
    }

    static async upsertProcedure(req: Request, res: Response): Promise<void> {
        try {
            const { id, name, durationMinutes, totalCost, currentPrice, targetMargin, supplies } = req.body;
            const clinicId = (req as any).user.clinicId;

            if (!clinicId) {
                res.status(403).json({ error: 'Acesso negado.' });
                return;
            }

            const result = await prisma.$transaction(async (tx) => {
                // Limpeza reativa de supplies para atualização limpa
                if (id) {
                    await tx.pricingSupply.deleteMany({
                        where: { procedurePricingId: id }
                    });
                }

                const procedure = await tx.procedurePricing.upsert({
                    where: { id: id || 'new-procedure' }, // Fallback para evitar erro se id vier vazio
                    update: {
                        name,
                        durationMinutes: Number(durationMinutes),
                        totalCost: Number(totalCost),
                        currentPrice: Number(currentPrice),
                        targetMargin: Number(targetMargin)
                    },
                    create: {
                        name,
                        durationMinutes: Number(durationMinutes),
                        totalCost: Number(totalCost),
                        currentPrice: Number(currentPrice),
                        targetMargin: Number(targetMargin),
                        clinicId
                    }
                });

                if (supplies && supplies.length > 0) {
                    await tx.pricingSupply.createMany({
                        data: supplies.map((s: any) => ({
                            name: s.name,
                            quantity: Number(s.quantity),
                            cost: Number(s.cost),
                            procedurePricingId: procedure.id
                        }))
                    });
                }

                return procedure;
            });

            res.json({ message: 'Procedimento salvo com sucesso', procedure: result });
        } catch (error) {
            console.error('Erro ao salvar procedimento:', error);
            res.status(500).json({ error: 'Erro ao salvar procedimento e seus custos.' });
        }
    }

    static async deleteProcedure(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const clinicId = (req as any).user.clinicId;

            await prisma.procedurePricing.delete({
                where: { id, clinicId }
            });

            res.json({ message: 'Procedimento removido do diagnóstico.' });
        } catch (error) {
            console.error('Erro ao deletar procedimento:', error);
            res.status(500).json({ error: 'Erro ao remover procedimento.' });
        }
    }
}
