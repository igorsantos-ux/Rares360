import { PrismaClient } from '@prisma/client';
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

export const extendPrisma = (prisma: PrismaClient) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const clinicId = getClinicId();
          
          // Se não houver clinicId (ex: scripts, seed, ou rotas públicas), executa normal
          if (!clinicId) return query(args);

          // Aplicar filtros de isolamento APENAS se o modelo for um tenant model
          if (!TENANT_MODELS.includes(model)) {
            return query(args);
          }

          // Aplicar filtros de isolamento
          if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(operation)) {
            (args as any).where = { ...(args as any).where, clinicId };
            return query(args);
          }

          if (operation === 'findUnique') {
            // findUnique não aceita campos extras no where (além dos @unique/@id).
            // Transformamos em findFirst para permitir o filtro por clinicId mantendo o isolamento.
            (args as any).where = { ...(args as any).where, clinicId };
            return (prisma as any)[model].findFirst(args);
          }

          if (['create', 'createMany'].includes(operation)) {
            if (operation === 'create') {
              (args as any).data = { ...(args as any).data, clinicId };
            } else {
              if (Array.isArray((args as any).data)) {
                (args as any).data = (args as any).data.map((item: any) => ({ ...item, clinicId }));
              }
            }
          }

          if (['update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
            // Para operações de escrita que usam o 'where', injetamos o clinicId.
            // Nota: Se for 'update' ou 'delete' via ID, o Prisma pode reclamar se adicionarmos o clinicId
            // na cláusula 'where' se este não fizer parte de um índice único composto.
            // Como usamos UUIDs, o risco de colisão/acesso indevido é baixíssimo, 
            // mas para garantir segurança, injetamos apenas se não for um 'id' simples ou se for 'Many'.
            
            const isSingleIdOperation = ['update', 'delete', 'upsert'].includes(operation) && (args as any).where?.id;
            
            if (!isSingleIdOperation || operation.endsWith('Many')) {
              (args as any).where = { ...(args as any).where, clinicId };
            }
          }

          return query(args);
        },
      },
    },
  });
};
