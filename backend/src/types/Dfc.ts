export interface DfcKpis {
    initialBalance: number;
    cashGeneration: number;
    cashGenerationPercent: number; // vs period
    projectedFinalBalance: number;
    runwayMonths: number;
    runwayDays: number;
    burnRate: number;
    burnRateChange: number; // vs 3 months
    liquidityIndex: number;
    liquidityStatus: 'SAUDAVEL' | 'ATENCAO' | 'CRITICO';
}

export interface DfcDailyFlow {
    date: string; // ISO string YYYY-MM-DD
    inflows: number;
    outflows: number;
    realizedBalance?: number;
    projectedBalance?: number;
    isProjected: boolean;
    events: { name: string; type: 'TAX' | 'PAYROLL' | 'RENT' | 'OTHER' }[];
}

export interface DfcTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    status: 'PENDING' | 'REALIZED';
    counterparty?: string;
    type: 'INFLOW' | 'OUTFLOW';
}

export interface DfcActivityCategory {
    id: string;
    name: string;
    value: number;
    percentOfTotal: number;
    previousValue: number;
    transactions?: DfcTransaction[];
}

export interface DfcActivityBlock {
    type: 'OPERATIONAL' | 'INVESTMENT' | 'FINANCING';
    totalInflows: number;
    totalOutflows: number;
    netFlow: number;
    categories: DfcActivityCategory[];
    compositionData?: { name: string; value: number; color: string }[];
}

export interface DfcReportResponse {
    kpis: DfcKpis;
    dailyFlows: DfcDailyFlow[];
    activities: DfcActivityBlock[];
}

export interface DfcAiRecommendation {
    titulo: string;
    acao: string;
    prazo: 'imediato' | '7d' | '30d';
    impacto_estimado_reais: number;
    prioridade: 'alta' | 'media' | 'baixa';
}

export interface DfcAiInsights {
    diagnostico_caixa: string;
    risco_caixa_negativo: { probabilidade: number; dias_ate_evento: number; valor_estimado: number };
    pontos_atencao: string[];
    recomendacoes_taticas: DfcAiRecommendation[];
    score_saude_caixa: number; // 0-100
    proximo_evento_critico: { data: string; descricao: string; valor: number };
}

export interface DfcAlert {
    id: string;
    type: 'CRITICAL' | 'WARNING' | 'OPPORTUNITY' | 'INFO';
    message: string;
    date?: string;
    value?: number;
    actionLabel?: string;
    actionEndpoint?: string;
}

export interface DfcSimulationInput {
    inflowMultiplier: number; // 0.5 to 1.5
    outflowMultiplier: number; // 0.5 to 1.5
    additionalEvents: { type: 'INFLOW' | 'OUTFLOW'; date: string; amount: number; description: string }[];
    periodDays: 30 | 60 | 90 | 180;
}

export interface DfcSimulatedScenario {
    type: 'OPTIMISTIC' | 'REALISTIC' | 'PESSIMISTIC';
    dailyFlows: DfcDailyFlow[];
    finalBalance: number;
    worstBalance: number;
    runwayDays: number;
}
