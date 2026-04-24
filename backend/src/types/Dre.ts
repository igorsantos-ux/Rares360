export interface DreReportFilter {
    periodType: 'ESTE_MES' | 'MES_ANTERIOR' | 'ULTIMOS_3_MESES' | 'ULTIMOS_6_MESES' | 'ULTIMOS_12_MESES' | 'ANO_CORRENTE' | 'CUSTOM';
    startDate?: string;
    endDate?: string;
    viewType: 'GERENCIAL' | 'CONTABIL';
    compareWith: 'MES_ANTERIOR' | 'MESMO_MES_ANO_PASSADO' | 'MEDIA_12_MESES' | 'NENHUM';
}

export interface DreKpis {
    receitaBruta: { value: number; percentChange: number; sparkline: number[] };
    margemContribuicao: { value: number; percentValue: number; percentChange: number; sparkline: number[] };
    resultadoLiquido: { value: number; percentValue: number; status: 'Saudável' | 'Atenção' | 'Crítico'; sparkline: number[] };
    ebitda: { value: number; percentValue: number; percentChange: number; sparkline: number[] };
    pontoEquilibrio: { value: number; percentChange: number };
    eficienciaOperacional: { value: number; trend: 'up' | 'down' | 'neutral' };
}

export interface DreRow {
    id: string; // ex: RECEITA_BRUTA
    title: string;
    value: number;
    compareValue?: number;
    percentChange?: number;
    percentOfRevenue?: number;
    benchmarkStatus?: 'OK' | 'ALERTA' | 'CRITICO';
    subRows?: DreRow[];
    isHighlighted?: boolean;
}

export interface DreWaterfallData {
    name: string;
    value: number;
    type: 'total' | 'positive' | 'negative';
    percentOfRevenue?: number;
}

export interface DreResponse {
    kpis: DreKpis;
    waterfall: DreWaterfallData[];
    tableData: DreRow[];
    compositionData: { name: string; value: number; color: string }[];
    marginEvolution: { month: string; margemContribuicao: number; ebitda: number; margemLiquida: number }[];
    topExpenses: { name: string; value: number }[];
}

export interface AiRecommendation {
    titulo: string;
    acao: string;
    impacto_estimado: string;
    prioridade: 'alta' | 'media' | 'baixa';
}

export interface AiInsightsResponse {
    diagnostico_geral: string;
    pontos_fortes: string[];
    pontos_criticos: string[];
    recomendacoes: AiRecommendation[];
    score_saude_financeira: number;
    comparacao_setor: string;
}
