import prisma from '../lib/prisma.js';

export class PGEService {
    static async calculatePGE(clinicId: string) {
        // 1. Buscar todos os itens ativos do estoque
        const items = await prisma.inventoryItem.findMany({
            where: { clinicId, isActive: true },
            orderBy: { name: 'asc' }
        });

        // 2. Definir período de análise (últimos 30 dias)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 3. Buscar todas as saídas dos últimos 30 dias de uma vez (otimização)
        const movements = await prisma.stockMovement.findMany({
            where: {
                clinicId,
                type: 'OUT',
                date: { gte: thirtyDaysAgo, lte: today }
            },
            select: {
                itemId: true,
                quantity: true
            }
        });

        // 4. Agrupar saídas por itemId
        const outputMap: Record<string, number> = {};
        for (const mov of movements) {
            outputMap[mov.itemId] = (outputMap[mov.itemId] || 0) + mov.quantity;
        }

        // 5. Processar cada item com o motor matemático
        const results = items.map(item => {
            const totalOutput = outputMap[item.id] || 0;
            const currentStock = Number(item.currentStock);
            const leadTime = Number(item.leadTime || 0);
            const safetyStock = Number(item.safetyStock || 0);
            const desiredCoverage = Number(item.desiredCoverage || 0);
            const unitCost = Number(item.unitCost || 0);

            // Consumo médio diário
            const consumoMedio = totalOutput / 30;

            // Proteção contra divisão por zero
            if (consumoMedio === 0) {
                return {
                    id: item.id,
                    code: item.code,
                    name: item.name,
                    category: item.category,
                    unit: item.unit,
                    supplier: item.supplier,
                    currentStock,
                    unitCost,
                    leadTime,
                    desiredCoverage,
                    safetyStock,
                    consumoMedio: 0,
                    diasRestantes: null,
                    dataRuptura: null,
                    pontoReposicao: 0,
                    qtdCompra: 0,
                    status: 'SEM_CONSUMO' as const,
                    totalSaidas30d: 0
                };
            }

            // Dias restantes e data de ruptura
            const diasRestantes = currentStock / consumoMedio;
            const dataRuptura = new Date(today);
            dataRuptura.setDate(dataRuptura.getDate() + Math.floor(diasRestantes));

            // Ponto de reposição
            const pontoReposicao = (consumoMedio * leadTime) + safetyStock;

            // Decisão e quantidade de compra
            let status: 'COMPRAR' | 'OK' | 'SEM_CONSUMO' = 'OK';
            let qtdCompra = 0;

            if (currentStock <= pontoReposicao) {
                status = 'COMPRAR';
                qtdCompra = Math.ceil(
                    (consumoMedio * desiredCoverage + safetyStock) - currentStock
                );
                if (qtdCompra < 0) qtdCompra = 0;
            }

            return {
                id: item.id,
                code: item.code,
                name: item.name,
                category: item.category,
                unit: item.unit,
                supplier: item.supplier,
                currentStock,
                unitCost,
                leadTime,
                desiredCoverage,
                safetyStock,
                consumoMedio: Math.round(consumoMedio * 100) / 100,
                diasRestantes: Math.round(diasRestantes),
                dataRuptura: dataRuptura.toISOString(),
                pontoReposicao: Math.round(pontoReposicao * 100) / 100,
                qtdCompra,
                status,
                totalSaidas30d: totalOutput
            };
        });

        // 6. Ordenar: COMPRAR primeiro, depois por dias restantes (mais urgente primeiro)
        results.sort((a, b) => {
            const statusOrder = { COMPRAR: 0, OK: 1, SEM_CONSUMO: 2 };
            const diff = statusOrder[a.status] - statusOrder[b.status];
            if (diff !== 0) return diff;
            return (a.diasRestantes ?? 9999) - (b.diasRestantes ?? 9999);
        });

        // 7. KPIs globais
        const totalItems = results.length;
        const criticalItems = results.filter(r => r.status === 'COMPRAR').length;
        const noConsumptionItems = results.filter(r => r.status === 'SEM_CONSUMO').length;
        const estimatedCost = results
            .filter(r => r.status === 'COMPRAR')
            .reduce((acc, r) => acc + (r.qtdCompra * Number(r.unitCost)), 0);

        return {
            kpis: {
                totalItems,
                criticalItems,
                noConsumptionItems,
                estimatedCost
            },
            items: results
        };
    }
}
