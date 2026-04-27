import prisma, { basePrisma } from '../lib/prisma.js';
export class PrivacyController {
    /**
     * GET /api/privacy/my-data
     * Retorna todos os dados do paciente vinculado ao usuário autenticado.
     * Art. 18, II LGPD — Direito de acesso.
     */
    static async getMyData(req, res) {
        try {
            const userId = req.user.id;
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    clinicId: true,
                    createdAt: true,
                    lastLoginAt: true,
                    isActive: true,
                }
            });
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            // Buscar dados de auditoria associados ao usuário
            const auditLogs = await basePrisma.auditLog.findMany({
                where: { userId: userId },
                orderBy: { timestamp: 'desc' },
                take: 50,
                select: {
                    action: true,
                    entity: true,
                    timestamp: true,
                }
            });
            // Buscar consentimentos
            const consents = await basePrisma.consentLog.findMany({
                where: { userId: userId },
                orderBy: { timestamp: 'desc' },
            }).catch(() => []);
            res.json({
                userData: user,
                activityLog: auditLogs,
                consents,
                exportDate: new Date().toISOString(),
                format: 'JSON',
                lgpdReference: 'Art. 18, II — Lei 13.709/2018',
            });
        }
        catch (error) {
            console.error('[PRIVACY] Erro ao buscar dados:', error);
            res.status(500).json({ error: 'Erro ao buscar seus dados.' });
        }
    }
    /**
     * DELETE /api/privacy/my-data
     * Anonimiza dados pessoais do usuário.
     * Art. 18, VI LGPD — Direito à eliminação.
     *
     * Nota: Não deleta registros para preservar integridade de dados financeiros
     * (obrigação fiscal de 5 anos). Em vez disso, anonimiza campos PII.
     */
    static async anonymizeMyData(req, res) {
        try {
            const userId = req.user.id;
            const { confirmation } = req.body;
            if (confirmation !== 'ANONIMIZAR MEUS DADOS') {
                return res.status(400).json({
                    error: 'Confirmação necessária.',
                    requiredConfirmation: 'Envie { "confirmation": "ANONIMIZAR MEUS DADOS" } para confirmar.',
                });
            }
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, clinicId: true, role: true }
            });
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            // Bloquear anonimização de ADMIN_GLOBAL
            if (user.role === 'ADMIN_GLOBAL') {
                return res.status(403).json({ error: 'Contas administrativas globais não podem ser anonimizadas.' });
            }
            // Anonimizar dados do usuário
            await prisma.user.update({
                where: { id: userId },
                data: {
                    name: `[ANONIMIZADO-${userId.substring(0, 8)}]`,
                    email: `anonimizado-${userId}@deleted.lgpd`,
                    isActive: false,
                    password: 'ANONIMIZADO',
                },
            });
            // Registrar auditoria da anonimização
            await basePrisma.auditLog.create({
                data: {
                    clinicId: user.clinicId || 'GLOBAL',
                    userId: userId,
                    action: 'DELETE',
                    entity: 'User',
                    entityId: userId,
                    oldValues: { action: 'LGPD_ANONYMIZATION_REQUEST' },
                    newValues: { anonymizedAt: new Date().toISOString() },
                }
            });
            res.json({
                message: 'Dados pessoais anonimizados com sucesso.',
                anonymizedAt: new Date().toISOString(),
                lgpdReference: 'Art. 18, VI — Lei 13.709/2018',
                note: 'Dados financeiros serão retidos por 5 anos conforme obrigação fiscal (Art. 16, I).',
            });
        }
        catch (error) {
            console.error('[PRIVACY] Erro ao anonimizar dados:', error);
            res.status(500).json({ error: 'Erro ao processar solicitação de anonimização.' });
        }
    }
    /**
     * POST /api/privacy/data-correction
     * Solicita correção de dados pessoais.
     * Art. 18, III LGPD — Direito à correção.
     */
    static async requestCorrection(req, res) {
        try {
            const userId = req.user.id;
            const { field, currentValue, correctedValue, justification } = req.body;
            if (!field || !correctedValue) {
                return res.status(400).json({ error: 'Campos "field" e "correctedValue" são obrigatórios.' });
            }
            // Registrar solicitação de correção no log de auditoria
            await basePrisma.auditLog.create({
                data: {
                    clinicId: req.user.clinicId || 'GLOBAL',
                    userId: userId,
                    action: 'UPDATE',
                    entity: 'DataCorrectionRequest',
                    entityId: userId,
                    oldValues: { field, currentValue, justification },
                    newValues: { field, correctedValue, requestedAt: new Date().toISOString() },
                }
            });
            res.json({
                message: 'Solicitação de correção registrada. Será processada em até 15 dias.',
                requestId: `DCR-${Date.now()}`,
                field,
                status: 'PENDENTE',
                lgpdReference: 'Art. 18, III — Lei 13.709/2018',
            });
        }
        catch (error) {
            console.error('[PRIVACY] Erro na solicitação de correção:', error);
            res.status(500).json({ error: 'Erro ao processar solicitação de correção.' });
        }
    }
    /**
     * GET /api/privacy/data-portability
     * Exporta todos os dados do usuário em formato portável.
     * Art. 18, V LGPD — Direito à portabilidade.
     */
    static async exportPortableData(req, res) {
        try {
            const userId = req.user.id;
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    clinicId: true,
                    createdAt: true,
                    lastLoginAt: true,
                }
            });
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            // Registrar auditoria do export
            await basePrisma.auditLog.create({
                data: {
                    clinicId: user.clinicId || 'GLOBAL',
                    userId: userId,
                    action: 'EXPORT',
                    entity: 'User',
                    entityId: userId,
                    newValues: { type: 'DATA_PORTABILITY', format: 'JSON', exportedAt: new Date().toISOString() },
                }
            });
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    format: 'JSON',
                    lgpdReference: 'Art. 18, V — Lei 13.709/2018',
                    dataController: 'Rares360 — Antigravity Soluções',
                },
                userData: user,
            };
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="rares360_data_export_${userId}_${Date.now()}.json"`);
            res.json(exportData);
        }
        catch (error) {
            console.error('[PRIVACY] Erro ao exportar dados:', error);
            res.status(500).json({ error: 'Erro ao exportar dados para portabilidade.' });
        }
    }
    /**
     * GET /api/privacy/consent-status
     * Retorna status do consentimento do usuário.
     */
    static async getConsentStatus(req, res) {
        try {
            const userId = req.user.id;
            const latestConsent = await basePrisma.consentLog.findFirst({
                where: { userId },
                orderBy: { timestamp: 'desc' },
            }).catch(() => null);
            res.json({
                hasConsented: !!latestConsent,
                lastConsentDate: latestConsent?.timestamp || null,
                termsVersion: latestConsent?.termsVersion || null,
                consentType: latestConsent?.consentType || null,
            });
        }
        catch (error) {
            console.error('[PRIVACY] Erro ao verificar consentimento:', error);
            res.status(500).json({ error: 'Erro ao verificar status do consentimento.' });
        }
    }
    /**
     * POST /api/privacy/consent
     * Registra consentimento do usuário.
     */
    static async registerConsent(req, res) {
        try {
            const userId = req.user.id;
            const { termsVersion, consentType } = req.body;
            if (!termsVersion) {
                return res.status(400).json({ error: 'Campo "termsVersion" é obrigatório.' });
            }
            const consent = await basePrisma.consentLog.create({
                data: {
                    userId,
                    termsVersion,
                    consentType: consentType || 'DATA_PROCESSING',
                    ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
                    userAgent: req.headers['user-agent'] || 'unknown',
                }
            });
            res.json({
                message: 'Consentimento registrado com sucesso.',
                consentId: consent.id,
                timestamp: consent.timestamp,
                termsVersion: consent.termsVersion,
            });
        }
        catch (error) {
            console.error('[PRIVACY] Erro ao registrar consentimento:', error);
            res.status(500).json({ error: 'Erro ao registrar consentimento.' });
        }
    }
    /**
     * POST /api/privacy/incident
     * Registra um incidente de segurança (uso interno — ADMIN apenas).
     * Art. 48 LGPD — Comunicação de incidentes à ANPD.
     */
    static async reportIncident(req, res) {
        try {
            if (req.user.role !== 'ADMIN_GLOBAL') {
                return res.status(403).json({ error: 'Apenas administradores globais podem reportar incidentes.' });
            }
            const { title, description, severity, affectedDataTypes, affectedUsersCount, containmentActions, } = req.body;
            if (!title || !description || !severity) {
                return res.status(400).json({ error: 'Campos obrigatórios: title, description, severity.' });
            }
            const incident = await basePrisma.incidentReport.create({
                data: {
                    reportedBy: req.user.id,
                    title,
                    description,
                    severity,
                    affectedDataTypes: affectedDataTypes || [],
                    affectedUsersCount: affectedUsersCount || 0,
                    containmentActions: containmentActions || null,
                    status: 'OPEN',
                }
            });
            res.status(201).json({
                message: 'Incidente registrado. Prazo ANPD: 72 horas para comunicação.',
                incidentId: incident.id,
                anpdDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
                lgpdReference: 'Art. 48 — Lei 13.709/2018',
            });
        }
        catch (error) {
            console.error('[PRIVACY] Erro ao registrar incidente:', error);
            res.status(500).json({ error: 'Erro ao registrar incidente de segurança.' });
        }
    }
}
