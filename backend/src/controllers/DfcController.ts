import { Request, Response } from 'express';
import { tenantContext } from '../lib/context.js';
import prisma from '../lib/prisma.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DfcReportResponse } from '../types/Dfc.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class DfcController {
    static async getReport(req: Request, res: Response) {
        try {
            const clinicId = tenantContext.getStore()?.clinicId;
            if (!clinicId) return res.status(403).json({ error: 'Clínica não informada no contexto.' });

            const mockDfc: DfcReportResponse = {
                kpis: {
                    initialBalance: 125000,
                    cashGeneration: 45000,
                    cashGenerationPercent: 12.5,
                    projectedFinalBalance: 170000,
                    runwayMonths: 8,
                    runwayDays: 240,
                    burnRate: 15000,
                    burnRateChange: -2.5,
                    liquidityIndex: 1.8,
                    liquidityStatus: 'SAUDAVEL'
                },
                dailyFlows: Array.from({ length: 90 }).map((_, i) => ({
                    date: new Date(new Date().setDate(new Date().getDate() - 30 + i)).toISOString().split('T')[0],
                    inflows: Math.random() * 8000 + 1000,
                    outflows: Math.random() * 5000 + 500,
                    realizedBalance: i <= 30 ? 125000 + (i * 1500) : undefined,
                    projectedBalance: i > 30 ? 170000 + ((i - 30) * 1000) : undefined,
                    isProjected: i > 30,
                    events: i % 15 === 0 ? [{ name: 'Folha', type: 'PAYROLL' }] : []
                })),
                activities: [
                    {
                        type: 'OPERATIONAL',
                        totalInflows: 150000,
                        totalOutflows: 90000,
                        netFlow: 60000,
                        compositionData: [
                            { name: 'Consultas', value: 80000, color: '#3B6D11' },
                            { name: 'Exames', value: 40000, color: '#BA7517' },
                            { name: 'Procedimentos', value: 30000, color: '#185FA5' }
                        ],
                        categories: [
                            { id: 'OP_REC', name: 'Recebimento de Clínic e Paciente', value: 150000, percentOfTotal: 100, previousValue: 140000, transactions: [] },
                            { id: 'OP_FORN', name: 'Pagamento a Fornecedores', value: 40000, percentOfTotal: 44.4, previousValue: 35000, transactions: [] },
                            { id: 'OP_FOLHA', name: 'Folha de Pagamento', value: 50000, percentOfTotal: 55.6, previousValue: 50000, transactions: [] }
                        ]
                    },
                    {
                        type: 'INVESTMENT',
                        totalInflows: 0,
                        totalOutflows: 15000,
                        netFlow: -15000,
                        categories: [
                            { id: 'INV_EQP', name: 'Aquisição de Equipamentos', value: 15000, percentOfTotal: 100, previousValue: 0, transactions: [] }
                        ]
                    },
                    {
                        type: 'FINANCING',
                        totalInflows: 0,
                        totalOutflows: 0,
                        netFlow: 0,
                        categories: []
                    }
                ]
            };

            res.json(mockDfc);
        } catch (error) {
            console.error('Erro em DfcController.getReport:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório DFC.' });
        }
    }

    static async getProjection(req: Request, res: Response) {
        res.json({ message: "Projeção independente não implementada, incluída no getReport." });
    }

    static async getAiInsights(req: Request, res: Response) {
        try {
            const clinicId = tenantContext.getStore()?.clinicId;
            if (!clinicId) return res.status(403).json({ error: 'Clínica não informada no contexto.' });

            const { dfcData } = req.body;

            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

            const prompt = `
            Você é um Tesoureiro experiente (CFO level) de clínicas médicas. Foi fornecido um dado estruturado de fluxo de caixa (DFC).
            Responda EXCLUSIVAMENTE em JSON, contendo as chaves exatas abaixo.
            Não retorne crases ou a string "json" no começo, somente o JSON puro validável.
            
            Formato Exato Esperado:
            {
              "diagnostico_caixa": "String curta de resumo estratégico",
              "risco_caixa_negativo": { "probabilidade": 10.5, "dias_ate_evento": 15, "valor_estimado": 5000 },
              "pontos_atencao": ["Risco 1", "Risco 2"],
              "recomendacoes_taticas": [
                { "titulo": "Ação XYZ", "acao": "Explicacao de como", "prazo": "7d", "impacto_estimado_reais": 2000, "prioridade": "alta" }
              ],
              "score_saude_caixa": 80,
              "proximo_evento_critico": { "data": "2026-05-15", "descricao": "Folha de Pagamento", "valor": 55000 }
            }

            DADOS DA CLÍNICA:
            ---
            ${JSON.stringify(dfcData)}
            ---
            `;

            const result = await model.generateContent(prompt);
            let insightJSON = result.response.text();

            insightJSON = insightJSON.replace(/^```(json)?\n?/mi, '').replace(/\n?```$/mi, '').trim();

            const parsed = JSON.parse(insightJSON);
            res.json(parsed);
        } catch (error) {
            console.error('Erro na AI DFC:', error);
            res.status(500).json({ error: 'Falha durante o diagnóstico preditivo DFC.' });
        }
    }

    static async simulateScenarios(req: Request, res: Response) {
        try {
            const clinicId = tenantContext.getStore()?.clinicId;
            if (!clinicId) return res.status(403).json({ error: 'Clínica não informada.' });

            const { inflowMultiplier, outflowMultiplier, additionalEvents, periodDays } = req.body;

            // Retorno Mock do Simulador
            res.json({
                scenarios: [
                    { type: 'OPTIMISTIC', finalBalance: 250000, worstBalance: 120000, runwayDays: 320, dailyFlows: [] },
                    { type: 'REALISTIC', finalBalance: 170000, worstBalance: 125000, runwayDays: 240, dailyFlows: [] },
                    { type: 'PESSIMISTIC', finalBalance: 50000, worstBalance: -10000, runwayDays: 45, dailyFlows: [] }
                ]
            });
        } catch (error) {
            res.status(500).json({ error: 'Falha ao executar simulador de DFC.' });
        }
    }
}
