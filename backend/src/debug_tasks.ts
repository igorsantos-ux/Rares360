import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugTasks() {
    const count = await prisma.task.count();
    console.log(`Total de tarefas no banco: ${count}`);
    
    const tasks = await prisma.task.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    });
    
    console.log('Últimas 10 tarefas:');
    console.log(JSON.stringify(tasks, null, 2));
}

debugTasks()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
