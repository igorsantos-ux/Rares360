import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    console.log('--- GLOBAL DB DIAGNOSTIC ---');

    const clinics = await prisma.clinic.findMany();
    console.log(`Total clinics: ${clinics.length}`);
    clinics.forEach(c => console.log(`- Clinic: ${c.name} (${c.id})`));

    const patientsCount = await prisma.patient.count();
    console.log(`Total patients in DB: ${patientsCount}`);

    const transactionsCount = await prisma.transaction.count();
    console.log(`Total transactions in DB: ${transactionsCount}`);

    if (transactionsCount > 0) {
        const sample = await prisma.transaction.findFirst({
            include: { patient: true }
        });
        console.log('Sample Transaction:', {
            id: sample?.id,
            amount: sample?.amount,
            status: sample?.status,
            patient: sample?.patient?.fullName,
            clinicId: sample?.clinicId
        });
    }

    const patientId = '004c78d2-34f2-4c52-9817-db106bea362f';
    const targetPatient = await prisma.patient.findUnique({
        where: { id: patientId }
    });

    if (targetPatient) {
        console.log(`✅ Found target patient: ${targetPatient.fullName}`);
        const ltv = await prisma.transaction.aggregate({
            where: { patientId, type: 'INCOME', status: { in: ['PAID', 'RECEBIDO', 'PAGO'] } },
            _sum: { amount: true }
        });
        console.log(`LTV result: ${ltv._sum.amount}`);
    } else {
        console.log('❌ Target patient not found by ID');
        const byName = await prisma.patient.findFirst({
            where: { fullName: { contains: 'Maria Isabel', mode: 'insensitive' } }
        });
        if (byName) console.log(`🔍 Found patient by name: ${byName.fullName} (${byName.id})`);
    }

    await prisma.$disconnect();
}

diagnose();
