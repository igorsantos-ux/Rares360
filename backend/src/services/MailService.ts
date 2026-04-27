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
}

