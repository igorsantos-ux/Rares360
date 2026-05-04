import { Request, Response } from 'express';
import prisma, { basePrisma } from '../lib/prisma.js';
import { AuthService } from '../services/AuthService.js';
import { BillingService } from '../services/BillingService.js';
import { createAuditLog } from '../lib/auditLogger.js';
import { MailService } from '../services/MailService.js';
import multer from 'multer';
import { storageProvider } from '../lib/StorageService.js';
import crypto from 'crypto';
import path from 'path';

const storage = multer.memoryStorage();

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
                // Módulo de Faturamento V2 e dependências complexas (Filhos primeiro)
                basePrisma.baixaEstoqueExecucao.deleteMany({ where: { execucao: { contaItem: { conta: { clinicId: id } } } } }),
                basePrisma.execucaoProcedimentoV2.deleteMany({ where: { contaItem: { conta: { clinicId: id } } } }),
                basePrisma.parcelaContaPaciente.deleteMany({ where: { conta: { clinicId: id } } }),
                basePrisma.contaPacienteItem.deleteMany({ where: { conta: { clinicId: id } } }),
                basePrisma.documentoPaciente.deleteMany({ where: { paciente: { clinicId: id } } }),
                basePrisma.orcamentoItem.deleteMany({ where: { orcamento: { clinicId: id } } }),
                basePrisma.contrato.deleteMany({ where: { clinicId: id } }),
                basePrisma.orcamento.deleteMany({ where: { clinicId: id } }),
                basePrisma.contaPaciente.deleteMany({ where: { clinicId: id } }),
                basePrisma.termo.deleteMany({ where: { clinicId: id } }),
                
                // Configurações e Regras
                basePrisma.regraRepasseMedico.deleteMany({ where: { clinicId: id } }),
                basePrisma.regraComissaoEquipe.deleteMany({ where: { clinicId: id } }),
                basePrisma.impostoEmissao.deleteMany({ where: { clinicId: id } }),
                basePrisma.categoriaProcedimento.deleteMany({ where: { clinicId: id } }),
                basePrisma.formaPagamento.deleteMany({ where: { clinicId: id } }),
                
                // Estoque e Suprimentos
                basePrisma.stockMovement.deleteMany({ where: { clinicId: id } }),
                basePrisma.inventoryUsage.deleteMany({ where: { clinicId: id } }),
                basePrisma.procedimentoInsumo.deleteMany({ where: { procedimento: { clinicId: id } } }),
                basePrisma.inventoryItem.deleteMany({ where: { clinicId: id } }),
                basePrisma.setor.deleteMany({ where: { clinicId: id } }),
                basePrisma.fornecedor.deleteMany({ where: { clinicId: id } }),

                // Atendimento e Clínico
                basePrisma.procedureExecution.deleteMany({ where: { clinicId: id } }),
                basePrisma.treatmentItem.deleteMany({ where: { treatmentPlan: { clinicId: id } } }),
                basePrisma.treatmentPlan.deleteMany({ where: { clinicId: id } }),
                basePrisma.accountReceivable.deleteMany({ where: { clinicId: id } }),
                basePrisma.monthlyGoal.deleteMany({ where: { clinicId: id } }),
                basePrisma.procedure.deleteMany({ where: { clinicId: id } }),
                basePrisma.appointment.deleteMany({ where: { clinicId: id } }),
                basePrisma.room.deleteMany({ where: { clinicId: id } }),
                basePrisma.equipment.deleteMany({ where: { clinicId: id } }),
                basePrisma.clinicalEvolution.deleteMany({ where: { clinicId: id } }),
                basePrisma.prescription.deleteMany({ where: { clinicId: id } }),
                basePrisma.task.deleteMany({ where: { clinicId: id } }),

                // Financeiro Legado e Core
                basePrisma.transaction.deleteMany({ where: { clinicId: id } }),
                basePrisma.accountPayableInstallment.deleteMany({ where: { accountPayable: { clinicId: id } } }),
                basePrisma.accountPayable.deleteMany({ where: { clinicId: id } }),
                basePrisma.dailyClosure.deleteMany({ where: { clinicId: id } }),
                basePrisma.financialGoal.deleteMany({ where: { clinicId: id } }),
                basePrisma.lead.deleteMany({ where: { clinicId: id } }),
                basePrisma.document.deleteMany({ where: { clinicId: id } }),
                basePrisma.clinicDocument.deleteMany({ where: { clinicId: id } }),
                basePrisma.pricingSimulation.deleteMany({ where: { clinicId: id } }),
                basePrisma.importBatch.deleteMany({ where: { clinicId: id } }),

                // Entidades Base (Mestres)
                basePrisma.doctor.deleteMany({ where: { clinicId: id } }),
                basePrisma.patient.deleteMany({ where: { clinicId: id } }),
                basePrisma.auditLog.deleteMany({ where: { clinicId: id } }),
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
            // SEC-010: NUNCA retornar password hash ou dados sensíveis
            const users = await basePrisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    clinicId: true,
                    lastLoginAt: true,
                    createdAt: true,
                    mustChangePassword: true,
                    clinic: { select: { name: true } }
                }
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

            // SEC-021: Gerar senha temporária com crypto (criptograficamente seguro)
            if (!password) {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
                const bytes = crypto.randomBytes(12);
                password = Array.from(bytes).map(b => chars[b % chars.length]).join('');

                // Garantir pelo menos 1 de cada tipo
                const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const lower = 'abcdefghijklmnopqrstuvwxyz';
                const numbers = '0123456789';
                const symbols = '!@#$%^&*()_+';
                const rb = crypto.randomBytes(4);

                password =
                    upper[rb[0] % upper.length] +
                    lower[rb[1] % lower.length] +
                    numbers[rb[2] % numbers.length] +
                    symbols[rb[3] % symbols.length] +
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

            // SEC-016: Não retornar senha na resposta da API, apenas via e-mail
            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clinicId: user.clinicId,
                message: 'Usuário criado. Senha temporária enviada por e-mail.'
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

            // SEC-013: Token com marcador de impersonação para auditoria
            const token = AuthService.generateToken({
                id: targetUser.id,
                role: targetUser.role,
                clinicId: targetUser.clinicId || undefined,
                impersonatedBy: adminId,
                isImpersonation: true,
            });

            const refreshToken = AuthService.generateRefreshToken({ id: targetUser.id });

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
                token,
                refreshToken
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
                    data.total = clinicInvoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
                } else {
                    const monthlyFee = Number(c.monthlyFee);
                    const pricePerUser = Number(c.pricePerUser);
                    data.total = monthlyFee > 0 ? monthlyFee : (c._count.users * pricePerUser);
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

                const monthlyFee = Number(clinic.monthlyFee || 0);
                const pricePerUser = Number(clinic.pricePerUser || 0);
                const mensalidade = monthlyFee > 0
                    ? monthlyFee
                    : (clinic._count.users * pricePerUser);

                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 5);

                const setupRemaining = clinic.setupRemainingInstallments || 0;
                const hasSetupPending = setupRemaining > 0;
                let setupPortion = 0;

                if (hasSetupPending && clinic.setupValue && clinic.setupInstallments) {
                    setupPortion = Number(clinic.setupValue) / clinic.setupInstallments;
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
                pricePerUser: Number(clinic.pricePerUser),
                monthlyFee: Number(clinic.monthlyFee || 0),
                setupValue: Number(clinic.setupValue || 0),
                setupInstallments: clinic.setupInstallments || 1,
                setupRemaining: clinic.setupRemainingInstallments || 0,
                contractStartDate: clinic.contractStartDate || clinic.createdAt,
                contractDuration: clinic.contractDurationMonths || 12,
                status: 'PENDENTE', // Valor padrão para fatura draft/on-the-fly
                total: (Number(clinic.monthlyFee) || (clinic._count.users * Number(clinic.pricePerUser))) +
                    (clinic.setupPaymentType === 'DILUIDO_NA_MENSALIDADE' && (clinic.setupRemainingInstallments || 0) > 0
                        ? (Number(clinic.setupValue || 0) / (clinic.setupInstallments || 1)) : 0)
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
                pricePerUser: Number(clinic.pricePerUser),
                total: clinic._count.users * Number(clinic.pricePerUser)
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

            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = `logos/${uniqueSuffix}-${file.originalname.replace(/\s+/g, '_')}`;

            const logoUrl = await storageProvider.upload(
                fileName,
                file.buffer,
                file.mimetype
            );

            res.json({ url: logoUrl });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Acesso Administrativo (Admin Access)
    static async adminClinicAccess(req: any, res: Response) {
        try {
            const { clinicId } = req.body;
            const user = req.user;

            if (user.role !== 'ADMIN_GLOBAL') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const clinic = await basePrisma.clinic.findUnique({
                where: { id: clinicId }
            });

            if (!clinic) {
                return res.status(404).json({ error: 'Clínica não encontrada' });
            }

            if (!clinic.isActive) {
                return res.status(403).json({ error: 'Acesso negado: Clínica inativa ou suspensa' });
            }

            // Logs in AuditLog via utilitário centralizado
            await createAuditLog({
                action: 'ADMIN_CLINIC_ACCESS' as any,
                entity: 'Clinic',
                entityId: clinicId,
                clinicId: clinicId,
                userId: user.id,
                req: req,
                newValues: {
                    adminEmail: user.email,
                }
            });

            // Gerar novo token com adminAccessContext
            const adminAccessContext = {
                clinicId: clinic.id,
                clinicName: clinic.name,
                accessStartedAt: new Date().toISOString(),
                adminUserId: user.id,
                adminName: user.name,
                adminEmail: user.email
            };

            const token = AuthService.generateToken({
                id: user.id,
                role: user.role,
                clinicId: user.clinicId || undefined,
                mustChangePassword: user.mustChangePassword,
                adminAccessContext
            });

            const refreshToken = AuthService.generateRefreshToken({ id: user.id });

            res.json({
                token,
                refreshToken,
                clinic: { id: clinic.id, name: clinic.name, plan: clinic.plan, status: clinic.isActive },
                redirectTo: '/dashboard'
            });

        } catch (error) {
            console.error('[ADMIN_ACCESS_ERROR]', error);
            res.status(500).json({ error: 'Erro ao iniciar acesso administrativo' });
        }
    }

    static async adminClinicExit(req: any, res: Response) {
        try {
            const user = req.user;

            if (!user.adminAccessContext) {
                return res.status(400).json({ error: 'Sessão administrativa não encontrada no token' });
            }

            const { clinicId, accessStartedAt } = user.adminAccessContext;
            console.log(`[DEBUG] Tentando encerrar sessão administrativa. Clinic: ${clinicId}, User: ${user.id}`);
            const sessionDurationMinutes = Math.round((new Date().getTime() - new Date(accessStartedAt).getTime()) / 60000);

            // Registrar saída via utilitário centralizado
            await createAuditLog({
                action: 'ADMIN_CLINIC_EXIT' as any,
                entity: 'Clinic',
                entityId: clinicId,
                clinicId: clinicId,
                userId: user.id,
                req: req,
                newValues: {
                    sessionDurationMinutes
                }
            });

            // Reemitir token original do admin
            const token = AuthService.generateToken({
                id: user.id,
                role: user.role,
                clinicId: user.clinicId || undefined,
                mustChangePassword: user.mustChangePassword
            });

            const refreshToken = AuthService.generateRefreshToken({ id: user.id });

            res.json({ redirectTo: '/saas-dashboard', token, refreshToken });

        } catch (error) {
            console.error('[ADMIN_EXIT_ERROR]', error);
            res.status(500).json({ error: 'Erro ao encerrar acesso administrativo' });
        }
    }

    static async getAuditLogs(req: any, res: Response) {
        try {
            if (req.user?.role !== 'ADMIN_GLOBAL') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const logs = await prisma.auditLog.findMany({
                orderBy: { timestamp: 'desc' },
                take: 100, // limite de exibição
            });

            // Buscando nomes para enriquecer (visto que a relação não é estrita)
            const clinicIds = [...new Set(logs.map(l => l.clinicId))];
            const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean) as string[])];

            const [clinics, users] = await Promise.all([
                prisma.clinic.findMany({ where: { id: { in: clinicIds } }, select: { id: true, name: true } }),
                prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, role: true } })
            ]);

            const clinicMap = new Map(clinics.map(c => [c.id, c.name]));
            const userMap = new Map(users.map(u => [u.id, u]));

            const enrichedLogs = logs.map(log => ({
                ...log,
                clinicName: clinicMap.get(log.clinicId) || 'Desconhecida',
                user: log.userId ? userMap.get(log.userId) : null
            }));

            res.status(200).json(enrichedLogs);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            res.status(500).json({ error: 'Erro interno ao buscar logs de auditoria' });
        }
    }
}

export default new SaaSController();
