import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function findUser() {
    const user = await prisma.user.findUnique({
        where: { email: 'igor.santos@rares360.com.br' }
    });
    console.log(user ? 'User found' : 'User NOT found');
    if (user) {
        console.log('Role:', user.role);
        console.log('Has password history:', user.id);
    }
}
findUser().finally(() => prisma.$disconnect());
