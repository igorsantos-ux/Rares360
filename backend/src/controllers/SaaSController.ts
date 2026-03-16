import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthService } from '../services/AuthService.js';
import { BillingService } from '../services/BillingService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        const dir = 'uploads/logos';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({
    storage,
    fileFilter: (req: any, file: any, cb: any) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, webp)'));
    },
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

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

            // Seed de Documentos Sugeridos (v15.0)
            const suggestedDocuments = [
                // Clínica
                { title: 'Contrato Social / Cartão CNPJ', category: 'Clínica' },
                { title: 'Alvará de Funcionamento', category: 'Clínica' },
                { title: 'Alvará Sanitário (VISA)', category: 'Clínica' },
                { title: 'LTA (Laudo Técnico de Avaliação)', category: 'Clínica' },
                { title: 'PGRSS (Plano de Resíduos)', category: 'Clínica' },
                { title: 'Seguro Resp. Civil Operacional', category: 'Clínica' },
                // Corpo Clínico
                { title: 'CRM e RQE', category: 'Médico' },
                { title: 'Diploma e Certificados', category: 'Médico' },
                { title: 'Seguro Resp. Civil Profissional', category: 'Médico' },
                { title: 'Contrato de Prestação de Serviço', category: 'Médico' },
                // Templates
                { title: 'TCLE (Termo de Consentimento)', category: 'Templates' },
                { title: 'Contrato Prestação de Serviço ao Paciente', category: 'Templates' },
                { title: 'Termo de Uso de Imagem', category: 'Templates' }
            ];

            await prisma.clinicDocument.createMany({
                data: suggestedDocuments.map(doc => ({
                    ...doc,
                    clinicId: clinic.id,
                    status: 'PENDENTE'
                }))
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

    static async deleteClinic(req: any, res: Response) {
        try {
            const { id } = req.params;

            // Delete all related records first to avoid foreign key constraints
            await prisma.$transaction([
                prisma.transaction.deleteMany({ where: { clinicId: id } }),
                prisma.doctor.deleteMany({ where: { clinicId: id } }),
                prisma.patient.deleteMany({ where: { clinicId: id } }),
                prisma.stockItem.deleteMany({ where: { clinicId: id } }),
                prisma.financialGoal.deleteMany({ where: { clinicId: id } }),
                prisma.document.deleteMany({ where: { clinicId: id } }),
                prisma.user.deleteMany({ where: { clinicId: id } }),
                prisma.clinic.delete({ where: { id } })
            ]);

            res.json({ message: 'Clínica e todos os dados vinculados foram excluídos com sucesso' });
        } catch (error) {
            console.error('Error deleting clinic:', error);
            res.status(500).json({ error: 'Erro ao excluir clínica' });
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
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Erro ao criar usuário' });
        }
    }

    static async updateUser(req: any, res: Response) {
        try {
            const { id } = req.params;
            const { name, email, role, clinicId, password, isActive } = req.body;

            const data: any = {
                name,
                email,
                role,
                clinicId: clinicId === '' ? null : clinicId,
                isActive
            };

            if (password && password.trim() !== '') {
                data.password = await AuthService.hashPassword(password);
            }

            const user = await prisma.user.update({
                where: { id },
                data
            });

            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clinicId: user.clinicId,
                isActive: user.isActive
            });
        } catch (error: any) {
            console.error('Error updating user:', error);
            if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                return res.status(400).json({ error: 'E-mail já cadastrado por outro usuário.' });
            }
            res.status(500).json({ error: 'Erro ao atualizar usuário' });
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

    static async uploadLogo(req: Request, res: Response) {
        try {
            const file = (req as any).file;
            if (!file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            const protocol = req.protocol;
            const host = req.get('host');
            const logoUrl = `${protocol}://${host}/uploads/logos/${file.filename}`;

            res.json({ url: logoUrl });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
