import { Request, Response } from 'express';
import { tenantContext } from '../lib/context.js';
import prisma from '../lib/prisma.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Instância do Gemini (Requisito atendido com a key existente no env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class DreController {

    static async getReport(req: Request, res: Response) {
        try {
            const clinicId = tenantContext.getStore()?.clinicId;
            if (!clinicId) return res.status(403).json({ error: 'Clínica não informada no contexto.' });

            const { startDate, endDate } = req.body;
            const start = new Date(startDate);
            const end = new Date(endDate);

            // ═══ Agregações Reais ═══
            const [receitasAgg, deducoesAgg, custosVarAgg, custosFixosAgg, despOpAgg, impAgg] = await Promise.all([
                prisma.transaction.aggregate({
                    _sum: { amount: true },
                    where: { clinicId, type: 'INCOME', date: { gte: start, lte: end } }
                }),
                prisma.transaction.aggregate({
                    _sum: { amount: true },
                    where: { clinicId, type: 'DEDUCTION', date: { gte: start, lte: end } }
                }),
                prisma.accountPayable.aggregate({
                    _sum: { totalAmount: true },
                    where: { clinicId, costType: 'VARIAVEL', status: 'PAGO', paymentDate: { gte: start, lte: end } }
                }),
                prisma.accountPayable.aggregate({
                    _sum: { totalAmount: true },
                    where: { clinicId, costType: 'FIXO', status: 'PAGO', paymentDate: { gte: start, lte: end } }
                }),
                prisma.accountPayable.aggregate({
                    _sum: { totalAmount: true },
                    where: { clinicId, costType: 'OPERACIONAL', status: 'PAGO', paymentDate: { gte: start, lte: end } }
                }),
                prisma.accountPayable.aggregate({
                    _sum: { totalAmount: true },
                    where: { clinicId, category: { contains: 'IMPOSTO' }, status: 'PAGO', paymentDate: { gte: start, lte: end } }
                })
            ]);

            // Helper para extrair valor e converter Decimal -> Number
            const getVal = (agg: any, key: string = 'amount') => Number(agg?._sum?.[key] || 0);

            const receitaBruta = getVal(receitasAgg);
            const deducoes = getVal(deducoesAgg);
            const receitaLiquida = receitaBruta - deducoes;
            const custosVariaveis = getVal(custosVarAgg, 'totalAmount');
            const margemContribuicao = receitaLiquida - custosVariaveis;
            const custosFixos = getVal(custosFixosAgg, 'totalAmount');
            const despOperacionais = getVal(despOpAgg, 'totalAmount');
            const ebitda = margemContribuicao - custosFixos - despOperacionais;
            const impostos = getVal(impAgg, 'totalAmount');
            const resultadoLiquido = ebitda - impostos;

            res.json({
                kpis: {
                    receitaBruta: { value: receitaBruta, percentChange: 0, sparkline: [0, 0, receitaBruta] },
                    margemContribuicao: { value: margemContribuicao, percentValue: receitaLiquida > 0 ? (margemContribuicao / receitaLiquida) * 100 : 0, percentChange: 0, sparkline: [] },
                    resultadoLiquido: { value: resultadoLiquido, percentValue: receitaBruta > 0 ? (resultadoLiquido / receitaBruta) * 100 : 0, status: resultadoLiquido > 0 ? 'Positivo' : 'Atenção', sparkline: [] },
                    ebitda: { value: ebitda, percentValue: receitaLiquida > 0 ? (ebitda / receitaLiquida) * 100 : 0, percentChange: 0, sparkline: [] },
                    pontoEquilibrio: { value: custosFixos / 0.6, percentChange: 0 }, // Simplificado
                    eficienciaOperacional: { value: receitaBruta > 0 ? (ebitda / receitaBruta) * 100 : 0, trend: 'neutral' }
                },
                waterfall: [
                    { name: 'Receita Bruta', value: receitaBruta, type: 'total' },
                    { name: 'Deduções', value: deducoes, type: 'negative' },
                    { name: 'Receita Líquida', value: receitaLiquida, type: 'total' },
                    { name: 'Custos Variáveis', value: custosVariaveis, type: 'negative' },
                    { name: 'Margem Contribuição', value: margemContribuicao, type: 'total' },
                    { name: 'Custos Fixos', value: custosFixos, type: 'negative' },
                    { name: 'Desp. Operacionais', value: despOperacionais, type: 'negative' },
                    { name: 'EBITDA', value: ebitda, type: 'total' },
                    { name: 'Impostos', value: impostos, type: 'negative' },
                    { name: 'Resultado Líquido', value: resultadoLiquido, type: 'total' }
                ],
                tableData: [
                    { id: 'REC_BRUTA', title: '(+) RECEITA OPERACIONAL BRUTA', value: receitaBruta, isHighlighted: true, subRows: [] },
                    { id: 'DED', title: '(-) DEDUÇÕES DA RECEITA', value: deducoes, isHighlighted: false, subRows: [] },
                    { id: 'REC_LIQ', title: '(=) RECEITA OPERACIONAL LÍQUIDA', value: receitaLiquida, isHighlighted: true },
                    { id: 'CUSTOS_VAR', title: '(-) CUSTOS E DESPESAS VARIÁVEIS', value: custosVariaveis, isHighlighted: false, subRows: [] },
                    { id: 'MARGEM_CONTRIB', title: '(=) MARGEM DE CONTRIBUIÇÃO', value: margemContribuicao, isHighlighted: true },
                    { id: 'CUSTOS_FIXOS', title: '(-) CUSTOS FIXOS', value: custosFixos, isHighlighted: false, subRows: [] },
                    { id: 'DESP_OP', title: '(-) DESPESAS OPERACIONAIS', value: despOperacionais, isHighlighted: false, subRows: [] },
                    { id: 'EBITDA', title: '(=) EBITDA', value: ebitda, isHighlighted: true },
                    { id: 'IMP', title: '(-) IMPOSTOS (IRPJ/CSLL)', value: impostos, isHighlighted: false },
                    { id: 'RESULTADO_LIQ', title: '(=) RESULTADO LÍQUIDO', value: resultadoLiquido, isHighlighted: true }
                ],
                compositionData: [
                    { name: 'Insumos', value: custosVariaveis, color: '#3B6D11' },
                    { name: 'Custos Fixos', value: custosFixos, color: '#BA7517' },
                    { name: 'Desp. Operacionais', value: despOperacionais, color: '#4B5563' },
                    { name: 'Impostos', value: impostos, color: '#9CA3AF' }
                ],
                marginEvolution: [],
                topExpenses: []
            });

        } catch (error) {
            console.error('Erro em getReport da DRE:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório DRE.' });
        }
    }

    static async getAiInsights(req: Request, res: Response) {
        try {
            const clinicId = tenantContext.getStore()?.clinicId;
            if (!clinicId) return res.status(403).json({ error: 'Clínica não informada no contexto.' });

            const { dreData } = req.body;

            // Instanciando o LLM Flash-Latest que é mais veloz (já validado em interações anteriores pelo usuário)
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

            const prompt = `
Você é um CFO sênior de clínicas médicas de altíssimo nível no Brasil e atua analisando ferramentas financeiras.
Foi fornecido um pacote completo da DRE da clínica, e sua tarefa é gerar uma devolutiva impecável retornando os insights estritamente nesse formato JSON (Apenas JSON, sem formatação markdown no contorno).
            
Parâmetros de Benchmark SAUDÁVEL:
- Margem de contribuição saudável: 60 a 70%
- Margem EBITDA saudável: 20 a 35%
- Liquidez: positiva e 15 a 25%

Sua resposta DEVE ser esse objeto (SEM NENHUM TEXTO EXTRA ALÉM DAS CHAVES {}):
{
  "diagnostico_geral": "Texto sucinto C-level avaliando a saúde e direção",
  "pontos_fortes": ["Ponto 1", "Ponto 2"],
  "pontos_criticos": ["Alerta 1", "Alerta 2"],
  "recomendacoes": [
    { "titulo": "Ação Direta", "acao": "Texto descritivo de como aplicar na prática", "impacto_estimado": "Cifra ou porcentagem prevista", "prioridade": "alta" }
  ],
  "score_saude_financeira": 87,
  "comparacao_setor": "Texto de comparação qualitativa breve de 2 linhas."
}

DADOS DA CLÍNICA:
---
${JSON.stringify(dreData)}
---
            `;

            // ═══ PERF-005: Circuit Breaker para Gemini API ═══
            const { geminiCircuitBreaker } = await import('../lib/circuitBreaker.js');

            const parsed = await geminiCircuitBreaker.execute(
                async () => {
                    const result = await model.generateContent(prompt);
                    let insightJSON = result.response.text();
                    insightJSON = insightJSON.replace(/^```(json)?\n?/mi, '').replace(/\n?```$/mi, '').trim();
                    return JSON.parse(insightJSON);
                },
                () => ({
                    diagnostico_geral: '⚠️ Análise de IA temporariamente indisponível. Os dados financeiros estão sendo exibidos normalmente, mas os insights automatizados estão em manutenção. Tente novamente em alguns minutos.',
                    pontos_fortes: [],
                    pontos_criticos: ['Serviço de IA indisponível no momento'],
                    recomendacoes: [],
                    score_saude_financeira: 0,
                    comparacao_setor: 'Indisponível — serviço em recuperação.'
                })
            );

            res.json(parsed);

        } catch (error) {
            console.error('Erro na AI DRE:', error);
            res.status(500).json({ error: 'Falha durante o diagnóstico C-Level. Refaça a query ou verifique a quota.' });
        }
    }

    static async exportPdf(req: Request, res: Response) {
        res.json({ message: "Serviço de geração nativo será engatilhado no fluxo de visualização." });
    }
}
