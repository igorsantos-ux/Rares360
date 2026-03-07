import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthService } from '../services/AuthService.js';
import { BillingService } from '../services/BillingService.js';

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
            const {
                name, razaoSocial, cnpj, inscricaoEstadual, inscricaoMunicipal, cnae, regimeTributario, dataAbertura,
                cep, logradouro, numero, complemento, bairro, cidade, estado,
                telefone, whatsapp, email, site,
                codigoServico, aliquotaISS, certificadoDigitalUrl,
                banco, agencia, conta, tipoConta, chavePix,
                logo, corMarca, responsavelAdmin, responsavelTecnico, crmResponsavel,
                registroVigilancia, cnes, pricePerUser
            } = req.body;

            const clinic = await prisma.clinic.create({
                data: {
                    name, razaoSocial, cnpj, inscricaoEstadual, inscricaoMunicipal, cnae, regimeTributario,
                    dataAbertura: dataAbertura ? new Date(dataAbertura) : null,
                    cep, logradouro, numero, complemento, bairro, cidade, estado,
                    telefone, whatsapp, email, site,
                    codigoServico,
                    aliquotaISS: aliquotaISS ? parseFloat(aliquotaISS) : null,
                    certificadoDigitalUrl,
                    banco, agencia, conta, tipoConta, chavePix,
                    logo, corMarca, responsavelAdmin, responsavelTecnico, crmResponsavel,
                    registroVigilancia, cnes,
                    pricePerUser: pricePerUser ? parseFloat(pricePerUser) : 50.0
                }
            });
            res.status(201).json(clinic);
        } catch (error) {
            console.error('Error creating clinic:', error);
            res.status(500).json({ error: 'Erro ao criar clínica' });
        }
    }

    static async updateClinic(req: any, res: Response) {
        try {
            const { id } = req.params;
            const {
                name, razaoSocial, cnpj, inscricaoEstadual, inscricaoMunicipal, cnae, regimeTributario, dataAbertura,
                cep, logradouro, numero, complemento, bairro, cidade, estado,
                telefone, whatsapp, email, site,
                codigoServico, aliquotaISS, certificadoDigitalUrl,
                banco, agencia, conta, tipoConta, chavePix,
                logo, corMarca, responsavelAdmin, responsavelTecnico, crmResponsavel,
                registroVigilancia, cnes, pricePerUser, isActive
            } = req.body;

            const clinic = await prisma.clinic.update({
                where: { id },
                data: {
                    name, razaoSocial, cnpj, inscricaoEstadual, inscricaoMunicipal, cnae, regimeTributario,
                    dataAbertura: dataAbertura ? new Date(dataAbertura) : undefined,
                    cep, logradouro, numero, complemento, bairro, cidade, estado,
                    telefone, whatsapp, email, site,
                    codigoServico,
                    aliquotaISS: aliquotaISS !== undefined ? parseFloat(aliquotaISS) : undefined,
                    certificadoDigitalUrl,
                    banco, agencia, conta, tipoConta, chavePix,
                    logo, corMarca, responsavelAdmin, responsavelTecnico, crmResponsavel,
                    registroVigilancia, cnes,
                    pricePerUser: pricePerUser !== undefined ? parseFloat(pricePerUser) : undefined,
                    isActive
                }
            });
            res.json(clinic);
        } catch (error) {
            console.error('Error updating clinic:', error);
            res.status(500).json({ error: 'Erro ao atualizar clínica' });
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

    static async getBillingSummary(req: any, res: Response) {
        try {
            const clinics = await prisma.clinic.findMany({
                include: {
                    _count: {
                        select: { users: true }
                    }
                }
            });

            const summary = clinics.map(c => ({
                id: c.id,
                name: c.name,
                cnpj: c.cnpj,
                userCount: c._count.users,
                pricePerUser: c.pricePerUser,
                total: c._count.users * c.pricePerUser
            }));

            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao gerar relatório de faturamento' });
        }
    }

    static async generateInvoicePDF(req: any, res: Response) {
        try {
            const { clinicId } = req.params;
            const clinic = await prisma.clinic.findUnique({
                where: { id: clinicId },
                include: { _count: { select: { users: true } } }
            });

            if (!clinic) return res.status(404).json({ error: 'Clínica não encontrada' });

            const pdfBuffer = await BillingService.generatePDF({
                clinicName: clinic.name,
                userCount: clinic._count.users,
                pricePerUser: clinic.pricePerUser,
                total: clinic._count.users * clinic.pricePerUser
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=fatura-${clinic.name}.pdf`);
            res.send(pdfBuffer);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao gerar PDF' });
        }
    }

    static async generateInvoiceXML(req: any, res: Response) {
        try {
            const { clinicId } = req.params;
            const clinic = await prisma.clinic.findUnique({
                where: { id: clinicId },
                include: { _count: { select: { users: true } } }
            });

            if (!clinic) return res.status(404).json({ error: 'Clínica não encontrada' });

            const xml = BillingService.generateXML({
                clinicName: clinic.name,
                cnpj: clinic.cnpj || '',
                userCount: clinic._count.users,
                pricePerUser: clinic.pricePerUser,
                total: clinic._count.users * clinic.pricePerUser
            });

            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Content-Disposition', `attachment; filename=fatura-${clinic.name}.xml`);
            res.send(xml);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao gerar XML' });
        }
    }
}
