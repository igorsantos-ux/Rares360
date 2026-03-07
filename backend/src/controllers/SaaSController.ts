import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthService } from '../services/AuthService.js';

export class SaaSController {
    // Gestão de Clínicas
    static async listClinics(req: any, res: Response) {
        try {
            const clinics = await prisma.clinic.findMany({
                include: {
                    _count: {
                        select: { users: true }
                    }
                }
            });
            res.json(clinics);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar clínicas' });
        }
    }

    static async createClinic(req: any, res: Response) {
        try {
            const { name, cnpj, address } = req.body;
            const clinic = await prisma.clinic.create({
                data: { name, cnpj, address }
            });
            res.status(201).json(clinic);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao criar clínica' });
        }
    }

    // Gestão de Usuários
    static async listUsers(req: any, res: Response) {
        try {
            const users = await prisma.user.findMany({
                include: { clinic: { select: { name: true } } }
            });
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    }

    static async createUser(req: any, res: Response) {
        try {
            const { name, email, password, role, clinicId } = req.body;

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email já cadastrado' });
            }

            const hashedPassword = await AuthService.hashPassword(password);
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    clinicId
                }
            });

            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clinicId: user.clinicId
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao criar usuário' });
        }
    }
}
