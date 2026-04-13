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
        // Puxar todas as tarefas do CRM (Follow-up) da clínica
        // Removido filtro de data para garantir visibilidade de tarefas pendentes antigas
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
            orderBy: { dueDate: 'asc' }
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

        // 1. Buscar o procedimento no catálogo para ver se tem followUpDays
        const procedure = await prisma.procedure.findFirst({
            where: {
                clinicId,
                name: {
                    equals: procedureName,
                    mode: 'insensitive'
                }
            }
        });

        if (!procedure || !procedure.followUpDays || procedure.followUpDays <= 0) {
            return null;
        }

        // 2. Calcular data de vencimento
        const dueDate = addDays(new Date(transactionDate), procedure.followUpDays);

        // 3. Criar a tarefa se não existir uma idêntica pendente
        const existingTask = await prisma.task.findFirst({
            where: {
                clinicId,
                patientId,
                title: `Follow-up: ${procedure.name}`,
                status: { in: ['TODO', 'IN_PROGRESS'] }
            }
        });

        if (existingTask) return null;

        return await prisma.task.create({
            data: {
                clinicId,
                patientId,
                title: `Follow-up: ${procedure.name}`,
                description: `Retorno automático baseado no procedimento realizado em ${transactionDate.toLocaleDateString('pt-BR')}.`,
                dueDate,
                status: 'TODO',
                type: 'FOLLOW_UP',
                priority: 'MEDIUM'
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
