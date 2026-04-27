import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function diagnose() {
    try {
        console.log('--- DIAGNÓSTICO DE TAREFAS ---');
        // 1. Listar clínicas e contagem de tarefas
        const clinicStats = await prisma.task.groupBy({
            by: ['clinicId'],
            _count: {
                _all: true
            }
        });
        console.log('Distribuição por Clínica:', JSON.stringify(clinicStats, null, 2));
        // 2. Verificar uma amostra de tarefas
        if (clinicStats.length > 0) {
            const sampleClinicId = clinicStats[0].clinicId;
            const tasks = await prisma.task.findMany({
                where: { clinicId: sampleClinicId },
                take: 3,
                include: { patient: true }
            });
            console.log(`Amostra de tarefas da clínica ${sampleClinicId}:`, JSON.stringify(tasks, null, 2));
        }
        // 3. Verificar usuários e suas clínicas
        const users = await prisma.user.findMany({
            select: { email: true, clinicId: true, role: true }
        });
        console.log('Usuários e Clínicas:', JSON.stringify(users, null, 2));
    }
    catch (error) {
        console.error('ERRO NO DIAGNÓSTICO:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
diagnose();
