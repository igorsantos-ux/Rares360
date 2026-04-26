// SEC-020: Usar instância Prisma com tenant isolation e audit
import prisma from '../lib/prisma.js';

export class CashSecurity {
    static async validateClosure(clinicId: string, date: Date | string) {
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
