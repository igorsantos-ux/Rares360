/**
 * TermoController — Gestão de termos e documentos (upload e listagem)
 */
import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { createAuditLog } from '../lib/auditLogger.js';

export class TermoController {

    // ═══ LISTAR TERMOS (Modelos da Clínica) ═══
    static async listTermos(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const termos = await prisma.termo.findMany({
                where: { clinicId, ativo: true },
                include: { procedimento: { select: { name: true } } },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(termos);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao listar termos' });
        }
    }

    // ═══ CRIAR TERMO (Modelo) ═══
    static async createTermo(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { nome, tipo, descricao, procedimentoId, arquivoUrl, arquivoHash, arquivoTamanho, arquivoMimeType } = req.body;

            const termo = await prisma.termo.create({
                data: {
                    clinicId, nome, tipo, descricao, procedimentoId,
                    arquivoUrl, arquivoHash, arquivoTamanho, arquivoMimeType,
                    uploadPor: userId
                }
            });

            await createAuditLog({
                action: 'CREATE', userId, req, clinicId,
                entity: 'Termo', entityId: termo.id,
                newValues: { nome, tipo }
            });

            return res.status(201).json(termo);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao criar termo' });
        }
    }

    // ═══ LISTAR DOCUMENTOS DO PACIENTE ═══
    static async listDocumentos(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { pacienteId } = req.params;

            // Garantir que paciente pertence à clínica
            const paciente = await prisma.patient.findFirst({
                where: { id: pacienteId, clinicId }
            });
            if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' });

            const documentos = await prisma.documentoPaciente.findMany({
                where: { pacienteId },
                orderBy: { uploadEm: 'desc' }
            });

            return res.json(documentos);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao listar documentos' });
        }
    }

    // ═══ UPLOAD DOCUMENTO PACIENTE ═══
    static async createDocumento(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { pacienteId } = req.params;
            const { nome, tipo, arquivoUrl, arquivoHash, arquivoTamanho, contaId, termoId } = req.body;

            const paciente = await prisma.patient.findFirst({
                where: { id: pacienteId, clinicId }
            });
            if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' });

            const documento = await prisma.documentoPaciente.create({
                data: {
                    pacienteId, nome, tipo, arquivoUrl, arquivoHash, arquivoTamanho,
                    contaId, termoId, uploadPor: userId
                }
            });

            await createAuditLog({
                action: 'CREATE', userId, req, clinicId,
                entity: 'DocumentoPaciente', entityId: documento.id,
                newValues: { nome, tipo, pacienteId }
            });

            return res.status(201).json(documento);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao salvar documento' });
        }
    }
}
