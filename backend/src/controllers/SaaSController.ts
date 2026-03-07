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

            const parseDate = (val: any) => {
                if (!val || typeof val !== 'string' || val.trim() === '') return null;
                const d = new Date(val);
                return isNaN(d.getTime()) ? null : d;
            };

            const parseFloatSafe = (val: any) => {
                if (val === null || val === undefined || val === '') return null;
                const f = parseFloat(val);
                return isNaN(f) ? null : f;
            };

            const clinic = await prisma.clinic.create({
                data: {
                    name,
                    razaoSocial,
                    cnpj: cnpj?.trim() || null,
                    inscricaoEstadual,
                    inscricaoMunicipal,
                    cnae,
                    regimeTributario,
                    dataAbertura: parseDate(dataAbertura),
                    cep: cep?.trim() || null,
                    logradouro,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    telefone,
                    whatsapp,
                    email,
                    site,
                    codigoServico,
                    aliquotaISS: parseFloatSafe(aliquotaISS),
                    certificadoDigitalUrl,
                    banco,
                    agencia,
                    conta,
                    tipoConta,
                    chavePix,
                    logo,
                    corMarca,
                    responsavelAdmin,
                    responsavelTecnico,
                    crmResponsavel,
                    registroVigilancia,
                    cnes,
                    pricePerUser: parseFloatSafe(pricePerUser) || 50.0
                }
            });
            res.status(200).json(clinic);
        } catch (error: any) {
            console.error('Error creating clinic:', error);

            // Tratamento específico para CNPJ duplicado (Prisma P2002)
            if (error.code === 'P2002' && error.meta?.target?.includes('cnpj')) {
                return res.status(400).json({
                    error: 'Este CNPJ já está cadastrado em outra clínica.'
                });
            }

            res.status(500).json({ error: 'Erro ao criar clínica no servidor. Verifique os dados ou tente novamente mais tarde.' });
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

            const parseDate = (val: any) => {
                if (val === undefined) return undefined;
                if (!val || typeof val !== 'string' || val.trim() === '') return null;
                const d = new Date(val);
                return isNaN(d.getTime()) ? null : d;
            };

            const parseFloatSafe = (val: any) => {
                if (val === undefined) return undefined;
                if (val === null || val === '') return undefined; // Use undefined for updates so Prisma doesn't try to set a non-nullable field to null
                const f = parseFloat(val);
                return isNaN(f) ? undefined : f;
            };

            const clinic = await prisma.clinic.update({
                where: { id },
                data: {
                    name,
                    razaoSocial,
                    cnpj: cnpj !== undefined ? (cnpj?.trim() || null) : undefined,
                    inscricaoEstadual,
                    inscricaoMunicipal,
                    cnae,
                    regimeTributario,
                    dataAbertura: parseDate(dataAbertura),
                    cep: cep !== undefined ? (cep?.trim() || null) : undefined,
                    logradouro,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    telefone,
                    whatsapp,
                    email,
                    site,
                    codigoServico,
                    aliquotaISS: parseFloatSafe(aliquotaISS),
                    certificadoDigitalUrl,
                    banco,
                    agencia,
                    conta,
                    tipoConta,
                    chavePix,
                    logo,
                    corMarca,
                    responsavelAdmin,
                    responsavelTecnico,
                    crmResponsavel,
                    registroVigilancia,
                    cnes,
                    pricePerUser: parseFloatSafe(pricePerUser),
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
