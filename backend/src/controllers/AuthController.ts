import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthService } from '../services/AuthService.js';

// SEC-019: Regex de validação de força de senha
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=]).{8,128}$/;

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email: rawEmail, password } = req.body;
            const email = rawEmail?.toLowerCase().trim();

            const user = await prisma.user.findUnique({
                where: { email },
                include: { clinic: true }
            });

            if (!user) {
                console.warn(`[AUTH ERROR] Usuário não encontrado no banco: ${email}`);
                return res.status(401).json({ error: 'Erro ao realizar login. Verifique suas credenciais.' });
            }

            if (!user.isActive) {
                console.warn(`[AUTH ERROR] Usuário inativo tentando login: ${email}`);
                return res.status(403).json({ error: 'Sua conta está desativada. Entre em contato com a TI RARES.' });
            }

            const isPasswordValid = await AuthService.comparePasswords(password, user.password);

            if (!isPasswordValid) {
                console.warn(`[AUTH ERROR] Senha incorreta para o usuário: ${email}`);
                return res.status(401).json({ error: 'Erro ao realizar login. Verifique suas credenciais.' });
            }

            // --- PROTOCOLO DE SEGURANÇA RARES ---

            // 1. Verificação de Expiração (90 dias)
            const diffInMs = Date.now() - new Date(user.passwordUpdatedAt).getTime();
            const passwordAgeInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
            const isPasswordExpired = passwordAgeInDays >= 90;



            // 2. Verificação de Senha Temporária
            if (user.temporaryPasswordExpiresAt && new Date() > user.temporaryPasswordExpiresAt) {
                console.warn(`[AUTH] Senha temporária expirada para: ${email}`);
                return res.status(403).json({ error: 'Sua senha temporária expirou. Solicite uma nova senha ao administrador.' });
            }

            // Se a senha estiver expirada ou o reset for obrigatório
            if (user.mustChangePassword || isPasswordExpired) {

                const token = AuthService.generateToken({
                    id: user.id,
                    role: user.role,
                    clinicId: user.clinicId || undefined,
                    mustChangePassword: true
                });

                return res.json({
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        mustChangePassword: true,
                        passwordExpired: isPasswordExpired
                    },
                    token,
                    requirePasswordChange: true // Flag extra para o frontend facilitar o redirecionamento
                });
            }



            const token = AuthService.generateToken({
                id: user.id,
                role: user.role,
                clinicId: user.clinicId || undefined,
                mustChangePassword: false
            });

            const refreshToken = AuthService.generateRefreshToken({ id: user.id });

            // Atualiza lastLoginAt
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() }
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
                token,
                refreshToken
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Erro interno no servidor' });
        }
    }

    static async refresh(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(401).json({ error: 'Refresh token ausente' });
            }

            const decoded = AuthService.verifyToken(refreshToken, true);
            if (!decoded) {
                return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
            }

            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user || !user.isActive) {
                return res.status(401).json({ error: 'Usuário inválido ou inativo' });
            }

            const newToken = AuthService.generateToken({
                id: user.id,
                role: user.role,
                clinicId: user.clinicId || undefined,
                mustChangePassword: user.mustChangePassword
            });

            const newRefreshToken = AuthService.generateRefreshToken({ id: user.id });

            res.json({ token: newToken, refreshToken: newRefreshToken });
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({ error: 'Erro interno no servidor' });
        }
    }

    static async updatePassword(req: any, res: Response) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            console.log(`[AUTH] Atualização de senha solicitada para usuário: ${userId}`);

            // SEC-019: Validar força da nova senha
            if (!PASSWORD_REGEX.test(newPassword)) {
                return res.status(400).json({
                    error: 'A senha deve conter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.'
                });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    // SEC-017: Verificar últimas 5 senhas (não 3)
                    passwordHistory: {
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    }
                }
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Se não for o reset obrigatório do primeiro acesso, validamos a senha atual
            if (!user.mustChangePassword) {
                if (!currentPassword) {
                    return res.status(400).json({ error: 'A senha atual é obrigatória para esta operação.' });
                }
                const isMatch = await AuthService.comparePasswords(currentPassword, user.password);
                if (!isMatch) {
                    return res.status(400).json({ error: 'A senha atual informada está incorreta.' });
                }
            }

            // --- VALIDAÇÃO DE HISTÓRICO (Últimas 3 senhas) ---
            for (const historyEntry of user.passwordHistory) {
                const isReused = await AuthService.comparePasswords(newPassword, historyEntry.hash);
                if (isReused) {
                    return res.status(400).json({
                        error: 'Por motivos de segurança, você não pode reutilizar nenhuma das suas últimas 5 senhas.'
                    });
                }
            }

            const hashedNewPassword = await AuthService.hashPassword(newPassword);

            await prisma.$transaction(async (tx) => {
                // 1. Atualizar o usuário
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        password: hashedNewPassword,
                        mustChangePassword: false,
                        isFirstAccess: false,
                        temporaryPasswordExpiresAt: null,
                        passwordUpdatedAt: new Date()
                    }
                });

                // 2. Registrar no histórico
                await tx.passwordHistory.create({
                    data: {
                        userId: userId,
                        hash: hashedNewPassword
                    }
                });

                // 3. Manter apenas as 3 últimas entradas no histórico para este usuário
                const historyCount = await tx.passwordHistory.count({ where: { userId } });
                if (historyCount > 5) {
                    const oldestEntries = await tx.passwordHistory.findMany({
                        where: { userId },
                        orderBy: { createdAt: 'asc' },
                        take: historyCount - 5
                    });

                    await tx.passwordHistory.deleteMany({
                        where: { id: { in: oldestEntries.map(e => e.id) } }
                    });
                }
            });

            console.log(`[AUTH] Senha do usuário ${userId} atualizada com sucesso. Gerando novo token...`);

            // Gerar novo token com as flags de segurança atualizadas
            const newToken = AuthService.generateToken({
                id: user.id,
                role: user.role,
                clinicId: user.clinicId || undefined,
                mustChangePassword: false // Agora é falso
            });

            const newRefreshToken = AuthService.generateRefreshToken({ id: user.id });

            res.json({
                success: true,
                message: 'Sua senha foi atualizada com sucesso!',
                token: newToken,
                refreshToken: newRefreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    clinicId: user.clinicId || undefined,
                    mustChangePassword: false
                }
            });
        } catch (error) {
            console.error('Error updating password:', error);
            res.status(500).json({ error: 'Erro interno ao atualizar a senha. Tente novamente mais tarde.' });
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
                clinic: user.clinic,
                mustChangePassword: user.mustChangePassword
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

    static async logout(req: any, res: Response) {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                const redisClient = (await import('../lib/redis.js')).default;

                if (redisClient && token) {
                    // Bloqueia o token por 8 horas (tempo máximo de sessão)
                    await redisClient.set(`blacklist_${token}`, 'true', 'EX', 28800);
                }
            }

            res.json({ success: true, message: 'Logout realizado com sucesso' });
        } catch (error) {
            console.error('[AUTH] Erro ao realizar logout:', error);
            // Mesmo se o Redis falhar, retornamos sucesso porque o frontend vai limpar o local
            res.json({ success: true, message: 'Logout realizado com sucesso (local-only)' });
        }
    }
}
