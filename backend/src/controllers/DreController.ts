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

            const { startDate, endDate, compareWith, viewType } = req.body;

            // TODO: Construção detalhada do DRE Aggregate! 
            // Para efeitos de scaffolding inicial, este será o retorno simulado com DRE zerada 
            // no formato estrito do Front-end C-Level.
            // Os aggregates de Transaction e AccountPayable serão adicionados na sequencia

            res.json({
                kpis: {
                    receitaBruta: { value: 0, percentChange: 0, sparkline: [0, 0, 0, 0, 0, 0] },
                    margemContribuicao: { value: 0, percentValue: 0, percentChange: 0, sparkline: [0, 0, 0, 0, 0, 0] },
                    resultadoLiquido: { value: 0, percentValue: 0, status: 'Atenção', sparkline: [0, 0, 0, 0, 0, 0] },
                    ebitda: { value: 0, percentValue: 0, percentChange: 0, sparkline: [0, 0, 0, 0, 0, 0] },
                    pontoEquilibrio: { value: 0, percentChange: 0 },
                    eficienciaOperacional: { value: 0, trend: 'neutral' }
                },
                waterfall: [
                    { name: 'Receita Bruta', value: 0, type: 'total' },
                    { name: 'Deduções', value: 0, type: 'negative' },
                    { name: 'Receita Líquida', value: 0, type: 'total' },
                    { name: 'Custos Variáveis', value: 0, type: 'negative' },
                    { name: 'Margem Contribuição', value: 0, type: 'total' },
                    { name: 'Custos Fixos', value: 0, type: 'negative' },
                    { name: 'Desp. Operacionais', value: 0, type: 'negative' },
                    { name: 'EBITDA', value: 0, type: 'total' },
                    { name: 'Depreciação/Juros', value: 0, type: 'negative' },
                    { name: 'Impostos', value: 0, type: 'negative' },
                    { name: 'Resultado Líquido', value: 0, type: 'total' }
                ],
                tableData: [
                    { id: 'REC_BRUTA', title: '(+) RECEITA OPERACIONAL BRUTA', value: 0, isHighlighted: true, subRows: [] },
                    { id: 'DED', title: '(-) DEDUÇÕES DA RECEITA', value: 0, isHighlighted: false, subRows: [] },
                    { id: 'REC_LIQ', title: '(=) RECEITA OPERACIONAL LÍQUIDA', value: 0, isHighlighted: true },
                    { id: 'CUSTOS_VAR', title: '(-) CUSTOS E DESPESAS VARIÁVEIS', value: 0, isHighlighted: false, subRows: [] },
                    { id: 'MARGEM_CONTRIB', title: '(=) MARGEM DE CONTRIBUIÇÃO', value: 0, isHighlighted: true },
                    { id: 'CUSTOS_FIXOS', title: '(-) CUSTOS FIXOS', value: 0, isHighlighted: false, subRows: [] },
                    { id: 'DESP_OP', title: '(-) DESPESAS OPERACIONAIS', value: 0, isHighlighted: false, subRows: [] },
                    { id: 'EBITDA', title: '(=) EBITDA', value: 0, isHighlighted: true },
                    { id: 'DEP', title: '(-) DEPRECIAÇÃO E AMORTIZAÇÃO', value: 0, isHighlighted: false },
                    { id: 'FIN', title: '(-) DESPESAS FINANCEIRAS', value: 0, isHighlighted: false },
                    { id: 'IMP', title: '(-) IMPOSTOS (IRPJ/CSLL)', value: 0, isHighlighted: false },
                    { id: 'RESULTADO_LIQ', title: '(=) RESULTADO LÍQUIDO', value: 0, isHighlighted: true }
                ],
                compositionData: [
                    { name: 'Insumos', value: 0, color: '#3B6D11' },
                    { name: 'Folha', value: 0, color: '#BA7517' },
                    { name: 'Aluguel', value: 0, color: '#4B5563' },
                    { name: 'Outros', value: 0, color: '#9CA3AF' }
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
