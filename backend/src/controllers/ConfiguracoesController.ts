import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export class ConfiguracoesController {
    // ==========================================
    // CLINIC GLOBALS (Impostos e Custos Básicos)
    // ==========================================
    static async getGlobais(req: Request, res: Response) {
        const clinicId = (req as any).clinicId;
        try {
            const clinic = await prisma.clinic.findUnique({
                where: { id: clinicId },
                select: {
                    equiparacaoHospitalar: true,
                    custoMinutoSala: true,
                    regimeTributario: true
                }
            });
            return res.json(clinic);
        } catch (error) {
            console.error('Erro ao buscar configs globais:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    static async updateGlobais(req: Request, res: Response) {
        const clinicId = (req as any).clinicId;
        const { equiparacaoHospitalar, custoMinutoSala, regimeTributario } = req.body;
        try {
            const updated = await prisma.clinic.update({
                where: { id: clinicId },
                data: {
                    equiparacaoHospitalar,
                    custoMinutoSala,
                    regimeTributario
                }
            });
            return res.json({ message: 'Configurações atualizadas com sucesso', data: updated });
        } catch (error) {
            console.error('Erro ao atualizar configs globais:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    // ==========================================
    // IMPOSTOS DE EMISSÃO
    // ==========================================
    static async getImpostosEmissao(req: Request, res: Response) {
        const clinicId = (req as any).clinicId;
        try {
            const impostos = await prisma.impostoEmissao.findMany({
                where: { clinicId }
            });
            return res.json(impostos);
        } catch (error) {
            console.error('Erro ao buscar impostos:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    static async saveImpostosEmissao(req: Request, res: Response) {
        const clinicId = (req as any).clinicId;
        const { impostos } = req.body; // Array de { id?, tipoEmissao, percentual }
        
        try {
            // Em uma implementação real, poderíamos fazer um upsert ou delete/insert
            await prisma.impostoEmissao.deleteMany({ where: { clinicId } });
            
            if (impostos && impostos.length > 0) {
                await prisma.impostoEmissao.createMany({
                    data: impostos.map((i: any) => ({
                        clinicId,
                        tipoEmissao: i.tipoEmissao,
                        percentual: i.percentual
                    }))
                });
            }
            return res.json({ message: 'Impostos de emissão salvos com sucesso' });
        } catch (error) {
            console.error('Erro ao salvar impostos:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    // ==========================================
    // REGRAS DE REPASSE (Médicos)
    // ==========================================
    static async getRegrasRepasse(req: Request, res: Response) {
        const clinicId = (req as any).clinicId;
        try {
            const regras = await prisma.regraRepasseMedico.findMany({
                where: { clinicId },
                include: {
                    doctor: { select: { name: true } },
                    procedimento: { select: { name: true } },
                    categoria: { select: { nome: true } }
                }
            });
            return res.json(regras);
        } catch (error) {
            console.error('Erro ao buscar regras de repasse:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    static async createRegraRepasse(req: Request, res: Response) {
        const clinicId = (req as any).clinicId;
        const data = req.body;
        try {
            const regra = await prisma.regraRepasseMedico.create({
                data: {
                    ...data,
                    clinicId
                }
            });
            return res.status(201).json(regra);
        } catch (error) {
            console.error('Erro ao criar regra repasse:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    static async deleteRegraRepasse(req: Request, res: Response) {
        const clinicId = (req as any).clinicId;
        const { id } = req.params;
        try {
            await prisma.regraRepasseMedico.delete({
                where: { id, clinicId }
            });
            return res.json({ message: 'Regra removida' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    // ==========================================
    // REGRAS DE COMISSÃO (Equipe)
    // ==========================================
    static async getRegrasComissao(req: Request, res: Response) {
        const clinicId = (req as any).clinicId;
        try {
            const regras = await prisma.regraComissaoEquipe.findMany({
                where: { clinicId },
                include: {
                    user: { select: { name: true } },
                    procedimento: { select: { name: true } },
                    categoria: { select: { nome: true } },
                    produto: { select: { name: true } }
                }
            });
            return res.json(regras);
        } catch (error) {
            console.error('Erro ao buscar regras de comissão:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    static async createRegraComissao(req: Request, res: Response) {
        const clinicId = (req as any).clinicId;
        const data = req.body;
        try {
            const regra = await prisma.regraComissaoEquipe.create({
                data: {
                    ...data,
                    clinicId
                }
            });
            return res.status(201).json(regra);
        } catch (error) {
            console.error('Erro ao criar regra de comissão:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    static async deleteRegraComissao(req: Request, res: Response) {
        const clinicId = (req as any).clinicId;
        const { id } = req.params;
        try {
            await prisma.regraComissaoEquipe.delete({
                where: { id, clinicId }
            });
            return res.json({ message: 'Regra removida' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro interno' });
        }
    }
}
