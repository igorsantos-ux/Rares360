import prisma from '../lib/prisma.js';
export class ProposalController {
    static async list(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const { patientId } = req.query;
            const proposals = await prisma.proposal.findMany({
                where: {
                    clinicId,
                    patientId: String(patientId)
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(proposals);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao listar propostas' });
        }
    }
    static async create(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const { patientId, items, totalValue, status, contractUrl } = req.body;
            const proposal = await prisma.proposal.create({
                data: {
                    patientId,
                    clinicId,
                    items,
                    totalValue: parseFloat(totalValue),
                    status,
                    contractUrl
                }
            });
            res.status(201).json(proposal);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao criar proposta' });
        }
    }
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updated = await prisma.proposal.update({
                where: { id },
                data: { status }
            });
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar status da proposta' });
        }
    }
}
