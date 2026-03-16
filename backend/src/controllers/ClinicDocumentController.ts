import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export class ClinicDocumentController {
    // Lista todos os documentos da clínica logada
    static async list(req: any, res: Response) {
        try {
            const clinicId = req.clinicId;

            if (!clinicId) {
                return res.status(401).json({ message: 'Clínica não identificada.' });
            }

            const documents = await prisma.clinicDocument.findMany({
                where: { clinicId },
                orderBy: { createdAt: 'asc' }
            });

            res.json(Array.isArray(documents) ? documents : []);
        } catch (error: any) {
            console.error('Erro ao listar documentos:', error);
            res.status(500).json({ error: 'Erro interno ao buscar documentos.' });
        }
    }

    // Atualiza status ou anexa arquivo (fileUrl)
    static async update(req: any, res: Response) {
        try {
            const { id } = req.params;
            const { status, fileUrl, expiryDate } = req.body;
            const clinicId = req.clinicId;

            // Segurança Multi-tenant
            const doc = await prisma.clinicDocument.findUnique({
                where: { id }
            });

            if (!doc || doc.clinicId !== clinicId) {
                return res.status(403).json({ message: 'Acesso negado ou documento não encontrado.' });
            }

            const updated = await prisma.clinicDocument.update({
                where: { id },
                data: {
                    status: status || doc.status,
                    fileUrl: fileUrl !== undefined ? fileUrl : doc.fileUrl,
                    expiryDate: expiryDate ? new Date(expiryDate) : doc.expiryDate
                }
            });

            res.json(updated);
        } catch (error: any) {
            console.error('Erro ao atualizar documento:', error);
            res.status(500).json({ error: 'Erro ao atualizar documento.' });
        }
    }

    // Deleta um documento (opcional, foco em sugestões v15)
    static async delete(req: any, res: Response) {
        try {
            const { id } = req.params;
            const clinicId = req.clinicId;

            const doc = await prisma.clinicDocument.findUnique({ where: { id } });

            if (!doc || doc.clinicId !== clinicId) {
                return res.status(403).json({ message: 'Acesso negado.' });
            }

            await prisma.clinicDocument.delete({ where: { id } });
            res.json({ message: 'Documento removido com sucesso.' });
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao excluir documento.' });
        }
    }
}
