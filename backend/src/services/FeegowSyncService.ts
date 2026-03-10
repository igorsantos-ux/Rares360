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
            const data = await FeegowService.getPatients(token, 0, 500);
            const records = (data as any)?.content || [];

            let createdCount = 0;
            let updatedCount = 0;

            for (const patient of records) {
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

            console.log(`[FEEGOW SYNC C] Processados ${records.length} pacientes. Incluídos: ${createdCount}, Atualizados: ${updatedCount}`);
            return { success: true, count: records.length, created: createdCount, updated: updatedCount };
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
            [...((incomeCats as any)?.content || []), ...((expenseCats as any)?.content || [])].forEach((c: any) => {
                categoryMap[c.id] = c.nome;
            });

            // 2. Buscar Faturas (Receber e Pagar)
            const invoicesC = await FeegowService.getInvoices(token, 'C', dataStart, dataEnd);
            const invoicesD = await FeegowService.getInvoices(token, 'D', dataStart, dataEnd);
            
            const allInvoices = [
                ...((invoicesC as any)?.content || []).map((i: any) => ({ ...i, tipo_transacao: 'C' })),
                ...((invoicesD as any)?.content || []).map((i: any) => ({ ...i, tipo_transacao: 'D' }))
            ];
            let syncedCount = 0;

            for (const inv of allInvoices) {
                const detalhe = inv.detalhes && inv.detalhes.length > 0 ? inv.detalhes[0] : null;

                // Feegow costuma usar 'id' ou 'invoice_id' ou pode vir dentro de detalhes
                const invId = inv.id || inv.invoice_id || detalhe?.invoice_id || detalhe?.movement_id;
                
                if (!invId) {
                    console.warn('Fatura ignorada por falta de ID:', JSON.stringify(inv, null, 2));
                    continue;
                }

                const invData = detalhe?.data || inv.data;
                const invValor = detalhe?.valor ?? inv.valor ?? 0;
                const invDescricao = detalhe?.descricao || inv.descricao || 'Sincronização Feegow (Fatura)';
                const invTipoConta = detalhe?.tipo_conta || inv.tipo_conta;
                const invTipoTransacao = inv.tipo_transacao === 'C' ? 'INCOME' : 'EXPENSE';

                const payments = inv.pagamentos || [];
                
                if (payments.length > 0) {
                    for (const pay of payments) {
                        const payId = pay.id || pay.payment_id || pay.movimento_id || pay.pagamento_id;
                        
                        if (!payId) {
                            console.warn('Pagamento ignorado por falta de ID na fatura:', invId);
                            continue;
                        }

                        const externalId = `pay-${payId}`;
                        const existing = await prisma.transaction.findFirst({
                            where: { externalId, externalSource: 'FEEGOW', clinicId }
                        });

                        const transactionData = {
                            amount: Number(pay.valor ?? invValor),
                            date: pay.data ? new Date(pay.data) : (invData ? new Date(invData) : new Date()),
                            description: pay.descricao || invDescricao,
                            category: categoryMap[pay.tipo_conta || invTipoConta] || 'Geral',
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
                                    type: invTipoTransacao,
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
                        amount: Number(invValor),
                        date: invData ? new Date(invData) : new Date(),
                        description: invDescricao,
                        category: categoryMap[invTipoConta] || 'Geral',
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
                                type: invTipoTransacao,
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
