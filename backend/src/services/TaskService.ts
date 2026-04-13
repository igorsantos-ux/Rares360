import prisma from '../lib/prisma.js';
import { addDays } from 'date-fns';

export class TaskService {
    static async getDailyTasks(clinicId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return await prisma.task.findMany({
            where: {
                clinicId,
                dueDate: {
                    gte: today,
                    lt: tomorrow
                },
                status: 'TODO'
            },
            include: {
                patient: {
                    select: { fullName: true, phone: true }
                }
            },
            orderBy: { dueDate: 'asc' }
        });
    }

    static async getCRMTasks(clinicId: string) {
        const rawTasks = await prisma.task.findMany({
            where: {
                clinicId,
                status: { in: ['TODO', 'IN_PROGRESS'] } // Apenas abertas no Kanban
            },
            include: {
                patient: {
                    select: {
                        fullName: true,
                        phone: true,
                        photoUrl: true
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        // Agrupar por patientId
        const consolidatedMap = new Map<string, any>();

        for (const task of rawTasks) {
            const patientId = task.patientId;

            if (consolidatedMap.has(patientId)) {
                const existing = consolidatedMap.get(patientId);

                // Mesclar procedimentos
                const taskProcs = (task.pendingProcedures as any[]) || [
                    { name: task.title.replace('Follow-up: ', '').replace('Oportunidade: ', ''), dueDate: task.dueDate, transactionDate: task.createdAt }
                ];

                existing.pendingProcedures = [...existing.pendingProcedures, ...taskProcs];

                // Manter a data de vencimento mais antiga como a principal do card
                if (new Date(task.dueDate) < new Date(existing.dueDate)) {
                    existing.dueDate = task.dueDate;
                }

                // Concatenar IDs para poder atualizar todos quando mover o card
                existing.ids = [...existing.ids, task.id];
            } else {
                const pendingProcedures = (task.pendingProcedures as any[]) || [
                    { name: task.title.replace('Follow-up: ', '').replace('Oportunidade: ', ''), dueDate: task.dueDate, transactionDate: task.createdAt }
                ];

                consolidatedMap.set(patientId, {
                    ...task,
                    ids: [task.id],
                    pendingProcedures
                });
            }
        }

        return Array.from(consolidatedMap.values());
    }

    static async updateTaskStatus(clinicId: string, idOrIds: string, status: string) {
        const ids = idOrIds.split(',');
        return await prisma.task.updateMany({
            where: {
                id: { in: ids },
                clinicId
            },
            data: {
                status,
                updatedAt: new Date()
            }
        });
    }

    static async triggerFollowUp(clinicId: string, data: {
        patientId: string,
        procedureName: string,
        transactionDate: Date
    }) {
        const { patientId, procedureName, transactionDate } = data;
        const DEFAULT_FOLLOWUP_DAYS = 60;

        const procedure = await prisma.procedure.findFirst({
            where: {
                clinicId,
                name: { equals: procedureName, mode: 'insensitive' }
            }
        });

        const daysToReturn = (procedure && procedure.followUpDays && procedure.followUpDays > 0)
            ? procedure.followUpDays
            : DEFAULT_FOLLOWUP_DAYS;

        const dueDate = addDays(new Date(transactionDate), daysToReturn);

        // 1. Verificar se já existe uma tarefa aberta para este paciente
        const existingTask = await prisma.task.findFirst({
            where: {
                clinicId,
                patientId,
                status: { in: ['TODO', 'IN_PROGRESS'] },
                type: 'FOLLOW_UP'
            }
        });

        const newProcedureEntry = {
            name: procedureName,
            dueDate: dueDate.toISOString(),
            transactionDate: new Date(transactionDate).toISOString()
        };

        if (existingTask) {
            // 2. Consolidar na tarefa existente
            const currentProcedures = (existingTask.pendingProcedures as any[]) || [];

            // Verificar se o procedimento já está na lista para evitar duplicatas exatas
            const alreadyExists = currentProcedures.find((p: any) =>
                p.name === procedureName &&
                new Date(p.transactionDate).toDateString() === new Date(transactionDate).toDateString()
            );

            if (alreadyExists) return existingTask;

            const updatedProcedures = [...currentProcedures, newProcedureEntry];

            // A data de vencimento da tarefa deve ser a do procedimento mais urgente (menor data)
            const minDueDate = updatedProcedures.reduce((min, p) => {
                const pDate = new Date(p.dueDate);
                return pDate < min ? pDate : min;
            }, new Date(updatedProcedures[0].dueDate));

            return await prisma.task.update({
                where: { id: existingTask.id },
                data: {
                    pendingProcedures: updatedProcedures,
                    dueDate: minDueDate,
                    updatedAt: new Date(),
                    description: `Consolidado: ${updatedProcedures.length} procedimentos pendentes.`
                }
            });
        }

        // 3. Criar nova tarefa se não existir
        console.log(`DEBUG: Criando nova oportunidade de CRM para ${procedureName}.`);

        return await prisma.task.create({
            data: {
                clinicId,
                patientId,
                title: `Oportunidade: ${procedureName}`,
                description: `Retorno automático baseado no procedimento "${procedureName}".`,
                dueDate,
                status: 'TODO',
                type: 'FOLLOW_UP',
                priority: (daysToReturn <= 30) ? 'HIGH' : 'MEDIUM',
                pendingProcedures: [newProcedureEntry]
            }
        });
    }

    static async completeTask(clinicId: string, idOrIds: string) {
        const ids = idOrIds.split(',');
        return await prisma.task.updateMany({
            where: {
                id: { in: ids },
                clinicId
            },
            data: { status: 'DONE' }
        });
    }

    static async getSummary(clinicId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const count = await prisma.task.count({
            where: {
                clinicId,
                dueDate: {
                    lte: new Date() // Vencidas ou hoje
                },
                status: 'TODO'
            }
        });

        return {
            patientsToContactToday: count
        };
    }
}
