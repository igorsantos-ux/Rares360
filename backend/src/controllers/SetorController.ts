import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { createAuditLog } from '../lib/auditLogger.js';

export class SetorController {

    static async list(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const setores = await prisma.setor.findMany({
                where: { clinicId, ativo: true },
                orderBy: { ordem: 'asc' },
                include: {
                    _count: { select: { itensEstoque: true } }
                }
            });
            return res.json(setores);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao listar setores' });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { nome, cor, icone, ordem } = req.body;

            const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const setor = await prisma.setor.create({
                data: { clinicId, nome, slug, cor, icone, ordem: ordem || 99 }
            });

            await createAuditLog({
                action: 'CREATE', userId, req, clinicId,
                entity: 'Setor', entityId: setor.id,
                newValues: { nome, cor, icone }
            });

            return res.status(201).json(setor);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao criar setor' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { id } = req.params;
            const { nome, cor, icone, ordem } = req.body;

            const setor = await prisma.setor.findFirst({ where: { id, clinicId } });
            if (!setor) return res.status(404).json({ error: 'Setor não encontrado' });

            const updated = await prisma.setor.update({
                where: { id },
                data: { nome, cor, icone, ordem }
            });

            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao atualizar setor' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { id } = req.params;

            const setor = await prisma.setor.findFirst({
                where: { id, clinicId },
                include: { _count: { select: { itensEstoque: true } } }
            });

            if (!setor) return res.status(404).json({ error: 'Setor não encontrado' });
            if (setor._count.itensEstoque > 0) {
                return res.status(400).json({ error: 'Não é possível excluir um setor que possui itens de estoque vinculados.' });
            }

            await prisma.setor.update({
                where: { id },
                data: { ativo: false }
            });

            return res.json({ message: 'Setor desativado com sucesso' });
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao deletar setor' });
        }
    }
}
