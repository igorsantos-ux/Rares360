import prisma from '../lib/prisma.js';

export class PricingIntegrationService {
    /**
     * Calcula o extrato de custo e as margens de um procedimento de forma automatizada
     * baseado no "Motor de Regras da Clínica" configurado pelo usuário.
     * 
     * @param clinicId ID da Clínica
     * @param procedimentoId ID do Procedimento
     * @param tempoMinutos Tempo de execução (minutos)
     * @param valorVenda Valor cobrado do paciente (Opcional)
     */
    static async calcular(clinicId: string, procedimentoId: string, tempoMinutos: number, valorVenda: number = 0) {
        const clinic = await prisma.clinic.findUnique({
            where: { id: clinicId },
            select: { custoMinutoSala: true }
        });

        if (!clinic) throw new Error('Clínica não encontrada');

        const procedimento = await prisma.procedure.findUnique({
            where: { id: procedimentoId },
            include: {
                categoriaProc: true,
                procedimentoInsumos: {
                    include: { itemEstoque: true }
                }
            }
        });

        if (!procedimento) throw new Error('Procedimento não encontrado');

        // 1. Custo de Sala
        const custoSala = tempoMinutos * Number(clinic.custoMinutoSala || 0);

        // 2. Custo de Insumos (Estoque)
        let custoInsumos = 0;
        const itensEstoque = procedimento.procedimentoInsumos.map(insumo => {
            const custoTotalItem = Number(insumo.quantidadePadrao) * Number(insumo.itemEstoque.unitCost || 0);
            custoInsumos += custoTotalItem;
            return {
                id: insumo.itemEstoque.id,
                nome: insumo.itemEstoque.name,
                quantidadePadrao: Number(insumo.quantidadePadrao),
                custoUnitario: Number(insumo.itemEstoque.unitCost),
                custoTotal: custoTotalItem
            };
        });

        // 3. Impostos (Baseado na categoria do procedimento)
        const impostoPercentual = procedimento.categoriaProc?.impostoPercentual ? Number(procedimento.categoriaProc.impostoPercentual) : 0;
        const valorImposto = (valorVenda * impostoPercentual) / 100;

        // 4. Repasse Médico (Buscando a regra mais específica)
        // Ordem de precedência: Procedimento Específico > Categoria > Genérica
        const regrasRepasse = await prisma.regraRepasseMedico.findMany({
            where: { clinicId, gatilho: 'EXECUCAO' },
            orderBy: { id: 'desc' } // Idealmente, teria uma lógica de precedência aqui
        });

        let valorRepasse = 0;
        let regraRepasseAplicada = null;

        const regraEspecificaProc = regrasRepasse.find(r => r.procedimentoId === procedimentoId);
        const regraCategoria = regrasRepasse.find(r => !r.procedimentoId && r.categoriaId === procedimento.categoriaId);
        const regraGenerica = regrasRepasse.find(r => !r.procedimentoId && !r.categoriaId);

        const regraSelecionada = regraEspecificaProc || regraCategoria || regraGenerica;

        if (regraSelecionada) {
            regraRepasseAplicada = {
                tipo: regraSelecionada.tipoValor,
                valor: Number(regraSelecionada.valor)
            };
            if (regraSelecionada.tipoValor === 'PERCENTUAL') {
                valorRepasse = (valorVenda * Number(regraSelecionada.valor)) / 100;
            } else {
                valorRepasse = Number(regraSelecionada.valor);
            }
        }

        // 5. Comissão (Equipe Vendas)
        const regrasComissao = await prisma.regraComissaoEquipe.findMany({
            where: { clinicId, gatilho: 'VENDA' }
        });

        let valorComissao = 0;
        let regraComissaoAplicada = null;

        const regraComProc = regrasComissao.find(r => r.procedimentoId === procedimentoId);
        const regraComCat = regrasComissao.find(r => !r.procedimentoId && r.categoriaId === procedimento.categoriaId);
        const regraComGen = regrasComissao.find(r => !r.procedimentoId && !r.categoriaId);

        const regraComSelecionada = regraComProc || regraComCat || regraComGen;

        if (regraComSelecionada) {
            regraComissaoAplicada = {
                tipo: regraComSelecionada.tipoValor,
                valor: Number(regraComSelecionada.valor)
            };
            if (regraComSelecionada.tipoValor === 'PERCENTUAL') {
                valorComissao = (valorVenda * Number(regraComSelecionada.valor)) / 100;
            } else {
                valorComissao = Number(regraComSelecionada.valor);
            }
        }

        // --- CÁLCULO FINAL DRE DO PROCEDIMENTO ---
        const custoTotalOperacional = custoSala + custoInsumos + valorImposto + valorRepasse + valorComissao;
        const lucroLiquido = valorVenda - custoTotalOperacional;
        const margemLucro = valorVenda > 0 ? (lucroLiquido / valorVenda) * 100 : 0;

        return {
            resumo: {
                valorVenda,
                custoTotalOperacional,
                lucroLiquido,
                margemLucroPercentual: margemLucro
            },
            detalhes: {
                sala: {
                    tempoMinutos,
                    custoMinuto: Number(clinic.custoMinutoSala),
                    total: custoSala
                },
                insumos: {
                    total: custoInsumos,
                    itens: itensEstoque
                },
                impostos: {
                    percentual: impostoPercentual,
                    total: valorImposto
                },
                repasseMedico: {
                    regra: regraRepasseAplicada,
                    total: valorRepasse
                },
                comissaoEquipe: {
                    regra: regraComissaoAplicada,
                    total: valorComissao
                }
            }
        };
    }
}
