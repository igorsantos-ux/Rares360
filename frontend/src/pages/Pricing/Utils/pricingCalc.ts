/**
 * Utilitário de cálculo de precificação (Mirror do backend)
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
  productCost: number;
  duration: number;
  salePrice: number;
}

export interface PricingResult {
  custoSala: number;
  custoImpostos: number;
  custoCombinado: number;
  custoTotal: number;
  margemClinica: number;
  repasseMedico: number;
  lucroLiquido: number;
  lucroLiquidoPct: number;
  precoSugerido: number;
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

  const custoSala = duration * (taxaSalaPerMin || 0);
  const taxasSobrePreco = (impostosRate || 0) + (cartaoRate || 0) + (comissaoRate || 0) + (repasseRate || 0);
  
  const divisor = 1 - taxasSobrePreco - (margemAlvo || 0);
  const precoSugerido = divisor > 0 
    ? (productCost + custoSala) / divisor 
    : (productCost + custoSala) * 5;

  if (!salePrice || salePrice <= 0) {
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
  const custoTotal     = productCost + custoSala + custoCombinado;
  
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
