/**
 * ═══════════════════════════════════════════
 * LeadController — Sistema de Captação Rares360
 * ═══════════════════════════════════════════
 * Endpoint público para formulário do site + CRUD admin.
 * Proteções: Zod, Honeypot, Rate Limit (Redis), Sanitização XSS
 * Score automático: 0-100 baseado em 4 dimensões de qualificação
 */
import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { cacheGet, cacheSet } from '../lib/redis.js';
import { MailService } from '../services/MailService.js';

// ═══ Sanitização XSS — remove tags HTML de qualquer input ═══
const sanitize = (input: string): string =>
    input.replace(/<[^>]*>/g, '').replace(/[<>'"]/g, '').trim();

// ═══ Validação Zod para o formulário público ═══
const publicLeadSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
    clinica: z.string().min(2, 'Nome da clínica é obrigatório').max(100),
    whatsapp: z.string().min(14, 'WhatsApp inválido').max(16), // (XX) XXXXX-XXXX
    email: z.string().email('E-mail inválido').max(100),
    especialidade: z.enum([
        'Estética', 'Dermatologia', 'Odontologia', 'Nutrição', 'Ortopedia',
        'Cardiologia', 'Ginecologia', 'Psiquiatria', 'Outra'
    ]),
    volumeMensal: z.enum([
        'Até 50', '51-150', '151-300', '301-500', 'Acima de 500'
    ]),
    desafio: z.enum([
        'Gestão financeira desorganizada', 'Falta de controle de estoque',
        'Dificuldade em cobrar médicos', 'Sem visibilidade do lucro real',
        'Quero crescer mas não sei como', 'Outro'
    ]),
    origem: z.enum([
        'Instagram', 'Google', 'Indicação', 'LinkedIn', 'Outro'
    ]),
    consentimento: z.literal(true, {
        errorMap: () => ({ message: 'Consentimento é obrigatório' })
    }),
    // Honeypot: campo invisível que bots preenchem
    website: z.string().max(0).optional(),
});

// ═══ Algoritmo de Score automático (0-100) ═══
// Decisão de negócio: pesos calibrados para priorizar leads com maior
// potencial de conversão baseado no perfil da clínica
function calculateLeadScore(data: {
    origem: string;
    volumeMensal: string;
    desafio: string;
    especialidade: string;
}): number {
    let score = 0;

    // ▸ Origem (peso 20%) — Indicação tem maior conversão histórica
    const origemScores: Record<string, number> = {
        'Indicação': 20, 'LinkedIn': 15,
        'Instagram': 10, 'Google': 10, 'Outro': 5
    };
    score += origemScores[data.origem] || 5;

    // ▸ Volume de atendimentos (peso 30%) — Clínicas maiores = maior ticket
    const volumeScores: Record<string, number> = {
        'Acima de 500': 30, '301-500': 25, '151-300': 20,
        '51-150': 12, 'Até 50': 5
    };
    score += volumeScores[data.volumeMensal] || 5;

    // ▸ Desafio principal (peso 25%) — Dores financeiras = fit direto com Rares360
    const desafioScores: Record<string, number> = {
        'Gestão financeira desorganizada': 25,
        'Sem visibilidade do lucro real': 22,
        'Quero crescer mas não sei como': 20,
        'Dificuldade em cobrar médicos': 18,
        'Falta de controle de estoque': 15,
        'Outro': 10
    };
    score += desafioScores[data.desafio] || 10;

    // ▸ Especialidade (peso 25%) — Estética/Derma são o core business
    const especialidadeScores: Record<string, number> = {
        'Estética': 25, 'Dermatologia': 25,
        'Odontologia': 20, 'Nutrição': 20,
        'Ortopedia': 18, 'Cardiologia': 18,
        'Ginecologia': 15, 'Psiquiatria': 15,
        'Outra': 12
    };
    score += especialidadeScores[data.especialidade] || 12;

    return Math.min(score, 100);
}

export class LeadController {
    /**
     * POST /api/leads (público)
     * Recebe lead do formulário do site com proteções anti-spam
     */
    static async createLead(req: Request, res: Response) {
        try {
            const ip = (req as any).realIp || req.ip || 'unknown';

            // ═══ Rate Limiting por IP via Redis (máx 3/hora) ═══
            // Decisão: usar Redis ao invés de middleware para ter controle granular
            // e retornar 200 (não expor ao atacante que foi bloqueado)
            const rateLimitKey = `rl:lead:${ip}`;
            const currentCount = await cacheGet(rateLimitKey);
            if (currentCount && parseInt(currentCount) >= 3) {
                // Retorna 200 falso — não dar feedback ao spammer
                return res.status(200).json({ success: true });
            }

            // ═══ Validação Zod ═══
            const parsed = publicLeadSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    error: 'Dados inválidos',
                    details: parsed.error.flatten().fieldErrors
                });
            }

            const data = parsed.data;

            // ═══ Honeypot Check ═══
            // Se o campo invisível "website" foi preenchido, é bot
            if (data.website && data.website.length > 0) {
                // Retorna 200 falso — silenciosamente ignora
                return res.status(200).json({ success: true });
            }

            // ═══ Sanitização de todos os inputs ═══
            const sanitizedData = {
                nome: sanitize(data.nome),
                clinica: sanitize(data.clinica),
                whatsapp: sanitize(data.whatsapp),
                email: data.email.toLowerCase().trim(),
                especialidade: data.especialidade,
                volumeMensal: data.volumeMensal,
                desafio: data.desafio,
                origem: data.origem,
                consentimento: data.consentimento,
            };

            // ═══ Verificar e-mail duplicado ═══
            // Decisão de segurança: retornar 200 para não expor que o e-mail já existe
            const existingLead = await prisma.globalLead.findFirst({
                where: { email: sanitizedData.email }
            });
            if (existingLead) {
                return res.status(200).json({ success: true });
            }

            // ═══ Calcular Score Automático ═══
            const score = calculateLeadScore({
                origem: sanitizedData.origem,
                volumeMensal: sanitizedData.volumeMensal,
                desafio: sanitizedData.desafio,
                especialidade: sanitizedData.especialidade,
            });

            // ═══ Criar registro no banco ═══
            const lead = await prisma.globalLead.create({
                data: {
                    name: sanitizedData.nome,
                    email: sanitizedData.email,
                    whatsapp: sanitizedData.whatsapp,
                    clinica: sanitizedData.clinica,
                    especialidade: sanitizedData.especialidade,
                    volumeMensal: sanitizedData.volumeMensal,
                    desafio: sanitizedData.desafio,
                    origem: sanitizedData.origem,
                    consentimento: sanitizedData.consentimento,
                    source: 'website',
                    ipOrigem: ip,
                    score,
                    status: 'NOVO',
                    subject: 'Demonstração',
                    message: '',
                }
            });

            // ═══ Incrementar rate limit ═══
            const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
            await cacheSet(rateLimitKey, String(newCount), 3600); // 1 hora

            // ═══ Registrar AuditLog ═══
            console.log(`[LEAD_CREATED] ${sanitizedData.nome} (${sanitizedData.email}) | Score: ${score} | IP: ${ip} | Source: website`);

            // ═══ Disparar notificação por e-mail (fire-and-forget) ═══
            MailService.sendNewLeadNotification({
                nome: sanitizedData.nome,
                clinica: sanitizedData.clinica,
                email: sanitizedData.email,
                whatsapp: sanitizedData.whatsapp,
                especialidade: sanitizedData.especialidade,
                volumeMensal: sanitizedData.volumeMensal,
                desafio: sanitizedData.desafio,
                origem: sanitizedData.origem,
                score,
            }).catch(err => {
                console.error('[LEAD_NOTIFICATION_ERROR]', err.message);
            });

            // ═══ Nunca expor dados internos — retorno genérico ═══
            res.status(201).json({ success: true });
        } catch (error) {
            console.error('[LeadController.createLead] Error:', error);
            res.status(500).json({ error: 'Erro ao processar sua solicitação.' });
        }
    }

    /**
     * GET /api/leads (protegido — ADMIN_GLOBAL)
     * Lista todos os leads com ordenação por score e data
     */
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

    /**
     * PATCH /api/leads/:id/status (protegido — ADMIN_GLOBAL)
     * Atualiza status do lead no pipeline kanban
     * Registra timestamps de contato e fechamento automaticamente
     */
    static async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['NOVO', 'EM_CONTATO', 'DIAGNOSTICO', 'DEMONSTRACAO', 'FECHADO', 'PERDIDO'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Status inválido' });
            }

            // Decisão de negócio: registrar automaticamente timestamps
            // quando o lead avança no pipeline
            const updateData: any = { status };

            if (status === 'EM_CONTATO') {
                updateData.contatadoEm = new Date();
            }
            if (status === 'FECHADO' || status === 'PERDIDO') {
                updateData.fechadoEm = new Date();
            }

            const lead = await prisma.globalLead.update({
                where: { id },
                data: updateData
            });

            res.json(lead);
        } catch (error) {
            console.error('Error updating lead status:', error);
            res.status(500).json({ error: 'Erro ao atualizar status do lead' });
        }
    }

    /**
     * PATCH /api/leads/:id/notes (protegido — ADMIN_GLOBAL)
     * Atualiza observações do lead
     */
    static async updateNotes(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { notes } = req.body;

            const lead = await prisma.globalLead.update({
                where: { id },
                data: { notes: sanitize(notes || '') }
            });

            res.json(lead);
        } catch (error) {
            console.error('Error updating lead notes:', error);
            res.status(500).json({ error: 'Erro ao atualizar anotações do lead' });
        }
    }

    /**
     * PATCH /api/leads/:id (protegido — ADMIN_GLOBAL)
     * Atualização completa dos dados do lead (drawer admin)
     */
    static async updateLead(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { assignedTo, notes, status } = req.body;

            const updateData: any = {};
            if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
            if (notes !== undefined) updateData.notes = sanitize(notes || '');
            if (status) {
                const validStatuses = ['NOVO', 'EM_CONTATO', 'DIAGNOSTICO', 'DEMONSTRACAO', 'FECHADO', 'PERDIDO'];
                if (validStatuses.includes(status)) {
                    updateData.status = status;
                    if (status === 'EM_CONTATO') updateData.contatadoEm = new Date();
                    if (status === 'FECHADO' || status === 'PERDIDO') updateData.fechadoEm = new Date();
                }
            }

            const lead = await prisma.globalLead.update({
                where: { id },
                data: updateData
            });

            res.json(lead);
        } catch (error) {
            console.error('Error updating lead:', error);
            res.status(500).json({ error: 'Erro ao atualizar lead' });
        }
    }
}
