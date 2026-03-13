import prisma from '../lib/prisma.js';
export class PatientController {
    static async list(req, res) {
        try {
            let clinicId = req.clinicId || req.user?.clinicId;
            // Suporte para ADMIN_GLOBAL
            if (!clinicId) {
                const firstClinic = await prisma.clinic.findFirst();
                if (!firstClinic)
                    return res.status(401).json({ message: 'Clínica nãos identificada' });
                clinicId = firstClinic.id;
            }
            const patients = await prisma.patient.findMany({
                where: { clinicId },
                include: {
                    transactions: {
                        where: { type: 'INCOME' }
                    }
                },
                orderBy: { fullName: 'asc' }
            });
            const analyticalPatients = patients.map(p => {
                // Cálculo de LTV (Pagos)
                const paidTransactions = p.transactions.filter(t => t.status === 'PAID' || t.status === 'RECEBIDO');
                const totalSpent = paidTransactions.reduce((acc, t) => acc + t.amount, 0);
                // Contagem total de atendimentos (Independente de pagamento para histórico)
                const visitCount = p.transactions.length;
                // Última Visita
                const sortedTrans = [...p.transactions].sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return dateB - dateA;
                });
                const lastVisit = sortedTrans[0]?.date || null;
                // Ticket Médio (LTV / Atendimentos)
                const averageTicket = visitCount > 0 ? totalSpent / visitCount : 0;
                // Extrair procedimentos únicos
                const procedures = Array.from(new Set(p.transactions.map(t => t.procedureName).filter(Boolean)));
                // Classificação (Baseada no LTV total)
                let classification = 'BRONZE';
                if (totalSpent >= 10000)
                    classification = 'DIAMANTE';
                else if (totalSpent >= 5000)
                    classification = 'OURO';
                else if (totalSpent >= 2000)
                    classification = 'PRATA';
                return {
                    ...p,
                    totalSpent,
                    visitCount,
                    lastVisit,
                    averageTicket,
                    procedures,
                    classification
                };
            });
            // Summary data para os Cards
            const now = new Date();
            const thisMonth = now.getMonth();
            const birthdaysMonth = patients.filter(p => {
                if (!p.birthDate)
                    return false;
                const bDate = new Date(p.birthDate);
                return bDate.getMonth() === thisMonth;
            }).length;
            const globalTotalSpent = analyticalPatients.reduce((acc, p) => acc + p.totalSpent, 0);
            const globalVisitCount = analyticalPatients.reduce((acc, p) => acc + p.visitCount, 0);
            const globalAvgTicket = globalVisitCount > 0 ? globalTotalSpent / globalVisitCount : 0;
            res.json({
                data: analyticalPatients,
                summary: {
                    totalPatients: patients.length,
                    monthlyBirthdays: birthdaysMonth,
                    averageClinicTicket: globalAvgTicket
                }
            });
        }
        catch (error) {
            console.error('Error listing patients:', error);
            res.status(500).json({ error: 'Erro ao listar pacientes' });
        }
    }
    static async create(req, res) {
        try {
            const clinicId = req.clinicId || req.user?.clinicId;
            const data = req.body;
            // Limpa campos vazios para não dar erro no Prisma (Int/Float)
            const cleanData = { ...data };
            if (cleanData.weight === '')
                delete cleanData.weight;
            if (cleanData.height === '')
                delete cleanData.height;
            const patient = await prisma.patient.create({
                data: {
                    ...cleanData,
                    clinicId,
                    birthDate: data.birthDate ? new Date(data.birthDate) : null,
                    weight: cleanData.weight ? parseFloat(cleanData.weight) : null,
                    height: cleanData.height ? parseFloat(cleanData.height) : null,
                    smoker: data.smoker === true || data.smoker === 'true'
                }
            });
            res.status(201).json(patient);
        }
        catch (error) {
            console.error('Error creating patient:', error);
            res.status(500).json({ error: 'Erro ao criar paciente' });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            console.log(`📝 Iniciando update do paciente ${id}. Dados recebidos:`, data.fullName);
            const cleanData = { ...data };
            // Campos proibidos ou calculados que devem ser removidos do payload de atualização
            const forbiddenFields = [
                'id', 'clinicId', 'transactions', 'createdAt', 'updatedAt',
                'totalSpent', 'visitCount', 'lastVisit', 'averageTicket',
                'procedures', 'classification'
            ];
            forbiddenFields.forEach(field => delete cleanData[field]);
            // Tratamento especial para booleanos e números vindo como string do form
            const updatePayload = {
                ...cleanData,
                smoker: data.smoker === true || data.smoker === 'true',
                weight: (data.weight !== undefined && data.weight !== '') ? parseFloat(data.weight) : null,
                height: (data.height !== undefined && data.height !== '') ? parseFloat(data.height) : null,
            };
            // Tratamento de data para o Prisma (DateTime)
            if (data.birthDate) {
                updatePayload.birthDate = new Date(data.birthDate);
            }
            else if (data.birthDate === '') {
                updatePayload.birthDate = null;
            }
            const patient = await prisma.patient.update({
                where: { id },
                data: updatePayload
            });
            console.log(`✅ Paciente ${id} atualizado com sucesso.`);
            res.json(patient);
        }
        catch (error) {
            console.error('❌ Erro no update do paciente:', error);
            // Mensagem de erro amigável se for violação de unique (CPF)
            if (error.code === 'P2002') {
                return res.status(400).json({ error: 'Este CPF já está cadastrado para outro paciente.' });
            }
            res.status(500).json({ error: 'Erro interno ao atualizar paciente' });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            await prisma.patient.delete({ where: { id } });
            res.json({ message: 'Paciente excluído com sucesso' });
        }
        catch (error) {
            console.error('Error deleting patient:', error);
            res.status(500).json({ error: 'Erro ao excluir paciente' });
        }
    }
}
