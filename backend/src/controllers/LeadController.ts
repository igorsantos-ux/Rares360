import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export class LeadController {
    static async createLead(req: Request, res: Response) {
        try {
            const { name, email, whatsapp, subject, message, diagnostic } = req.body;
            
            // diagnostic can be optional or required depending on the step
            if (!name || !email || !whatsapp || !subject) {
                return res.status(400).json({ error: 'Dados básicos são obrigatórios' });
            }

            // Lead Scoring Logic
            let score = 0;

            // 1. Email Corporativo (+50)
            const personalDomains = [
                'gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 
                'icloud.com', 'yahoo.com', 'yahoo.com.br', 'uol.com.br', 'terra.com.br'
            ];
            const emailDomain = email.split('@')[1]?.toLowerCase();
            if (emailDomain && !personalDomains.includes(emailDomain)) {
                score += 50;
            }

            // 2. Assunto Estratégico (+30)
            const strategicSubjects = ['Consultoria', 'SaaS', 'Implementação'];
            if (strategicSubjects.includes(subject)) {
                score += 30;
            }

            // 3. Mensagem Longa (+20)
            if (message && message.length > 100) {
                score += 20;
            }

            // 4. Diagnostic Bonus (+30 if completed)
            if (diagnostic && typeof diagnostic === 'object' && Object.keys(diagnostic).length > 10) {
                score += 30;
            }

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
        } catch (error) {
            console.error('Error creating lead:', error);
            res.status(500).json({ error: 'Erro ao processar sua solicitação central de leads.' });
        }
    }

    static async listLeads(req: Request, res: Response) {
        try {
            const leads = await prisma.globalLead.findMany({
                orderBy: [
                    { score: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
            res.json(leads);
        } catch (error) {
            console.error('Error listing leads:', error);
            res.status(500).json({ error: 'Erro ao listar leads' });
        }
    }

    static async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['NOVO', 'EM_CONTATO', 'CONVERTIDO', 'ARQUIVADO'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Status inválido' });
            }

            const lead = await prisma.globalLead.update({
                where: { id },
                data: { status }
            });

            res.json(lead);
        } catch (error) {
            console.error('Error updating lead status:', error);
            res.status(500).json({ error: 'Erro ao atualizar status do lead' });
        }
    }
}
