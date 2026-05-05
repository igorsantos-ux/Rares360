export interface InvestmentInput {
  valorTotal: number;
  entrada: number;
  parcelas: number;
  jurosMes: number;
  vidaUtilAnos: number;
  valorResidualPct: number;
  ticketMedio: number;
  sessoesMetaMes: number;
  custoInsumoSessao: number;
  custoFixoMensal: number;
  taxasRepasse: number;
}

export interface InvestmentResult {
  parcelaMensal: number;
  depreciacaoMensal: number;
  receitaBruta: number;
  custoVariavel: number;
  taxasValor: number;
  custoTotalMensal: number;
  lucroMensal: number;
  roiAnual: number;
  peValorFaturamento: number;
  peSessoes: number;
  paybackMeses: number | null;
  status: 'LUCRATIVO' | 'ATENCAO' | 'PREJUIZO';
  evolucao: Array<{ mes: number; retornoAcumulado: number }>;
}

export function calcInvestment(input: InvestmentInput): InvestmentResult {
  const financiado = input.valorTotal - input.entrada;

  // Parcela (Price)
  const parcelaMensal = input.parcelas > 0 && input.jurosMes > 0
    ? calcPriceSeries(financiado, input.jurosMes / 100, input.parcelas)
    : financiado / Math.max(input.parcelas, 1);

  // Depreciação linear
  const valorResidual = input.valorTotal * input.valorResidualPct;
  const depreciacaoMensal = (input.valorTotal - valorResidual)
    / (input.vidaUtilAnos * 12);

  // Receita e custos
  const receitaBruta = input.ticketMedio * input.sessoesMetaMes;
  const custoVariavel = input.custoInsumoSessao * input.sessoesMetaMes;
  const taxasValor = receitaBruta * input.taxasRepasse;
  const custoTotalMensal = custoVariavel + input.custoFixoMensal
    + taxasValor + parcelaMensal + depreciacaoMensal;
  const lucroMensal = receitaBruta - custoTotalMensal;
  const roiAnual = input.valorTotal > 0
    ? (lucroMensal * 12) / input.valorTotal * 100 : 0;

  // Ponto de equilíbrio
  const margemUnit = input.ticketMedio * (1 - input.taxasRepasse)
    - input.custoInsumoSessao;
  const custoFixoTotal = input.custoFixoMensal + parcelaMensal + depreciacaoMensal;
  
  // Margem de contribuição em porcentagem
  const mcPct = input.ticketMedio > 0 
    ? (input.ticketMedio - input.custoInsumoSessao - (input.ticketMedio * input.taxasRepasse)) / input.ticketMedio 
    : 0;

  const peValorFaturamento = mcPct > 0
    ? custoFixoTotal / mcPct
    : 0;
    
  const peSessoes = margemUnit > 0
    ? Math.ceil(custoFixoTotal / margemUnit) : 999;

  // Payback
  const paybackMeses = lucroMensal > 0
    ? Math.ceil(input.valorTotal / lucroMensal) : null;

  // Status
  const pctMeta = peValorFaturamento > 0
    ? (receitaBruta / peValorFaturamento) * 100 : 0;
    
  const status = lucroMensal >= 0 && pctMeta >= 100
    ? 'LUCRATIVO' : pctMeta >= 70 ? 'ATENCAO' : 'PREJUIZO';

  // Evolução 24 meses
  const evolucao = Array.from({ length: 25 }, (_, i) => ({
    mes: i,
    retornoAcumulado: r2(-input.entrada + lucroMensal * i),
  }));

  return {
    parcelaMensal: r2(parcelaMensal),
    depreciacaoMensal: r2(depreciacaoMensal),
    receitaBruta: r2(receitaBruta),
    custoVariavel: r2(custoVariavel),
    taxasValor: r2(taxasValor),
    custoTotalMensal: r2(custoTotalMensal),
    lucroMensal: r2(lucroMensal),
    roiAnual: r1(roiAnual),
    peValorFaturamento: r2(peValorFaturamento),
    peSessoes,
    paybackMeses,
    status,
    evolucao,
  };
}

function calcPriceSeries(pv: number, i: number, n: number): number {
  if (i === 0) return pv / n;
  return pv * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
}
const r2 = (n: number) => Math.round(n * 100) / 100;
const r1 = (n: number) => Math.round(n * 10) / 10;
