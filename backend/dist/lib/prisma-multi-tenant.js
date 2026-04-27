import { getClinicId } from './context.js';
// Lista de modelos que possuem explicitamente o campo clinicId
const TENANT_MODELS = [
    'User',
    'Transaction',
    'Doctor',
    'Patient',
    'Lead',
    'InventoryItem',
    'StockMovement',
    'FinancialGoal',
    'Document',
    'ClinicDocument',
    'AccountPayable',
    'PricingSimulation',
    'ProcedurePricing',
    'DailyClosure',
    'ProcedureExecution',
    'Task',
    'Appointment',
    'Room',
    'Equipment',
    'ClinicalEvolution',
    'Prescription',
    'InventoryUsage',
    'Proposal'
];
export const extendPrisma = (prisma) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const clinicId = getClinicId();
                    // Se não houver clinicId (ex: scripts, seed, ou rotas públicas), executa normal
                    if (!clinicId)
                        return query(args);
                    // Aplicar filtros de isolamento APENAS se o modelo for um tenant model
                    if (!TENANT_MODELS.includes(model)) {
                        return query(args);
                    }
                    // === LEITURA: Injetar clinicId no where ===
                    if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                        args.where = { ...args.where, clinicId };
                        return query(args);
                    }
                    if (operation === 'findUnique') {
                        // findUnique não aceita campos extras no where (além dos @unique/@id).
                        // Transformamos em findFirst para permitir o filtro por clinicId mantendo o isolamento.
                        args.where = { ...args.where, clinicId };
                        return prisma[model].findFirst(args);
                    }
                    // === CRIAÇÃO: Injetar clinicId nos dados ===
                    if (['create', 'createMany'].includes(operation)) {
                        if (operation === 'create') {
                            args.data = { ...args.data, clinicId };
                        }
                        else {
                            if (Array.isArray(args.data)) {
                                args.data = args.data.map((item) => ({ ...item, clinicId }));
                            }
                        }
                        return query(args);
                    }
                    // === SEC-004: ESCRITA (update/delete/upsert) — SEMPRE injetar clinicId ===
                    // Para operações de update/delete por ID único, o Prisma exige apenas campos
                    // @unique no where. Convertemos para updateMany/deleteMany que aceita clinicId,
                    // ou usamos findFirst + update para manter o isolamento de tenant.
                    if (operation === 'update') {
                        // Converter para findFirst + verificação, para garantir isolamento
                        const record = await prisma[model].findFirst({
                            where: { ...args.where, clinicId },
                            select: { id: true }
                        });
                        if (!record) {
                            throw new Error(`Registro não encontrado ou acesso negado (tenant isolation)`);
                        }
                        return query(args);
                    }
                    if (operation === 'updateMany') {
                        args.where = { ...args.where, clinicId };
                        return query(args);
                    }
                    if (operation === 'delete') {
                        // Verificar ownership antes de deletar
                        const record = await prisma[model].findFirst({
                            where: { ...args.where, clinicId },
                            select: { id: true }
                        });
                        if (!record) {
                            throw new Error(`Registro não encontrado ou acesso negado (tenant isolation)`);
                        }
                        return query(args);
                    }
                    if (operation === 'deleteMany') {
                        args.where = { ...args.where, clinicId };
                        return query(args);
                    }
                    if (operation === 'upsert') {
                        args.where = { ...args.where, clinicId };
                        args.create = { ...args.create, clinicId };
                        return query(args);
                    }
                    return query(args);
                },
            },
        },
    });
};
