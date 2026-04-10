import prisma from '../lib/prisma.js';
export class ClinicController {
    static async getMe(req, res) {
        try {
            const clinicId = req.clinicId;
            if (!clinicId) {
                return res.status(400).json({ error: 'Clinic ID não identificado no contexto.' });
            }
            const clinic = await prisma.clinic.findUnique({
                where: { id: clinicId }
            });
            if (!clinic) {
                return res.status(404).json({ error: 'Clínica não encontrada.' });
            }
            res.json(clinic);
        }
        catch (error) {
            console.error('Error fetching clinic:', error);
            res.status(500).json({ error: 'Erro interno ao buscar dados da clínica.' });
        }
    }
    static async updateMe(req, res) {
        try {
            const clinicId = req.clinicId;
            const userId = req.user.id; // ID do usuário que está atualizando
            if (!clinicId) {
                return res.status(400).json({ error: 'Clinic ID não identificado no contexto.' });
            }
            const { name, razaoSocial, cnpj, cnes, telefone, whatsapp, email, cep, logradouro, numero, complemento, bairro, cidade, estado, logo } = req.body;
            // Busca o nome do usuário para o log de auditoria
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true }
            });
            const updatedBy = user?.name || 'Sistema';
            // Proteção: Apenas campos permitidos são atualizados
            // clinicId e campos de faturamento (monthlyFee, etc) NÃO são permitidos aqui
            const updatedClinic = await prisma.clinic.update({
                where: { id: clinicId },
                data: {
                    name,
                    razaoSocial,
                    cnpj,
                    cnes,
                    telefone,
                    whatsapp,
                    email,
                    cep,
                    logradouro,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    logo,
                    lastUpdatedBy: updatedBy
                }
            });
            res.json({
                message: 'Dados da clínica atualizados com sucesso.',
                clinic: updatedClinic
            });
        }
        catch (error) {
            console.error('Error updating clinic:', error);
            res.status(500).json({ error: 'Erro interno ao atualizar dados da clínica.' });
        }
    }
    static async listAll(req, res) {
        try {
            const clinics = await prisma.clinic.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    cnpj: true,
                    cidade: true,
                    estado: true,
                    logo: true
                },
                orderBy: { name: 'asc' }
            });
            res.json(clinics);
        }
        catch (error) {
            console.error('Error listing all clinics:', error);
            res.status(500).json({ error: 'Erro interno ao listar clínicas.' });
        }
    }
}
