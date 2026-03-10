import prisma from '../lib/prisma.js';
import { FeegowService } from './FeegowService.js';

export class FeegowSyncService {
    static async syncAll(clinicId: string) {
        const integration = await prisma.integration.findUnique({
            where: { clinicId_type: { clinicId, type: 'FEEGOW' } }
        });

        if (!integration || !integration.isActive || !integration.token) {
            throw new Error('Integração Feegow não configurada ou inativa.');
        }

        const settings = integration.settings as any;
        const modules = settings?.modules || {};
        const results: any = {};

        if (modules.patients) {
            results.patients = await this.syncPatients(clinicId, integration.token);
        }

        if (modules.appointments) {
            // results.appointments = await this.syncAppointments(clinicId, integration.token);
            results.appointments = { message: 'Módulo de agendamentos em desenvolvimento' };
        }

        if (modules.finance) {
            results.finance = await this.syncFinance(clinicId, integration.token);
        }

        return results;
    }

    private static async syncPatients(clinicId: string, token: string) {
        try {
            const data = await FeegowService.getPatients(token);
            const patients = data?.content || [];

            let createdCount = 0;
            let updatedCount = 0;

            for (const patient of patients) {
                if (!patient || !patient.id) {
                    console.warn('Paciente ignorado por falta de ID:', patient);
                    continue;
                }

                await prisma.customer.upsert({
                    where: {
                        externalId_externalSource_clinicId: {
                            externalId: patient.id.toString(),
                            externalSource: 'FEEGOW',
                            clinicId
                        }
                    },
                    update: {
                        name: patient.nome,
                        email: patient.email,
                        phone: patient.telefone,
                        birthDate: patient.data_nascimento ? new Date(patient.data_nascimento) : undefined,
                    },
                    create: {
                        name: patient.nome,
                        email: patient.email,
                        phone: patient.telefone,
                        birthDate: patient.data_nascimento ? new Date(patient.data_nascimento) : undefined,
                        externalId: patient.id.toString(),
                        externalSource: 'FEEGOW',
                        clinicId
                    }
                });
                createdCount++;
            }

            return { success: true, count: patients.length, created: createdCount, updated: updatedCount };
        } catch (error: any) {
            console.error('Erro na sincronização de pacientes:', error);
            return { success: false, error: error.message };
        }
    }

    private static async syncFinance(clinicId: string, token: string) {
        try {
            const now = new Date();
            // Pegar o mês atual inteiro
            const dataStart = `01-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
            const dataEnd = `${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;

            // 1. Buscar categorias para mapeamento
            const incomeCats = await FeegowService.getFinancialCategories(token, 'income');
            const expenseCats = await FeegowService.getFinancialCategories(token, 'expense');

            const categoryMap: Record<string, string> = {};
            [...(incomeCats?.content || []), ...(expenseCats?.content || [])].forEach((c: any) => {
                categoryMap[c.id] = c.nome;
            });

            // 2. Buscar Faturas (Receber e Pagar)
            const invoicesC = await FeegowService.getInvoices(token, 'C', dataStart, dataEnd);
            const invoicesD = await FeegowService.getInvoices(token, 'D', dataStart, dataEnd);

            const allInvoices = [...(invoicesC?.content || []), ...(invoicesD?.content || [])];
            let syncedCount = 0;

            for (const inv of allInvoices) {
                if (!inv || !inv.id) {
                    console.warn('Fatura ignorada por falta de ID:', inv);
                    continue;
                }

                const payments = inv.pagamentos || [];

                if (payments.length > 0) {
                    for (const pay of payments) {
                        if (!pay || !pay.id) {
                            console.warn('Pagamento ignorado por falta de ID na fatura:', inv.id);
                            continue;
                        }

                        await prisma.transaction.upsert({
                            where: {
                                externalId_externalSource_clinicId: {
                                    externalId: `pay-${pay.id}`,
                                    externalSource: 'FEEGOW',
                                    clinicId
                                }
                            },
                            update: {
                                amount: Number(pay.valor),
                                date: new Date(pay.data),
                                description: pay.descricao || inv.detalhes?.descricao || 'Sincronização Feegow',
                                category: categoryMap[pay.tipo_conta] || 'Geral',
                                status: 'PAID'
                            },
                            create: {
                                amount: Number(pay.valor),
                                date: new Date(pay.data),
                                description: pay.descricao || inv.detalhes?.descricao || 'Sincronização Feegow',
                                category: categoryMap[pay.tipo_conta] || 'Geral',
                                type: inv.tipo_transacao === 'C' ? 'INCOME' : 'EXPENSE',
                                status: 'PAID',
                                externalId: `pay-${pay.id}`,
                                externalSource: 'FEEGOW',
                                clinicId
                            }
                        });
                        syncedCount++;
                    }
                } else {
                    await prisma.transaction.upsert({
                        where: {
                            externalId_externalSource_clinicId: {
                                externalId: `inv-${inv.id}`,
                                externalSource: 'FEEGOW',
                                clinicId
                            }
                        },
                        update: {
                            amount: Number(inv.valor),
                            date: new Date(inv.data),
                            description: inv.detalhes?.descricao || 'Sincronização Feegow (Fatura)',
                            category: categoryMap[inv.detalhes?.tipo_conta] || 'Geral',
                            status: 'PENDING'
                        },
                        create: {
                            amount: Number(inv.valor),
                            date: new Date(inv.data),
                            description: inv.detalhes?.descricao || 'Sincronização Feegow (Fatura)',
                            category: categoryMap[inv.detalhes?.tipo_conta] || 'Geral',
                            type: inv.tipo_transacao === 'C' ? 'INCOME' : 'EXPENSE',
                            status: 'PENDING',
                            externalId: `inv-${inv.id}`,
                            externalSource: 'FEEGOW',
                            clinicId
                        }
                    });
                    syncedCount++;
                }
            }

            return { success: true, count: syncedCount };
        } catch (error: any) {
            console.error('Erro na sincronização financeira Feegow:', error);
            return { success: false, error: error.message };
        }
    }
}
