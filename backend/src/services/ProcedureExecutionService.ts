import prisma from '../lib/prisma.js';
import { InventoryService } from './CoreServices.js';

export class ProcedureExecutionService {
    static async execute(clinicId: string, executionId: string) {
        // Buscamos a execução primeiro para ter os dados
        const execution = await prisma.procedureExecution.findUnique({
            where: { id: executionId },
            include: { patient: true }
        });

        if (!execution) throw new Error("Execução não encontrada");
        if (execution.status === 'EXECUTADO') return execution;

        // 1. Marcar como executado
        const updatedExecution = await prisma.procedureExecution.update({
            where: { id: executionId },
            data: {
                status: 'EXECUTADO',
                executedAt: new Date()
            }
        });

        // 2. Baixa de estoque (Baseado nos insumos vinculados ao procedimento)
        if (execution.procedureId) {
            const pricing = await prisma.procedurePricing.findUnique({
                where: { id: execution.procedureId },
                include: { supplies: true }
            });

            if (pricing && pricing.supplies.length > 0) {
                for (const supply of pricing.supplies) {
                    const item = await prisma.inventoryItem.findFirst({
                        where: { 
                            name: { equals: supply.name, mode: 'insensitive' },
                            clinicId 
                        }
                    });

                    if (item) {
                        try {
                            // Tenta registrar movimento. O InventoryService atual gerado por transação.
                            // Para manter a "Regra de Ouro" de permitir execução mesmo sem estoque:
                            if (item.quantity < supply.quantity) {
                                console.warn(`⚠️ ALERTA CRÍTICO: Estoque insuficiente para ${supply.name}. Saldo: ${item.quantity}, Necessário: ${supply.quantity}`);
                            }
                            
                            await InventoryService.registerMovement({
                                itemId: item.id,
                                type: 'SAIDA',
                                quantity: supply.quantity,
                                reason: `Execução: ${execution.procedureName}`,
                                clinicId
                            }).catch(err => {
                                // Se o serviço travar por saldo negativo, ignoramos o erro aqui para permitir a execução
                                console.error("Falha ao baixar estoque (permitido pelo protocolo):", err.message);
                            });
                        } catch (e) {
                            console.error("Erro no processamento de estoque:", e);
                        }
                    }
                }
            }
        }

        // 3. Automação de Follow-up (Retorno)
        let daysToFollowUp = 7; // Default
        const lowerName = execution.procedureName.toLowerCase();
        
        if (lowerName.includes('botox') || lowerName.includes('toxina')) {
            daysToFollowUp = 15;
        } else if (lowerName.includes('bioestimulador') || lowerName.includes('sculptra') || lowerName.includes('radiesse')) {
            daysToFollowUp = 30;
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysToFollowUp);

        // Criar a tarefa de contato
        await prisma.task.create({
            data: {
                clinicId,
                patientId: execution.patientId,
                executionId: execution.id,
                title: `Contato de Pós-Procedimento: ${execution.patient.fullName}`,
                dueDate,
                status: 'ABERTA',
                type: 'FOLLOW_UP'
            }
        });

        return updatedExecution;
    }

    static async listPending(clinicId: string) {
        return await prisma.procedureExecution.findMany({
            where: { clinicId, status: 'PENDENTE' },
            include: { 
                patient: {
                    select: { fullName: true }
                }
            },
            orderBy: { billedAt: 'desc' }
        });
    }

    static async getByPatient(clinicId: string, patientId: string) {
        return await prisma.procedureExecution.findMany({
            where: { clinicId, patientId },
            orderBy: { billedAt: 'desc' }
        });
    }
}
