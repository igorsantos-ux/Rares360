import { PrismaClient } from '@prisma/client';

export const extendPrisma = (prisma: PrismaClient, clinicId?: string) => {
  if (!clinicId) return prisma;

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Lista de modelos que possuem isolamento por clinicId
          const tenantModels = [
            'User', 
            'Patient', 
            'AccountPayable', 
            'AccountReceivable', 
            'InventoryItem', 
            'PricingSimulation', 
            'ProcedurePricing',
            'Transaction',
            'Doctor',
            'FinancialGoal',
            'Document',
            'Lead'
          ];

          if (tenantModels.includes(model)) {
            // Operações de leitura (filtram por clinicId)
            if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation)) {
              args.where = { ...args.where, clinicId };
            }

            // Operações de escrita (garantem que o clinicId seja do tenant atual)
            if (['create', 'createMany'].includes(operation)) {
              if (operation === 'create') {
                args.data = { ...args.data, clinicId };
              } else {
                if (Array.isArray(args.data)) {
                  args.data = args.data.map((item: any) => ({ ...item, clinicId }));
                }
              }
            }

            if (['update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
              args.where = { ...args.where, clinicId };
            }
          }

          return query(args);
        },
      },
    },
  });
};
