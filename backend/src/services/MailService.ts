import nodemailer from 'nodemailer';
import { emailCircuitBreaker } from '../lib/circuitBreaker.js';

export class MailService {
    private static transporter: nodemailer.Transporter | null = null;

    /**
     * Inicializa o transportador de forma dinâmica para garantir que o .env já foi carregado
     */
    private static getTransporter() {
        if (!this.transporter) {
            console.log(`[MailService] Inicializando transporte para ${process.env.SMTP_HOST}...`);
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.office365.com',
                port: Number(process.env.SMTP_PORT) || 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
                tls: {
                    ciphers: 'SSLv3',
                    rejectUnauthorized: false
                },
                debug: false,
                logger: false
            });
        }
        return this.transporter;
    }

    /**
     * Retry com backoff exponencial (1s, 2s, 4s)
     */
    private static async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (err: any) {
                lastError = err;
                const delay = Math.pow(2, attempt) * 1000;
                console.warn(`[MailService] Tentativa ${attempt + 1}/${maxRetries} falhou. Retry em ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }

    /**
     * Envia o e-mail de onboarding para novos usuários
     * Protegido com Circuit Breaker + Retry com backoff exponencial
     */
    static async sendOnboardingEmail(to: string, name: string, tempPassword: string) {
        const subject = '🚀 Bem-vindo à RARES – Sua Jornada Estratégica Começa Agora';

        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Inter', sans-serif; background-color: #0d1117; color: #e6edf3; margin: 0; padding: 0; }
                    .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #161b22; border-radius: 12px; overflow: hidden; border: 1px solid #30363d; }
                    .header { background: linear-gradient(135deg, #1f6feb 0%, #238636 100%); padding: 50px 20px; text-align: center; }
                    .header h1 { margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; }
                    .content { padding: 40px; line-height: 1.6; color: #c9d1d9; }
                    .credentials-box { background-color: #0d1117; border: 1px solid #30363d; border-radius: 12px; padding: 30px; margin: 30px 0; }
                    .btn-container { text-align: center; margin-top: 40px; }
                    .btn { background: #238636; color: #ffffff !important; padding: 18px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; }
                    .footer { text-align: center; padding: 30px; font-size: 13px; color: #8b949e; border-top: 1px solid #30363d; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>RARES 360</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, ${name}!</h2>
                        <p>Você acaba de ser cadastrado com sucesso na plataforma <strong>RARES 360</strong>.</p>
                        <div class="credentials-box">
                            <p><strong>Usuário:</strong> ${to}</p>
                            <p><strong>Senha Temporária:</strong> ${tempPassword}</p>
                        </div>
                        <p>Por segurança, altere sua senha no primeiro login.</p>
                        <div class="btn-container">
                            <a href="https://rares360.com.br" class="btn">ACESSAR MINHA CLÍNICA</a>
                        </div>
                    </div>
                    <div class="footer">© ${new Date().getFullYear()} RARES360</div>
                </div>
            </body>
            </html>
        `;

        // ═══ PERF-006: Circuit Breaker + Retry para Email ═══
        return emailCircuitBreaker.execute(
            () => this.withRetry(async () => {
                const transporter = this.getTransporter();
                const info = await transporter.sendMail({
                    from: '"TI RARES" <ti.rares@rares360.com.br>',
                    to,
                    subject,
                    html,
                });
                console.log('[MailService] ✅ E-mail enviado:', info.messageId);
                return info;
            }),
            () => {
                console.warn('[MailService] ⚠️ Circuit Breaker OPEN — e-mail enfileirado para retry posterior');
                return { messageId: 'queued', status: 'circuit_open' };
            }
        );
    }

    /**
     * Notifica os admins sobre um novo lead capturado pelo site
     * Template premium com score colorido e dados do lead
     */
    static async sendNewLeadNotification(lead: {
        nome: string;
        clinica: string;
        email: string;
        whatsapp: string;
        especialidade: string;
        volumeMensal: string;
        desafio: string;
        origem: string;
        score: number;
    }) {
        const scoreColor = lead.score >= 70 ? '#22c55e' : lead.score >= 40 ? '#eab308' : '#ef4444';
        const scoreLabel = lead.score >= 70 ? 'ALTO' : lead.score >= 40 ? 'MÉDIO' : 'BAIXO';
        const subject = `🔥 Novo lead: ${lead.nome} - ${lead.clinica} (Score: ${lead.score}/100)`;

        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; color: #1a202c; margin: 0; padding: 0; }
                    .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
                    .header { background: linear-gradient(135deg, #1C2B1A 0%, #3B6D11 100%); padding: 40px 30px; text-align: center; }
                    .header h1 { margin: 0; font-size: 14px; font-weight: 900; color: #BA7517; letter-spacing: 4px; text-transform: uppercase; }
                    .header h2 { margin: 8px 0 0; font-size: 28px; font-weight: 800; color: #ffffff; }
                    .score-badge { display: inline-block; background: ${scoreColor}; color: #fff; padding: 8px 20px; border-radius: 20px; font-size: 18px; font-weight: 900; margin-top: 16px; }
                    .content { padding: 30px; }
                    .field { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
                    .field-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #8A9A5B; margin-bottom: 4px; }
                    .field-value { font-size: 16px; font-weight: 700; color: #1a202c; }
                    .grid { display: table; width: 100%; }
                    .grid-cell { display: table-cell; width: 50%; padding: 12px 0; vertical-align: top; }
                    .btn-container { text-align: center; padding: 30px; }
                    .btn { background: #3B6D11; color: #ffffff !important; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; display: inline-block; letter-spacing: 1px; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Rares360 Pipeline</h1>
                        <h2>Novo Lead Capturado</h2>
                        <div class="score-badge">Score: ${lead.score}/100 (${scoreLabel})</div>
                    </div>
                    <div class="content">
                        <div class="field">
                            <div class="field-label">Nome Completo</div>
                            <div class="field-value">${lead.nome}</div>
                        </div>
                        <div class="field">
                            <div class="field-label">Clínica</div>
                            <div class="field-value">${lead.clinica}</div>
                        </div>
                        <div class="grid">
                            <div class="grid-cell">
                                <div class="field-label">E-mail</div>
                                <div class="field-value" style="font-size:14px">${lead.email}</div>
                            </div>
                            <div class="grid-cell">
                                <div class="field-label">WhatsApp</div>
                                <div class="field-value" style="font-size:14px">${lead.whatsapp}</div>
                            </div>
                        </div>
                        <div class="grid" style="margin-top:12px">
                            <div class="grid-cell">
                                <div class="field-label">Especialidade</div>
                                <div class="field-value" style="font-size:14px">${lead.especialidade}</div>
                            </div>
                            <div class="grid-cell">
                                <div class="field-label">Volume Mensal</div>
                                <div class="field-value" style="font-size:14px">${lead.volumeMensal}</div>
                            </div>
                        </div>
                        <div class="field" style="margin-top:12px">
                            <div class="field-label">Principal Desafio</div>
                            <div class="field-value" style="font-size:14px">${lead.desafio}</div>
                        </div>
                        <div class="field">
                            <div class="field-label">Como nos Conheceu</div>
                            <div class="field-value" style="font-size:14px">${lead.origem}</div>
                        </div>
                    </div>
                    <div class="btn-container">
                        <a href="https://rares360.com.br/saas-dashboard?tab=leads" class="btn">VER NO PAINEL →</a>
                    </div>
                    <div class="footer">© ${new Date().getFullYear()} RARES360 — Notificação automática do pipeline</div>
                </div>
            </body>
            </html>
        `;

        const adminEmail = process.env.LEAD_NOTIFICATION_EMAIL || 'igor.santos@rares360.com.br';

        return emailCircuitBreaker.execute(
            () => this.withRetry(async () => {
                const transporter = this.getTransporter();
                const info = await transporter.sendMail({
                    from: '"Rares360 Pipeline" <ti.rares@rares360.com.br>',
                    to: adminEmail,
                    subject,
                    html,
                });
                console.log('[MailService] ✅ Notificação de lead enviada:', info.messageId);
                return info;
            }),
            () => {
                console.warn('[MailService] ⚠️ Circuit Breaker OPEN — notificação de lead enfileirada');
                return { messageId: 'queued', status: 'circuit_open' };
            }
        );
    }
}

