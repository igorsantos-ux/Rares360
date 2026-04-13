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
        // Puxar tarefas do CRM (Follow-up) da clínica
        // Agora as tarefas já vêm consolidadas por paciente (1 Task por paciente aberta)
        return await prisma.task.findMany({
            where: {
                clinicId,
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
            orderBy: { dueDate: 'asc' }, // Ordenação por vencimento (o mais antigo/atrasado primeiro)
            take: 500
        });
    }

    static async updateTaskStatus(clinicId: string, taskId: string, status: string) {
        return await prisma.task.update({
            where: { id: taskId, clinicId },
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

    static async completeTask(clinicId: string, taskId: string) {
        return await prisma.task.update({
            where: { id: taskId, clinicId },
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
