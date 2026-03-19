import prisma from '../lib/prisma.js';
export class TaskService {
    static async getDailyTasks(clinicId) {
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
                status: 'ABERTA'
            },
            include: {
                patient: {
                    select: { fullName: true, phone: true }
                }
            },
            orderBy: { dueDate: 'asc' }
        });
    }
    static async completeTask(clinicId, taskId) {
        return await prisma.task.update({
            where: { id: taskId, clinicId },
            data: { status: 'CONCLUÍDA' }
        });
    }
    static async getSummary(clinicId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const count = await prisma.task.count({
            where: {
                clinicId,
                dueDate: {
                    gte: today,
                    lt: tomorrow
                },
                status: 'ABERTA'
            }
        });
        return {
            patientsToContactToday: count
        };
    }
}
