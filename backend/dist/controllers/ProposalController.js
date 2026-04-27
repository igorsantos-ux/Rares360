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
            const { status, professionalId } = req.body;
            const clinicId = req.clinicId || req.user?.clinicId;
            const currentProposal = await prisma.proposal.findUnique({
                where: { id },
                include: { patient: true }
            });
            if (!currentProposal)
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            const data = { status };
            if (status === 'EXECUTADO' && currentProposal.status !== 'EXECUTADO') {
                data.executedAt = new Date();
                data.executedById = professionalId;
            }
            const updated = await prisma.proposal.update({
                where: { id },
                data
            });
            // TRIGGER: Se mudou para EXECUTADO, disparar automações
            if (status === 'EXECUTADO' && currentProposal.status !== 'EXECUTADO') {
                await ProposalController.handleExecutionTriggers(updated, professionalId);
            }
            res.json(updated);
        }
        catch (error) {
            console.error('Error updating proposal status:', error);
            res.status(500).json({ error: 'Erro ao atualizar status da proposta' });
        }
    }
    static async handleExecutionTriggers(proposal, professionalId) {
        try {
            // 1. Trigger CRM: Criar tarefa de retorno
            await prisma.task.create({
                data: {
                    clinicId: proposal.clinicId,
                    patientId: proposal.patientId,
                    title: `Follow-up Orçamento Executado: #${proposal.id.slice(0, 8)}`,
                    description: `Realizar contato de pós-procedimento para o orçamento executado.`,
                    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
                    type: 'FOLLOW_UP',
                    status: 'ABERTA'
                }
            });
            // 2. Trigger Estoque: Baixa de insumos para cada item do orçamento
            const items = proposal.items;
            if (Array.isArray(items)) {
                for (const item of items) {
                    // Tenta encontrar o item no estoque pelo nome
                    const inventoryItem = await prisma.inventoryItem.findFirst({
                        where: {
                            clinicId: proposal.clinicId,
                            name: { equals: item.name, mode: 'insensitive' }
                        }
                    });
                    if (inventoryItem) {
                        const quantity = parseFloat(item.quantity) || 1;
                        await prisma.stockMovement.create({
                            data: {
                                type: 'OUT',
                                quantity: quantity,
                                reason: `Execução de Orçamento #${proposal.id.slice(0, 8)}`,
                                itemId: inventoryItem.id,
                                clinicId: proposal.clinicId
                            }
                        });
                        await prisma.inventoryItem.update({
                            where: { id: inventoryItem.id },
                            data: {
                                currentStock: { decrement: quantity }
                            }
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in Proposal execution triggers:', error);
        }
    }
}
