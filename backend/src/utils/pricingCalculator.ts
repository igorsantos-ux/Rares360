/**
 * Utilitário de cálculo de precificação dinâmica para o RARES360.
 * Este helper centraliza todas as fórmulas de margem, lucro e preço sugerido.
 */

export interface PricingConfig {
  taxaSalaPerMin: number;
  impostosRate: number;
  cartaoRate: number;
  comissaoRate: number;
  repasseRate: number;
  margemAlvo: number;
}

export interface ProcedureInput {
  productCost: number;   // custo do produto/insumo
  duration: number;      // duração em minutos
  salePrice: number;     // preço de venda cadastrado
}

export interface PricingResult {
  custoSala: number;
  custoImpostos: number;
  custoCombinado: number;   // impostos + cartão + comissão
  custoTotal: number;
  margemClinica: number;    // % após custos, antes do repasse
  repasseMedico: number;
  lucroLiquido: number;     // após repasse médico
  lucroLiquidoPct: number;
  precoSugerido: number;    // preço mínimo para atingir margemAlvo
  status: 'SEM_PRECO' | 'CRITICA' | 'OK' | 'IDEAL';
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

export function calcPricing(
  input: ProcedureInput,
  config: PricingConfig
): PricingResult {
  const { productCost, duration, salePrice } = input;
  const { taxaSalaPerMin, impostosRate, cartaoRate,
          comissaoRate, repasseRate, margemAlvo } = config;

  // Cálculos base independentes do preço de venda
  const custoSala = duration * taxaSalaPerMin;

  // Preço sugerido para atingir margemAlvo
  // Fórmula: Preço = (Custos Fixos de Produto e Sala) / (1 - %Taxas Variáveis - %Margem Alvo)
  const taxasSobrePreco = impostosRate + cartaoRate + comissaoRate + repasseRate;
  const divisor = 1 - taxasSobrePreco - margemAlvo;
  
  // Evitar divisão por zero ou resultados negativos impossíveis
  const precoSugerido = divisor > 0 
    ? (productCost + custoSala) / divisor 
    : (productCost + custoSala) * 5; // Fallback caso as taxas somem > 100%

  if (salePrice <= 0) {
    return {
      custoSala: round2(custoSala),
      custoImpostos: 0,
      custoCombinado: 0,
      custoTotal: 0,
      margemClinica: 0,
      repasseMedico: 0,
      lucroLiquido: 0,
      lucroLiquidoPct: 0,
      precoSugerido: round2(precoSugerido),
      status: 'SEM_PRECO',
    };
  }

  const custoImpostos  = salePrice * impostosRate;
  const custoCartao    = salePrice * cartaoRate;
  const custoComissao  = salePrice * comissaoRate;
  const custoCombinado = custoImpostos + custoCartao + custoComissao;
  
  // Custo Total = Insumos + Uso da Sala + Taxas sobre a venda
  const custoTotal     = productCost + custoSala + custoCombinado;
  
  // Margem Clínica (antes do repasse)
  const margemClinica  = ((salePrice - custoTotal) / salePrice) * 100;
  
  const repasseMedico  = salePrice * repasseRate;
  const lucroLiquido   = salePrice - custoTotal - repasseMedico;
  const lucroLiquidoPct = (lucroLiquido / salePrice) * 100;

  const status =
    margemClinica < 20 ? 'CRITICA' :
    margemClinica < 40 ? 'OK' : 'IDEAL';

  return {
    custoSala: round2(custoSala),
    custoImpostos: round2(custoImpostos),
    custoCombinado: round2(custoCombinado),
    custoTotal: round2(custoTotal),
    margemClinica: round1(margemClinica),
    repasseMedico: round2(repasseMedico),
    lucroLiquido: round2(lucroLiquido),
    lucroLiquidoPct: round1(lucroLiquidoPct),
    precoSugerido: round2(precoSugerido),
    status,
  };
}
