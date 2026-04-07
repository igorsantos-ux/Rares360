import prisma from '../lib/prisma.js';
export class PrescriptionController {
    static async list(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const { patientId } = req.query;
            const recipes = await prisma.prescription.findMany({
                where: {
                    clinicId,
                    patientId: String(patientId)
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(recipes);
        }
        catch (error) {
            console.error('Error listing prescriptions:', error);
            res.status(500).json({ error: 'Erro ao listar receitas' });
        }
    }
    static async create(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const { patientId, medications, content } = req.body;
            const prescription = await prisma.prescription.create({
                data: {
                    medications, // JSON de medicamentos
                    content, // JSON de corpo da receita
                    patientId,
                    clinicId
                }
            });
            res.status(201).json(prescription);
        }
        catch (error) {
            console.error('Error creating prescription:', error);
            res.status(500).json({ error: 'Erro ao criar receita' });
        }
    }
    static async updatePrinted(req, res) {
        try {
            const { id } = req.params;
            const updated = await prisma.prescription.update({
                where: { id },
                data: { printedAt: new Date() }
            });
            res.json(updated);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao marcar como impressa' });
        }
    }
}
