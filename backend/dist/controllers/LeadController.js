import prisma from '../lib/prisma.js';
export class LeadController {
    static async createLead(req, res) {
        try {
            const { name, email, whatsapp, subject, message, diagnostic } = req.body;
            // diagnostic can be optional or required depending on the step
            if (!name || !email || !whatsapp || !subject) {
                return res.status(400).json({ error: 'Dados básicos são obrigatórios' });
            }
            // Lead Scoring Logic
            let score = 0;
            // E-mail Corporativo (+10)
            const personalDomains = [
                'gmail.com', 'outlook.com', 'hotmail.com', 'live.com',
                'icloud.com', 'yahoo.com', 'yahoo.com.br', 'uol.com.br', 'terra.com.br'
            ];
            const emailDomain = email.split('@')[1]?.toLowerCase();
            if (emailDomain && !personalDomains.includes(emailDomain)) {
                score += 10;
            }
            if (diagnostic) {
                // Faturamento (Q5): >80k (+30) ou 30-80k (+15)
                const revenue = diagnostic.monthlyRevenue;
                if (revenue === '+300 mil' || revenue === '150-300 mil' || revenue === '80-150 mil') {
                    score += 30;
                }
                else if (revenue === '30-80 mil') {
                    score += 15;
                }
                // Tempo Operação (Q2): >1 ano (+15)
                const operationTime = diagnostic.operationTime;
                if (operationTime === '1-3 anos' || operationTime === '3-5 anos' || operationTime === '+5 anos') {
                    score += 15;
                }
                // Profissionais (Q3): 2 ou mais (+15)
                const profs = diagnostic.professionalsCount;
                if (profs === '2-3' || profs === '4-6' || profs === '+6') {
                    score += 15;
                }
                // Dores / Falta de organização: DRE, DFC, Margem
                // Q6: Você possui DRE? "Não tenho", Q7: DFC prev? "Não possuo controle claro", Q9: Margem? "Não sei"
                if (diagnostic.hasDRE === 'Não tenho')
                    score += 10;
                if (diagnostic.hasDFC === 'Não possuo controle claro')
                    score += 10;
                if (diagnostic.knowsMargin === 'Não sei')
                    score += 10;
            }
            // Garante max 100
            if (score > 100)
                score = 100;
            const lead = await prisma.globalLead.create({
                data: {
                    name,
                    email,
                    whatsapp,
                    subject,
                    message: message || '',
                    diagnostic: diagnostic || null,
                    score,
                    status: 'NOVO'
                }
            });
            // "Notification" (Log)
            console.log(`[CRM ALERT] Novo lead capturado: ${name} (${email}) - Score: ${score}`);
            res.status(201).json({
                message: 'Sua jornada estratégica começou. Em breve um consultor entrará em contato.',
                leadId: lead.id
            });
        }
        catch (error) {
            console.error('Error creating lead:', error);
            res.status(500).json({ error: 'Erro ao processar sua solicitação central de leads.' });
        }
    }
    static async listLeads(req, res) {
        try {
            const leads = await prisma.globalLead.findMany({
                orderBy: [
                    { score: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
            res.json(leads);
        }
        catch (error) {
            console.error('Error listing leads:', error);
            res.status(500).json({ error: 'Erro ao listar leads' });
        }
    }
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const validStatuses = ['NOVO', 'EM_CONTATO', 'DEMONSTRACAO', 'FECHADO', 'PERDIDO'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Status inválido' });
            }
            const lead = await prisma.globalLead.update({
                where: { id },
                data: { status }
            });
            res.json(lead);
        }
        catch (error) {
            console.error('Error updating lead status:', error);
            res.status(500).json({ error: 'Erro ao atualizar status do lead' });
        }
    }
    static async updateNotes(req, res) {
        try {
            const { id } = req.params;
            const { notes } = req.body;
            const lead = await prisma.globalLead.update({
                where: { id },
                data: { notes }
            });
            res.json(lead);
        }
        catch (error) {
            console.error('Error updating lead notes:', error);
            res.status(500).json({ error: 'Erro ao atualizar anotações do lead' });
        }
    }
}
