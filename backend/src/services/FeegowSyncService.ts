import prisma from '../lib/prisma.js';
import { FeegowService } from './FeegowService.js';

export class FeegowSyncService {
    static async syncAll(clinicId: string, requestedModule?: string) {
        const integration = await prisma.integration.findUnique({
            where: { clinicId_type: { clinicId, type: 'FEEGOW' } }
        });

        if (!integration || !integration.isActive || !integration.token) {
            throw new Error('Integração Feegow não configurada ou inativa.');
        }

        const settings = integration.settings as any;
        const modules = settings?.modules || {};
        const results: any = {};

        // Se um módulo específico foi solicitado, sincronizamos apenas ele (ignora settings se for chamado explicitamente)
        if (requestedModule) {
            if (requestedModule === 'patients') {
                results.patients = await this.syncPatients(clinicId, integration.token);
            } else if (requestedModule === 'financial' || requestedModule === 'finance') {
                results.finance = await this.syncFinance(clinicId, integration.token);
            } else if (requestedModule === 'appointments') {
                results.appointments = { message: 'Módulo de agendamentos em desenvolvimento' };
            }
            return results;
        }

        // Caso contrário, sincroniza tudo conforme as configurações
        if (modules.patients) {
            results.patients = await this.syncPatients(clinicId, integration.token);
        }

        if (modules.appointments) {
            results.appointments = { message: 'Módulo de agendamentos em desenvolvimento' };
        }

        if (modules.financial || modules.finance) {
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
                // Feegow usa patient_id na listagem
                const feegowId = patient.patient_id || patient.id;
                
                if (!feegowId) {
                    console.warn('Paciente ignorado por falta de ID:', patient);
                    continue;
                }
                
                const externalId = feegowId.toString();
                
                // Fallback Manual Upsert (evita erro 42P10 caso índice único não exista)
                const existing = await prisma.customer.findFirst({
                    where: { externalId, externalSource: 'FEEGOW', clinicId }
                });

                const patientData = {
                    name: patient.nome,
                    email: patient.email,
                    phone: patient.telefone || patient.celular,
                    birthDate: patient.data_nascimento || patient.nascimento ? new Date(patient.data_nascimento || patient.nascimento) : undefined,
                };

                if (existing) {
                    await prisma.customer.update({
                        where: { id: existing.id },
                        data: patientData
                    });
                    updatedCount++;
                } else {
                    await prisma.customer.create({
                        data: {
                            ...patientData,
                            externalId,
                            externalSource: 'FEEGOW',
                            clinicId
                        }
                    });
                    createdCount++;
                }
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
                // Feegow costuma usar 'id' ou 'invoice_id'
                const invId = inv.id || inv.invoice_id;
                
                if (!invId) {
                    console.warn('Fatura ignorada por falta de ID:', inv);
                    continue;
                }

                const payments = inv.pagamentos || [];
                
                if (payments.length > 0) {
                    for (const pay of payments) {
                        const payId = pay.id || pay.payment_id || pay.movimento_id;
                        
                        if (!payId) {
                            console.warn('Pagamento ignorado por falta de ID na fatura:', invId);
                            continue;
                        }

                        const externalId = `pay-${payId}`;
                        const existing = await prisma.transaction.findFirst({
                            where: { externalId, externalSource: 'FEEGOW', clinicId }
                        });

                        const transactionData = {
                            amount: Number(pay.valor),
                            date: new Date(pay.data),
                            description: pay.descricao || inv.detalhes?.descricao || 'Sincronização Feegow',
                            category: categoryMap[pay.tipo_conta] || 'Geral',
                            status: 'PAID' as any
                        };

                        if (existing) {
                            await prisma.transaction.update({
                                where: { id: existing.id },
                                data: transactionData
                            });
                        } else {
                            await prisma.transaction.create({
                                data: {
                                    ...transactionData,
                                    type: inv.tipo_transacao === 'C' ? 'INCOME' : 'EXPENSE',
                                    externalId,
                                    externalSource: 'FEEGOW',
                                    clinicId
                                }
                            });
                        }
                        syncedCount++;
                    }
                } else {
                    const externalId = `inv-${invId}`;
                    const existing = await prisma.transaction.findFirst({
                        where: { externalId, externalSource: 'FEEGOW', clinicId }
                    });

                    const transactionData = {
                        amount: Number(inv.valor),
                        date: new Date(inv.data),
                        description: inv.detalhes?.descricao || 'Sincronização Feegow (Fatura)',
                        category: categoryMap[inv.detalhes?.tipo_conta] || 'Geral',
                        status: 'PENDING' as any
                    };

                    if (existing) {
                        await prisma.transaction.update({
                            where: { id: existing.id },
                            data: transactionData
                        });
                    } else {
                        await prisma.transaction.create({
                            data: {
                                ...transactionData,
                                type: inv.tipo_transacao === 'C' ? 'INCOME' : 'EXPENSE',
                                externalId,
                                externalSource: 'FEEGOW',
                                clinicId
                            }
                        });
                    }
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
