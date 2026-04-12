import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
    console.log('Iniciando migração de status de tarefas...');
    
    const result = await prisma.task.updateMany({
        where: {
            OR: [
                { status: 'ABERTA' },
                { status: 'PENDENTE' }
            ]
        },
        data: {
            status: 'TODO'
        }
    });

    console.log(`Migração concluída. ${result.count} tarefas atualizadas para o status TODO.`);
    
    // Também vamos garantir que tarefas CONCLUÍDAS virem DONE
    const doneResult = await prisma.task.updateMany({
        where: {
            OR: [
                { status: 'CONCLUÍDA' },
                { status: 'PAGO' }
            ]
        },
        data: {
            status: 'DONE'
        }
    });
    
    console.log(`${doneResult.count} tarefas atualizadas para o status DONE.`);

}

migrate()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
