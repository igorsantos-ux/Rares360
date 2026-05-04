import { Request, Response } from 'express';
import { ProcedureService } from '../services/ProcedureService.js';
import prisma from '../lib/prisma.js';

export class ProcedureController {
    static async list(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const { page, limit, category, search } = req.query;
            const result = await ProcedureService.list(clinicId, {
                page: Number(page) || 1,
                limit: Number(limit) || 1000,
                category: category as string,
                search: search as string
            });

            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const item = await ProcedureService.create(clinicId, req.body);
            return res.status(201).json(item);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            const { id } = req.params;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const item = await ProcedureService.update(id, clinicId, req.body);
            return res.json(item);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            const { id } = req.params;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            await ProcedureService.delete(id, clinicId);
            return res.status(204).send();
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            const { id } = req.params;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const item = await ProcedureService.getById(id, clinicId);
            if (!item) return res.status(404).json({ message: 'Procedimento não encontrado' });

            return res.json(item);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async listPending(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const result = await ProcedureService.listPending(clinicId);
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async getByPatient(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            const { patientId } = req.params;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const result = await ProcedureService.getByPatient(clinicId, patientId);
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async execute(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            const { id } = req.params;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const result = await ProcedureService.execute(id, clinicId);
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    // ═══════════════════════════════════════════════════
    // CATEGORIAS DE PROCEDIMENTO
    // ═══════════════════════════════════════════════════

    static async listCategorias(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const categorias = await prisma.categoriaProcedimento.findMany({
                where: { clinicId },
                include: { _count: { select: { procedimentos: true } } },
                orderBy: { nome: 'asc' }
            });
            return res.json(categorias);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao listar categorias' });
        }
    }

    static async createCategoria(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { nome, cor } = req.body;
            if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

            const categoria = await prisma.categoriaProcedimento.create({
                data: { clinicId, nome, cor }
            });
            return res.status(201).json(categoria);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao criar categoria' });
        }
    }

    static async updateCategoria(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { id } = req.params;
            const existing = await prisma.categoriaProcedimento.findFirst({ where: { id, clinicId } });
            if (!existing) return res.status(404).json({ error: 'Categoria não encontrada' });

            const updated = await prisma.categoriaProcedimento.update({
                where: { id },
                data: req.body
            });
            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao atualizar categoria' });
        }
    }

    static async deleteCategoria(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { id } = req.params;
            const existing = await prisma.categoriaProcedimento.findFirst({ where: { id, clinicId } });
            if (!existing) return res.status(404).json({ error: 'Categoria não encontrada' });

            await prisma.procedure.updateMany({
                where: { categoriaId: id, clinicId },
                data: { categoriaId: null }
            });
            await prisma.categoriaProcedimento.delete({ where: { id } });
            return res.json({ message: 'Categoria excluída' });
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao excluir categoria' });
        }
    }

    // ═══════════════════════════════════════════════════
    // INSUMOS VINCULADOS (ProcedimentoInsumo)
    // ═══════════════════════════════════════════════════

    static async listInsumos(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { procedureId } = req.params;

            const proc = await prisma.procedure.findFirst({ where: { id: procedureId, clinicId } });
            if (!proc) return res.status(404).json({ error: 'Procedimento não encontrado' });

            const insumos = await prisma.procedimentoInsumo.findMany({
                where: { procedimentoId: procedureId },
                include: {
                    itemEstoque: {
                        select: { id: true, name: true, currentStock: true, unit: true, unitCost: true, category: true }
                    }
                }
            });
            return res.json(insumos);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao listar insumos' });
        }
    }

    static async addInsumo(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { procedureId } = req.params;
            const { itemEstoqueId, quantidadePadrao = 1, obrigatorio = true } = req.body;

            if (!itemEstoqueId) return res.status(400).json({ error: 'itemEstoqueId é obrigatório' });

            const proc = await prisma.procedure.findFirst({ where: { id: procedureId, clinicId } });
            if (!proc) return res.status(404).json({ error: 'Procedimento não encontrado' });

            const item = await prisma.inventoryItem.findFirst({ where: { id: itemEstoqueId, clinicId } });
            if (!item) return res.status(404).json({ error: 'Item de estoque não encontrado' });

            const exists = await prisma.procedimentoInsumo.findFirst({
                where: { procedimentoId: procedureId, itemEstoqueId }
            });
            if (exists) return res.status(409).json({ error: 'Insumo já vinculado a este procedimento' });

            const insumo = await prisma.procedimentoInsumo.create({
                data: { procedimentoId: procedureId, itemEstoqueId, quantidadePadrao, obrigatorio },
                include: {
                    itemEstoque: {
                        select: { id: true, name: true, currentStock: true, unit: true, unitCost: true }
                    }
                }
            });
            return res.status(201).json(insumo);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao vincular insumo' });
        }
    }

    static async updateInsumo(req: Request, res: Response) {
        try {
            const { insumoId } = req.params;
            const { quantidadePadrao, obrigatorio } = req.body;

            const updated = await prisma.procedimentoInsumo.update({
                where: { id: insumoId },
                data: {
                    ...(quantidadePadrao !== undefined && { quantidadePadrao }),
                    ...(obrigatorio !== undefined && { obrigatorio })
                }
            });
            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao atualizar insumo' });
        }
    }

    static async removeInsumo(req: Request, res: Response) {
        try {
            const { insumoId } = req.params;
            await prisma.procedimentoInsumo.delete({ where: { id: insumoId } });
            return res.json({ message: 'Insumo desvinculado' });
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao remover insumo' });
        }
    }

    // ═══ CÁLCULO DE MARGEM ═══
    static async calcularMargem(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { procedureId } = req.params;

            const proc = await prisma.procedure.findFirst({
                where: { id: procedureId, clinicId },
                include: {
                    procedimentoInsumos: {
                        include: { itemEstoque: { select: { unitCost: true } } }
                    }
                }
            });
            if (!proc) return res.status(404).json({ error: 'Procedimento não encontrado' });

            const custoInsumos = proc.procedimentoInsumos.reduce((acc, ins) => {
                return acc + (Number(ins.quantidadePadrao) * (ins.itemEstoque.unitCost || 0));
            }, 0);

            const custoTotal = custoInsumos + proc.fixedCost + proc.variableCost;
            const precoVenda = proc.basePrice || proc.currentPrice || 0;
            const margem = precoVenda > 0 ? ((precoVenda - custoTotal) / precoVenda) * 100 : 0;

            return res.json({
                custoInsumos: Number(custoInsumos.toFixed(2)),
                custoFixo: proc.fixedCost,
                custoVariavel: proc.variableCost,
                custoTotal: Number(custoTotal.toFixed(2)),
                precoVenda,
                margem: Number(margem.toFixed(1)),
                lucro: Number((precoVenda - custoTotal).toFixed(2))
            });
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao calcular margem' });
        }
    }
}
