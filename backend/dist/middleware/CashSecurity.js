import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export class CashSecurity {
    static async validateClosure(clinicId, date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const closure = await prisma.dailyClosure.findUnique({
            where: {
                clinicId_date: {
                    clinicId,
                    date: targetDate
                }
            }
        });
        if (closure && closure.status === 'CLOSED') {
            throw new Error('Este dia já está fechado e não permite alterações.');
        }
    }
}
