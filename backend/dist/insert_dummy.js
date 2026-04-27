import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function insertDummy() {
    try {
        const res = await prisma.accountPayable.create({
            data: {
                clinicId: 'bc78fc97-20d2-412a-a4c3-f9ea0c5eb04a',
                description: 'TESTE MANUAL ANTIGRAVITY',
                totalAmount: 123.45,
                status: 'PENDENTE',
                dueDate: new Date(),
                expenseType: 'FIXA',
                category: 'TESTE',
                payee: 'ANTIGRAVITY BOT',
                costCenter: 'Operacional',
                costType: 'FIXA'
            }
        });
        console.log('✅ Registro dummy criado:', res);
    }
    catch (e) {
        console.error('❌ Erro ao criar dummy:', e);
    }
    finally {
        await prisma.$disconnect();
    }
}
insertDummy();
