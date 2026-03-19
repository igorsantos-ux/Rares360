import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthService } from '../services/AuthService.js';

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email: rawEmail, password } = req.body;
            const email = rawEmail?.toLowerCase().trim();

            console.log(`Tentativa de login para: ${email}`);

            const user = await prisma.user.findUnique({
                where: { email },
                include: { clinic: true }
            });

            if (!user) {
                console.warn(`[AUTH ERROR] Usuário não encontrado no banco: ${email}`);
                return res.status(401).json({ error: 'Erro ao realizar login. Verifique suas credenciais.' });
            }

            console.log(`[AUTH] Comparando senhas para ${email}...`);
            const isPasswordValid = await AuthService.comparePasswords(password, user.password);

            if (!isPasswordValid) {
                console.warn(`[AUTH ERROR] Senha incorreta para o usuário: ${email}`);
                return res.status(401).json({ error: 'Erro ao realizar login. Verifique suas credenciais.' });
            }

            console.log(`Login bem-sucedido: ${email} (${user.role})`);

            const token = AuthService.generateToken({
                id: user.id,
                email: user.email,
                role: user.role,
                clinicId: user.clinicId || undefined
            });

            res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    hasSeenOnboarding: user.hasSeenOnboarding,
                    clinic: user.clinic
                },
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Erro interno no servidor' });
        }
    }

    static async me(req: any, res: Response) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { clinic: true }
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                hasSeenOnboarding: user.hasSeenOnboarding,
                clinic: user.clinic
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    }

    static async completeOnboarding(req: any, res: Response) {
        try {
            const userId = req.user.id;
            
            await prisma.user.update({
                where: { id: userId },
                data: { hasSeenOnboarding: true }
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Error completing onboarding:', error);
            res.status(500).json({ error: 'Erro ao atualizar status de onboarding.' });
        }
    }
}
