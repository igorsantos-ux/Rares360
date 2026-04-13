import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthService } from '../services/AuthService.js';

export class UserManagementController {
    static async listUsers(req: any, res: Response) {
        try {
            const { clinicId } = req.user;

            const users = await prisma.user.findMany({
                where: {
                    clinicId,
                    role: { not: 'ADMIN_GLOBAL' }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    permissions: true,
                    isActive: true,
                    createdAt: true
                },
                orderBy: { name: 'asc' }
            });

            res.json(users);
        } catch (error) {
            console.error('Error listing users:', error);
            res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    }

    static async createUser(req: any, res: Response) {
        try {
            const { clinicId } = req.user;
            const { name, email, role, permissions, password } = req.body;

            const existingUser = await prisma.user.findUnique({
                where: { email: email.toLowerCase().trim() }
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Este e-mail já está em uso.' });
            }

            const hashedPassword = await AuthService.hashPassword(password);

            const newUser = await prisma.user.create({
                data: {
                    name,
                    email: email.toLowerCase().trim(),
                    password: hashedPassword,
                    role,
                    permissions: permissions || {}, // JSON de permissões granulares
                    clinicId,
                    mustChangePassword: true, // Força a troca no primeiro login
                    isActive: true
                }
            });

            res.status(201).json({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Erro ao criar novo integrante da equipe' });
        }
    }

    static async updateUser(req: any, res: Response) {
        try {
            const { id } = req.params;
            const { clinicId } = req.user;
            const { name, role, permissions, isActive } = req.body;

            // Segurança: Não permitir que o usuário logado desative a si mesmo ou mude seu próprio papel para algo inferior se for o único OWNER
            if (id === req.user.id && (isActive === false || role !== 'OWNER')) {
                const ownerCount = await prisma.user.count({
                    where: { clinicId, role: 'OWNER', isActive: true }
                });

                if (ownerCount <= 1 && req.user.role === 'OWNER') {
                    return res.status(403).json({ error: 'Você é o único OWNER ativo desta clínica e não pode se desativar ou mudar seu cargo.' });
                }
            }

            const updatedUser = await prisma.user.update({
                where: { id },
                data: {
                    name,
                    role,
                    permissions,
                    isActive
                }
            });

            res.json(updatedUser);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Erro ao atualizar dados do integrante' });
        }
    }

    static async deleteUser(req: any, res: Response) {
        try {
            const { id } = req.params;
            const { clinicId } = req.user;

            if (id === req.user.id) {
                return res.status(403).json({ error: 'Não é possível excluir seu próprio usuário.' });
            }

            // Desativação lógica por segurança
            await prisma.user.update({
                where: { id },
                data: { isActive: false }
            });

            res.json({ success: true, message: 'Usuário desativado com sucesso.' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Erro ao remover integrante' });
        }
    }
}
