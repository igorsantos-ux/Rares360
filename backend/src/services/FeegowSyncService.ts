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
                results.appointments = await this.syncAppointmentsPipeline(clinicId, integration.token);
            }
            return results;
        }

        // Caso contrário, sincroniza tudo conforme as configurações
        if (modules.patients) {
            results.patients = await this.syncPatients(clinicId, integration.token);
        }

        if (modules.appointments) {
            results.appointments = await this.syncAppointmentsPipeline(clinicId, integration.token);
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

    private static async syncAppointmentsPipeline(clinicId: string, token: string) {
        try {
            console.log('[FEEGOW SYNC] Iniciando pipeline de Agendamentos e Metadados...');
            await this.syncInsurances(clinicId, token);
            await this.syncSpecialties(clinicId, token);
            await this.syncProcedures(clinicId, token);
            await this.syncProfessionals(clinicId, token);
            
            // Requer que os pacientes estejam sincronizados, chama antes também
            await this.syncPatients(clinicId, token);

            return await this.syncAppointments(clinicId, token);
        } catch (error: any) {
            console.error('Erro na pipeline de agendamentos:', error);
            return { success: false, error: error.message };
        }
    }

    private static async syncInsurances(clinicId: string, token: string) {
        console.log('[FEEGOW SYNC] Sincronizando Convênios...');
        const data = await FeegowService.getInsurances(token);
        const records = (data as any)?.content || [];

        for (const item of records) {
            const externalId = item.convenio_id?.toString();
            if (!externalId) continue;
            
            const existing = await prisma.insurance.findFirst({
                where: { externalId, externalSource: 'FEEGOW', clinicId }
            });

            let insuranceId = existing?.id;

            if (existing) {
                await prisma.insurance.update({
                    where: { id: existing.id },
                    data: { nome: item.nome, registroAns: item.registro_ans, cnpj: item.CNPJ }
                });
            } else {
                const created = await prisma.insurance.create({
                    data: {
                        nome: item.nome, registroAns: item.registro_ans, cnpj: item.CNPJ,
                        externalId, externalSource: 'FEEGOW', clinicId
                    }
                });
                insuranceId = created.id;
            }

            // Sync Plans
            const planos = item.planos || [];
            for (const plano of planos) {
                const planoExtId = plano.plano_id?.toString();
                if (!planoExtId) continue;
                
                const existingPlano = await prisma.insurancePlan.findFirst({
                    where: { externalId: planoExtId, externalSource: 'FEEGOW', insuranceId: insuranceId! }
                });

                if (existingPlano) {
                    await prisma.insurancePlan.update({
                        where: { id: existingPlano.id },
                        data: { nome: plano.plano }
                    });
                } else {
                    await prisma.insurancePlan.create({
                        data: {
                            nome: plano.plano,
                            externalId: planoExtId, externalSource: 'FEEGOW', insuranceId: insuranceId!
                        }
                    });
                }
            }
        }
    }

    private static async syncSpecialties(clinicId: string, token: string) {
        console.log('[FEEGOW SYNC] Sincronizando Especialidades...');
        const data = await FeegowService.getSpecialties(token);
        const records = (data as any)?.content || [];

        for (const item of records) {
            const externalId = item.especialidade_id?.toString();
            if (!externalId) continue;
            
            const existing = await prisma.specialty.findFirst({
                where: { externalId, externalSource: 'FEEGOW', clinicId }
            });

            if (existing) {
                await prisma.specialty.update({
                    where: { id: existing.id },
                    data: { nome: item.nome, codigoTiss: item.codigo_tiss }
                });
            } else {
                await prisma.specialty.create({
                    data: {
                        nome: item.nome, codigoTiss: item.codigo_tiss,
                        externalId, externalSource: 'FEEGOW', clinicId
                    }
                });
            }
        }
    }

    private static async syncProcedures(clinicId: string, token: string) {
        console.log('[FEEGOW SYNC] Sincronizando Procedimentos...');
        const data = await FeegowService.getProcedures(token);
        const records = (data as any)?.content || [];

        for (const item of records) {
            const externalId = item.procedimento_id?.toString();
            if (!externalId) continue;
            
            const existing = await prisma.procedure.findFirst({
                where: { externalId, externalSource: 'FEEGOW', clinicId }
            });

            if (existing) {
                await prisma.procedure.update({
                    where: { id: existing.id },
                    data: { nome: item.nome, valorPadrao: Number(item.valor ?? 0) / 100, codigo: item.codigo }
                });
            } else {
                await prisma.procedure.create({
                    data: {
                        nome: item.nome, valorPadrao: Number(item.valor ?? 0) / 100, codigo: item.codigo,
                        externalId, externalSource: 'FEEGOW', clinicId
                    }
                });
            }
        }
    }

    private static async syncProfessionals(clinicId: string, token: string) {
        console.log('[FEEGOW SYNC] Sincronizando Profissionais...');
        const data = await FeegowService.getProfessionals(token);
        const records = (data as any)?.content || [];

        for (const item of records) {
            const externalId = item.profissional_id?.toString();
            if (!externalId) continue;
            
            const existing = await prisma.doctor.findFirst({
                // O app antigo mapeava Feegow com id de profissional, vamos usar o name como chave no momento ou ID externo,
                // já que doctor.id no projeto original não previa externalId. Como só adicionamos via interface normal, 
                // vamos buscar pelo nome se ele já foi cadastrado, ou apenas criar o profissional sem duplicar.
                where: { name: item.nome || 'Profissional Desconhecido', clinicId }
            });

            const docData = {
                name: item.nome || `Profissional ${item.profissional_id}`,
                rqe: item.rqe,
                documento_conselho: item.documento_conselho,
                uf_conselho: item.uf_conselho,
                commission: 0
            };

            if (existing) {
                await prisma.doctor.update({
                    where: { id: existing.id },
                    data: docData
                });
            } else {
                await prisma.doctor.create({
                    data: {
                        ...docData,
                        clinicId
                    }
                });
            }
        }
    }

    private static async syncAppointments(clinicId: string, token: string) {
        console.log('[FEEGOW SYNC] Sincronizando Agendamentos...');
        
        // Pega os últimos 30 dias e os próximos 30 dias
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - 30);
        
        const end = new Date();
        end.setDate(now.getDate() + 30);

        const dateToString = (d: Date) => `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;

        const dataStart = dateToString(start);
        const dataEnd = dateToString(end);

        const data = await FeegowService.getAppointments(token, dataStart, dataEnd);
        const records = (data as any)?.content || [];

        let createdCount = 0;
        let updatedCount = 0;

        for (const item of records) {
            const externalId = item.agendamento_id?.toString();
            if (!externalId) continue;

            // Converter data (DD-MM-YYYY)
            let parsedDate = new Date();
            if (item.data) {
                const parts = item.data.split('-');
                if (parts.length === 3) {
                    parsedDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                }
            }
            
            // Status ID do Feegow 
            // 1 Agendado, 2 Confirmado, 4 Atendido... 
            let mappedStatus = 'SCHEDULED';
            if (item.status_id === 2) mappedStatus = 'CONFIRMED';
            else if (item.status_id === 4) mappedStatus = 'COMPLETED';
            else if (item.status_id === 5) mappedStatus = 'CANCELLED';

            // Refs
            const patientIdExt = item.paciente_id?.toString();
            const customer = patientIdExt ? await prisma.customer.findFirst({ where: { externalId: patientIdExt, externalSource: 'FEEGOW', clinicId } }) : null;
            
            const profExt = item.profissional_id?.toString();
            const doctor = profExt ? await prisma.doctor.findFirst({ where: { name: item.nome_fantasia || `Profissional ${profExt}`, clinicId } }) : null;

            const procExt = item.procedimento_id?.toString();
            const procedure = procExt ? await prisma.procedure.findFirst({ where: { externalId: procExt, clinicId } }) : null;

            const specExt = item.especialidade_id?.toString();
            const specialty = specExt ? await prisma.specialty.findFirst({ where: { externalId: specExt, clinicId } }) : null;

            const insExt = item.convenio_id?.toString();
            const insurance = insExt ? await prisma.insurance.findFirst({ where: { externalId: insExt, clinicId } }) : null;

            const existing = await prisma.appointment.findFirst({
                where: { externalId, externalSource: 'FEEGOW', clinicId }
            });

            const aptData = {
                date: parsedDate,
                time: item.horario,
                notes: item.notas,
                agendadoPor: item.agendado_por,
                telemedicina: item.telemedicina === true || item.telemedicina === 1,
                primeiroAgendamento: item.primeiro_agendamento === 1,
                status: mappedStatus,
                customerId: customer?.id,
                doctorId: doctor?.id,
                procedureId: procedure?.id,
                specialtyId: specialty?.id,
                insuranceId: insurance?.id
            };

            if (existing) {
                await prisma.appointment.update({
                    where: { id: existing.id },
                    data: aptData
                });
                updatedCount++;
            } else {
                await prisma.appointment.create({
                    data: {
                        ...aptData,
                        externalId,
                        externalSource: 'FEEGOW',
                        clinicId
                    }
                });
                createdCount++;
            }
        }

        console.log(`[FEEGOW SYNC] Concluído Agendamentos. Criados: ${createdCount}, Atualizados: ${updatedCount}`);
        return { success: true, count: records.length, created: createdCount, updated: updatedCount };
    }
}
