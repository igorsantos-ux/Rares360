import { Request, Response } from 'express';
import prisma, { basePrisma } from '../lib/prisma.js';
import { AuthService } from '../services/AuthService.js';
import { BillingService } from '../services/BillingService.js';
import { MailService } from '../services/MailService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

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
            const clinics = await basePrisma.clinic.findMany({
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
                registroVigilancia, cnes, pricePerUser, plan
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

            const clinic = await basePrisma.clinic.create({
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
                    pricePerUser: parseFloatSafe(pricePerUser) || 50.0,
                    plan: plan || 'Essencial',
                    implementationFee: parseFloatSafe(req.body.implementationFee) || 0,
                    monthlyFee: parseFloatSafe(req.body.monthlyFee) || 0,
                    proposalUrl: req.body.proposalUrl || null
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

            await basePrisma.clinicDocument.createMany({
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
                registroVigilancia, cnes, pricePerUser, isActive, plan
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

            const clinic = await basePrisma.clinic.update({
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
                    plan,
                    implementationFee: parseFloatSafe(req.body.implementationFee),
                    monthlyFee: parseFloatSafe(req.body.monthlyFee),
                    proposalUrl: req.body.proposalUrl,
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
            await basePrisma.$transaction([
                basePrisma.transaction.deleteMany({ where: { clinicId: id } }),
                basePrisma.accountPayable.deleteMany({ where: { clinicId: id } }),
                basePrisma.dailyClosure.deleteMany({ where: { clinicId: id } }),
                basePrisma.inventoryItem.deleteMany({ where: { clinicId: id } }),
                basePrisma.stockMovement.deleteMany({ where: { clinicId: id } }),
                basePrisma.financialGoal.deleteMany({ where: { clinicId: id } }),
                basePrisma.lead.deleteMany({ where: { clinicId: id } }),
                basePrisma.document.deleteMany({ where: { clinicId: id } }),
                basePrisma.clinicDocument.deleteMany({ where: { clinicId: id } }),
                basePrisma.pricingSimulation.deleteMany({ where: { clinicId: id } }),
                basePrisma.procedureExecution.deleteMany({ where: { clinicId: id } }),
                basePrisma.procedure.deleteMany({ where: { clinicId: id } }),
                basePrisma.task.deleteMany({ where: { clinicId: id } }),
                basePrisma.doctor.deleteMany({ where: { clinicId: id } }),
                basePrisma.patient.deleteMany({ where: { clinicId: id } }),
                basePrisma.importBatch.deleteMany({ where: { clinicId: id } }),
                basePrisma.appointment.deleteMany({ where: { clinicId: id } }),
                basePrisma.user.deleteMany({ where: { clinicId: id } }),
                basePrisma.clinic.delete({ where: { id } })
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
            const users = await basePrisma.user.findMany({
                include: { clinic: { select: { name: true } } }
            });
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    }

    static async createUser(req: any, res: Response) {
        try {
            const { name, email, role, clinicId } = req.body;
            let { password } = req.body;

            const existingUser = await basePrisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email já cadastrado' });
            }

            // Gerar senha temporária forte (12 chars: maiúsculas + minúsculas + números + símbolo)
            if (!password) {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
                password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

                // Garantir pelo menos 1 de cada tipo
                const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const lower = 'abcdefghijklmnopqrstuvwxyz';
                const numbers = '0123456789';
                const symbols = '!@#$%^&*()_+';

                password =
                    upper[Math.floor(Math.random() * upper.length)] +
                    lower[Math.floor(Math.random() * lower.length)] +
                    numbers[Math.floor(Math.random() * numbers.length)] +
                    symbols[Math.floor(Math.random() * symbols.length)] +
                    password.substring(4);
            }

            const hashedPassword = await AuthService.hashPassword(password);

            const user = await basePrisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    clinicId: clinicId === '' ? null : clinicId,
                    mustChangePassword: true, // Sempre obrigatório mudar no primeiro acesso
                    isFirstAccess: true,
                    temporaryPasswordExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // expira em 72h
                    createdByAdminId: req.user?.id,
                    passwordUpdatedAt: new Date()
                }
            });

            // Registrar no histórico inicial
            await basePrisma.passwordHistory.create({
                data: {
                    userId: user.id,
                    hash: hashedPassword
                }
            });

            // Disparar e-mail de Onboarding
            try {
                await MailService.sendOnboardingEmail(email, name, password);
            } catch (mailError) {
                console.error('[SaaS] Alerta: Usuário criado, mas falha ao enviar e-mail:', mailError);
            }

            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clinicId: user.clinicId,
                tempPassword: password // Retorna para o Admin também
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
                data.passwordUpdatedAt = new Date();
            }

            const user = await basePrisma.user.update({
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

    static async deleteUser(req: any, res: Response) {
        try {
            const { id } = req.params;
            console.log(`[SaaS] Tentando excluir usuário: ${id}`);

            await basePrisma.user.delete({ where: { id } });

            console.log(`[SaaS] Usuário ${id} excluído com sucesso.`);
            res.json({ message: 'Usuário excluído com sucesso' });
        } catch (error: any) {
            console.error('[SaaS Error] Falha ao excluir usuário:', error);

            if (error.code === 'P2003') {
                return res.status(400).json({
                    error: 'Não é possível excluir este usuário pois ele possui registros financeiros (ex: fechamento de caixa) vinculados.'
                });
            }

            if (error.code === 'P2025') {
                return res.status(404).json({
                    error: 'Usuário não encontrado.'
                });
            }

            res.status(500).json({
                error: 'Erro interno ao excluir usuário. Verifique se existem registros vinculados ou tente novamente.'
            });
        }
    }

    static async impersonateClinic(req: any, res: Response) {
        try {
            const adminId = req.user.id;
            let adminName = req.user.name;

            // Fallback: Se o token for antigo e não transportar o 'name', buscamos no banco.
            if (!adminName) {
                const adminUser = await basePrisma.user.findUnique({ where: { id: adminId } });
                adminName = adminUser?.name || 'Administrador Global';
            }

            const { clinicId } = req.params;

            // Encontrar o usuário master da clínica (OWNER ou ADMIN) ou pegar o primeiro CLINIC_ADMIN
            const targetUser = await basePrisma.user.findFirst({
                where: {
                    clinicId,
                    role: { in: ['OWNER', 'ADMIN', 'CLINIC_ADMIN'] },
                    isActive: true
                },
                orderBy: { createdAt: 'asc' }
            });

            if (!targetUser) {
                return res.status(404).json({ error: 'Nenhum usuário administrador ativo encontrado nesta clínica para impersonar.' });
            }

            const targetClinic = await basePrisma.clinic.findUnique({ where: { id: clinicId } });

            // Gerar token da clínica
            const token = AuthService.generateToken({
                id: targetUser.id,
                email: targetUser.email,
                name: targetUser.name,
                role: targetUser.role,
                clinicId: targetUser.clinicId || undefined
            });

            // Registrar log de auditoria
            await basePrisma.adminAuditLog.create({
                data: {
                    adminId,
                    adminName,
                    targetClinicId: clinicId,
                    targetClinicName: targetClinic?.name || 'Clínica Desconhecida',
                    action: 'CONTEXT_SWITCH'
                }
            });

            res.json({
                user: {
                    id: targetUser.id,
                    name: targetUser.name,
                    email: targetUser.email,
                    role: targetUser.role,
                    hasSeenOnboarding: targetUser.hasSeenOnboarding,
                    clinic: targetClinic
                },
                token
            });

        } catch (error) {
            console.error('Error impersonating clinic:', error);
            res.status(500).json({ error: 'Erro ao tentar acessar a conta da clínica.' });
        }
    }

    static async getBillingSummary(req: any, res: Response) {
        try {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            const invoices = await basePrisma.invoice.findMany({
                where: { month: currentMonth, year: currentYear }
            });

            const clinics = await basePrisma.clinic.findMany({
                include: {
                    _count: {
                        select: { users: true }
                    }
                }
            });

            const summary = clinics.map((c: any) => {
                const clinicInvoices = invoices.filter(inv => inv.clinicId === c.id);
                const hasInvoices = clinicInvoices.length > 0;

                const data = {
                    id: c.id,
                    name: c.name,
                    cnpj: c.cnpj,
                    userCount: c._count.users,
                    pricePerUser: c.monthlyFee > 0 ? c.monthlyFee : c.pricePerUser,
                    total: 0,
                    invoices: clinicInvoices,
                    contractStartDate: c.contractStartDate,
                    contractDurationMonths: c.contractDurationMonths,
                    contractStatus: c.contractStatus
                };

                if (hasInvoices) {
                    data.total = clinicInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
                } else {
                    data.total = c.monthlyFee > 0 ? c.monthlyFee : (c._count.users * c.pricePerUser);
                }
                return data;
            });

            res.json(summary);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao gerar relatório de faturamento' });
        }
    }

    static async generateMonthlyInvoices(req: any, res: Response) {
        try {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            const clinics = await basePrisma.clinic.findMany({
                where: { isActive: true },
                include: { _count: { select: { users: true } } }
            });

            let generatedCount = 0;

            for (const clinic of clinics) {
                // Verificar se já existe fatura deste mês
                const existing = await basePrisma.invoice.findFirst({
                    where: { clinicId: clinic.id, month: currentMonth, year: currentYear }
                });
                if (existing) continue;

                const mensalidade = clinic.monthlyFee && clinic.monthlyFee > 0
                    ? clinic.monthlyFee
                    : (clinic._count.users * clinic.pricePerUser);

                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 5);

                const setupRemaining = clinic.setupRemainingInstallments || 0;
                const hasSetupPending = setupRemaining > 0;
                let setupPortion = 0;

                if (hasSetupPending && clinic.setupValue && clinic.setupInstallments) {
                    setupPortion = clinic.setupValue / clinic.setupInstallments;
                }

                if (hasSetupPending && clinic.setupPaymentType === 'DILUIDO_NA_MENSALIDADE') {
                    await basePrisma.invoice.create({
                        data: {
                            clinicId: clinic.id,
                            month: currentMonth,
                            year: currentYear,
                            description: `Mensalidade + Setup (Parc. ${clinic.setupInstallments! - setupRemaining + 1}/${clinic.setupInstallments})`,
                            saasAmount: mensalidade,
                            setupAmount: setupPortion,
                            totalAmount: mensalidade + setupPortion,
                            type: 'MENSALIDADE_E_SETUP',
                            dueDate
                        }
                    });

                    await basePrisma.clinic.update({
                        where: { id: clinic.id },
                        data: { setupRemainingInstallments: setupRemaining - 1 }
                    });
                    generatedCount++;

                } else if (hasSetupPending && clinic.setupPaymentType === 'PARCELADO_SEPARADO') {
                    await basePrisma.invoice.create({
                        data: {
                            clinicId: clinic.id,
                            month: currentMonth,
                            year: currentYear,
                            description: 'Mensalidade SaaS',
                            saasAmount: mensalidade,
                            setupAmount: 0,
                            totalAmount: mensalidade,
                            type: 'MENSALIDADE',
                            dueDate
                        }
                    });

                    await basePrisma.invoice.create({
                        data: {
                            clinicId: clinic.id,
                            month: currentMonth,
                            year: currentYear,
                            description: `Taxa de Implementação (Parc. ${clinic.setupInstallments! - setupRemaining + 1}/${clinic.setupInstallments})`,
                            saasAmount: 0,
                            setupAmount: setupPortion,
                            totalAmount: setupPortion,
                            type: 'SETUP',
                            dueDate
                        }
                    });

                    await basePrisma.clinic.update({
                        where: { id: clinic.id },
                        data: { setupRemainingInstallments: setupRemaining - 1 }
                    });
                    generatedCount += 2;

                } else {
                    await basePrisma.invoice.create({
                        data: {
                            clinicId: clinic.id,
                            month: currentMonth,
                            year: currentYear,
                            description: 'Mensalidade SaaS',
                            saasAmount: mensalidade,
                            setupAmount: 0,
                            totalAmount: mensalidade,
                            type: 'MENSALIDADE',
                            dueDate
                        }
                    });
                    generatedCount++;
                }
            }

            res.json({ message: `Faturamento processado. ${generatedCount} faturas criadas.` });

        } catch (error: any) {
            console.error('Error generating invoices:', error);
            res.status(500).json({ error: 'Erro ao gerar faturas' });
        }
    }

    static async getClinicInvoices(req: any, res: Response) {
        try {
            const { clinicId } = req.params;
            const invoices = await basePrisma.invoice.findMany({
                where: { clinicId },
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
            res.json(invoices);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            res.status(500).json({ error: 'Erro ao buscar faturas da clínica' });
        }
    }

    static async generateInvoicePDF(req: any, res: Response) {
        try {
            const { clinicId } = req.params;
            const clinic = await basePrisma.clinic.findUnique({
                where: { id: clinicId },
                include: { _count: { select: { users: true } } }
            });

            if (!clinic) return res.status(404).json({ error: 'Clínica não encontrada' });

            const pdfBuffer = await BillingService.generatePDF({
                clinicName: clinic.name,
                razaoSocial: clinic.razaoSocial || clinic.name,
                cnpj: clinic.cnpj || '00.000.000/0000-00',
                address: `${clinic.logradouro || ''}, ${clinic.numero || ''} ${clinic.complemento || ''} - ${clinic.bairro || ''}, ${clinic.cidade || ''}/${clinic.estado || ''}`.trim(),
                userCount: clinic._count.users,
                pricePerUser: clinic.pricePerUser,
                monthlyFee: clinic.monthlyFee || 0,
                setupValue: clinic.setupValue || 0,
                setupInstallments: clinic.setupInstallments || 1,
                setupRemaining: clinic.setupRemainingInstallments || 0,
                contractStartDate: clinic.contractStartDate || clinic.createdAt,
                contractDuration: clinic.contractDurationMonths || 12,
                status: 'PENDENTE', // Valor padrão para fatura draft/on-the-fly
                total: (clinic.monthlyFee || (clinic._count.users * clinic.pricePerUser)) +
                    (clinic.setupPaymentType === 'DILUIDO_NA_MENSALIDADE' && (clinic.setupRemainingInstallments || 0) > 0
                        ? ((clinic.setupValue || 0) / (clinic.setupInstallments || 1)) : 0)
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
            const clinic = await basePrisma.clinic.findUnique({
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
