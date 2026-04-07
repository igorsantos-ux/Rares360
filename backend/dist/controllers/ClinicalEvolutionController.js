import prisma from '../lib/prisma.js';
export class ClinicalEvolutionController {
    static async list(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const { patientId } = req.query;
            if (!patientId) {
                return res.status(400).json({ error: 'Patient ID is required' });
            }
            const evolutions = await prisma.clinicalEvolution.findMany({
                where: {
                    clinicId,
                    patientId: String(patientId)
                },
                include: {
                    professional: {
                        select: { name: true, specialty: true }
                    }
                },
                orderBy: { date: 'desc' }
            });
            // Adiciona flag visual de bloqueio logicamente também no backend
            const now = new Date();
            const data = evolutions.map(ev => {
                const diffTime = Math.abs(now.getTime() - ev.date.getTime());
                const diffHours = diffTime / (1000 * 60 * 60);
                return {
                    ...ev,
                    isLocked: ev.locked || diffHours > 24
                };
            });
            res.json(data);
        }
        catch (error) {
            console.error('Error listing evolutions:', error);
            res.status(500).json({ error: 'Erro ao listar evoluções' });
        }
    }
    static async create(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const { text, professionalId, patientId, date } = req.body;
            const evolution = await prisma.clinicalEvolution.create({
                data: {
                    text,
                    professionalId,
                    patientId,
                    clinicId,
                    date: date ? new Date(date) : new Date()
                }
            });
            res.status(201).json(evolution);
        }
        catch (error) {
            console.error('Error creating evolution:', error);
            res.status(500).json({ error: 'Erro ao criar evolução' });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { text } = req.body;
            const existing = await prisma.clinicalEvolution.findUnique({
                where: { id }
            });
            if (!existing) {
                return res.status(404).json({ error: 'Evolução não encontrada' });
            }
            // Trava de 24h
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - existing.date.getTime());
            const diffHours = diffTime / (1000 * 60 * 60);
            if (existing.locked || diffHours > 24) {
                return res.status(403).json({ error: 'Esta evolução está bloqueada para edição (limite de 24h excedido). Use adendos.' });
            }
            const updated = await prisma.clinicalEvolution.update({
                where: { id },
                data: { text }
            });
            res.json(updated);
        }
        catch (error) {
            console.error('Error updating evolution:', error);
            res.status(500).json({ error: 'Erro ao atualizar evolução' });
        }
    }
    static async lock(req, res) {
        try {
            const { id } = req.params;
            const updated = await prisma.clinicalEvolution.update({
                where: { id },
                data: { locked: true }
            });
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao bloquear evolução' });
        }
    }
}
