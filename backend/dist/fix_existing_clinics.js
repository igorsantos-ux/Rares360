import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const suggestedDocuments = [
    // Clínica
    { title: 'Contrato Social / Cartão CNPJ', category: 'Clínica' },
    { title: 'Alvará de Funcionamento', category: 'Clínica' },
    { title: 'Alvará Sanitário (VISA)', category: 'Clínica' },
    { title: 'LTA (Laudo Técnico de Avaliação)', category: 'Clínica' },
    { title: 'PGRSS (Plano de Resíduos)', category: 'Clínica' },
    { title: 'Seguro Resp. Civil Operacional', category: 'Clínica' },
    // Corpo Clínico
    { title: 'CRM e RQE', category: 'Médico' },
    { title: 'Diploma e Certificados', category: 'Médico' },
    { title: 'Seguro Resp. Civil Profissional', category: 'Médico' },
    { title: 'Contrato de Prestação de Serviço', category: 'Médico' },
    // Templates
    { title: 'TCLE (Termo de Consentimento)', category: 'Templates' },
    { title: 'Contrato Prestação de Serviço ao Paciente', category: 'Templates' },
    { title: 'Termo de Uso de Imagem', category: 'Templates' }
];
async function main() {
    const clinics = await prisma.clinic.findMany();
    console.log(`Verificando ${clinics.length} clínicas...`);
    for (const clinic of clinics) {
        const docCount = await prisma.clinicDocument.count({
            where: { clinicId: clinic.id }
        });
        if (docCount === 0) {
            console.log(`Semeando documentos para a clínica: ${clinic.name}...`);
            await prisma.clinicDocument.createMany({
                data: suggestedDocuments.map(doc => ({
                    ...doc,
                    clinicId: clinic.id,
                    status: 'PENDENTE'
                }))
            });
        }
        else {
            console.log(`Clínica ${clinic.name} já possui documentos.`);
        }
    }
    console.log('✅ Semeação concluída para todas as clínicas.');
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
