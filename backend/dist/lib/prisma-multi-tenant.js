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
    'Task'
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
                    // Aplicar filtros de isolamento
                    if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                        args.where = { ...args.where, clinicId };
                    }
                    if (['create', 'createMany'].includes(operation)) {
                        if (operation === 'create') {
                            args.data = { ...args.data, clinicId };
                        }
                        else {
                            if (Array.isArray(args.data)) {
                                args.data = args.data.map((item) => ({ ...item, clinicId }));
                            }
                        }
                    }
                    if (['update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
                        args.where = { ...args.where, clinicId };
                    }
                    return query(args);
                },
            },
        },
    });
};
