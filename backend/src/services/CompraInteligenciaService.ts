/**
 * Service para cálculo de prioridade de compras (Módulo Inteligência de Compras)
 */
import prisma from '../lib/prisma.js';

export interface ResumoCompras {
    totalItens: number;
    investimentoTotal: number;
    porSetor: any[];
    distribuicaoCriticidade: {
        critico: number;
        urgente: number;
        atencao: number;
        monitorar: number;
    };
}

export class CompraInteligenciaService {
    static async calcularPrioridades(clinicId: string, setorIdFiltro?: string, minScoreFiltro?: number) {
        // Buscar itens ativos que tenham qtdMinima definida > 0
        const where: any = {
            clinicId,
            isActive: true,
            minQuantity: { gt: 0 }
        };
        
        if (setorIdFiltro) {
            where.setorId = setorIdFiltro;
        }

        const itens = await prisma.inventoryItem.findMany({
            where,
            include: {
                setor: true,
                fornecedorPadrao: true
            }
        });

        const itensCalculados = [];
        const distribuicao = { critico: 0, urgente: 0, atencao: 0, monitorar: 0 };
        const setorMap = new Map<string, any>();
        let investimentoTotal = 0;

        for (const item of itens) {
            const qtdMinima = Number(item.minQuantity);
            const qtdAtual = Number(item.currentStock);
            const giroMensal = Number(item.giroMensal || 0);

            // Se o item está com estoque >= mínimo, não precisa comprar (na prioridade imediata)
            if (qtdAtual >= qtdMinima) continue;

            // 1. Cálculo de percentual abaixo do mínimo
            const percentualAbaixoMinimo = ((qtdMinima - qtdAtual) / qtdMinima) * 100;

            // 2. Cálculo de dias até ruptura
            let diasAteRupturaTotal = 999;
            if (giroMensal > 0) {
                const consumoDiario = giroMensal / 30;
                diasAteRupturaTotal = qtdAtual / consumoDiario;
            } else {
                // Se não tem giro calculado, assume 30 dias se tiver algum estoque, senão 0
                diasAteRupturaTotal = qtdAtual > 0 ? 30 : 0;
            }

            // 3. Multiplicador de ruptura
            let multiplicador = 1.0;
            if (diasAteRupturaTotal <= 0) multiplicador = 1.5;
            else if (diasAteRupturaTotal <= 3) multiplicador = 1.3;
            else if (diasAteRupturaTotal <= 7) multiplicador = 1.15;
            else if (diasAteRupturaTotal <= 14) multiplicador = 1.05;

            // 4. Score final (0-100)
            let score = Math.min(100, Math.max(0, percentualAbaixoMinimo * multiplicador));
            score = Math.round(score);

            // Filtrar pelo minScore se fornecido
            if (minScoreFiltro && score < minScoreFiltro) continue;

            // 5. Classificação
            let classificacao = 'MONITORAR';
            if (score >= 80) { classificacao = 'CRITICO'; distribuicao.critico++; }
            else if (score >= 50) { classificacao = 'URGENTE'; distribuicao.urgente++; }
            else if (score >= 30) { classificacao = 'ATENCAO'; distribuicao.atencao++; }
            else { distribuicao.monitorar++; }

            // 6. Quantidade Sugerida
            const qtdAlvo = Number(item.quantidadeIdeal) || (qtdMinima * 2);
            let qtdSugerida = qtdAlvo - qtdAtual;

            if (giroMensal > 0) {
                const estoqueDuranteReposicao = (giroMensal / 30) * Number(item.leadTime || 0);
                qtdSugerida += estoqueDuranteReposicao;
            }
            
            qtdSugerida = Math.ceil(qtdSugerida); // Arredondar pra cima
            if (qtdSugerida <= 0) continue; // Pode acontecer se alvo < atual (raro devido ao filtro inicial)

            // 7. Investimento
            const ultimoCusto = Number(item.unitCost);
            const investimentoEstimado = qtdSugerida * ultimoCusto;
            investimentoTotal += investimentoEstimado;

            // Agrupar por setor para o resumo
            const setorKey = item.setorId || 'SEM_SETOR';
            if (!setorMap.has(setorKey)) {
                setorMap.set(setorKey, {
                    setorId: item.setorId,
                    setorNome: item.setor?.nome || 'Geral/Sem Setor',
                    setorCor: item.setor?.cor || '#64748b',
                    totalItens: 0,
                    investimento: 0
                });
            }
            const s = setorMap.get(setorKey);
            s.totalItens += 1;
            s.investimento += investimentoEstimado;

            itensCalculados.push({
                id: item.id,
                nome: item.name,
                setor: item.setor ? { id: item.setor.id, nome: item.setor.nome, cor: item.setor.cor, icone: item.setor.icone } : null,
                qtdAtual,
                qtdMinima,
                qtdSugerida,
                ultimoCusto,
                ultimoCustoData: item.ultimoCustoData,
                investimentoEstimado,
                scoreCriticidade: score,
                classificacao,
                diasAteRuptura: Math.round(diasAteRupturaTotal),
                giroMensal,
                fornecedorPadrao: item.fornecedorPadrao ? { id: item.fornecedorPadrao.id, nome: item.fornecedorPadrao.nome } : null,
                ultimaCompra: item.lastRestock
            });
        }

        // Ordenar do mais crítico para o menos
        itensCalculados.sort((a, b) => b.scoreCriticidade - a.scoreCriticidade);

        return {
            resumo: {
                totalItens: itensCalculados.length,
                investimentoTotal,
                porSetor: Array.from(setorMap.values()),
                distribuicaoCriticidade: distribuicao
            },
            itens: itensCalculados
        };
    }
}
