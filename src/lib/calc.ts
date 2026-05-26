export interface CalcInput {
  quantity: number;
  unitPrice?: number;
  totalPayment?: number;
  shippingFee?: number;
  discount?: number;
  marginRate?: number;
  channelFeeRate?: number;
}

export interface CalcResult {
  totalPayment: number;
  costPerUnit: number;
  recommendedPrice: number;
}

export function calcPurchase(input: CalcInput): CalcResult {
  const {
    quantity,
    unitPrice,
    shippingFee = 0,
    discount = 0,
    marginRate = 0.3,
    channelFeeRate = 0.0585,
  } = input;

  const totalPayment =
    input.totalPayment ?? (unitPrice! * quantity + shippingFee - discount);

  const costPerUnit = quantity > 0 ? totalPayment / quantity : 0;
  const deductionRate = marginRate + channelFeeRate;
  const recommendedPrice =
    deductionRate < 1 ? costPerUnit / (1 - deductionRate) : 0;

  return {
    totalPayment: Math.round(totalPayment),
    costPerUnit: Math.round(costPerUnit),
    recommendedPrice: Math.round(recommendedPrice),
  };
}

export interface SaleCalcInput {
  salePrice: number;
  feeRate?: number;
  fee?: number;
  costPerUnit: number;
  quantity: number;
}

export interface SaleCalcResult {
  fee: number;
  netProfit: number;
}

export function calcSale(input: SaleCalcInput): SaleCalcResult {
  const { salePrice, costPerUnit, quantity, feeRate = 0.0585 } = input;
  const fee =
    input.fee != null ? input.fee : Math.round(salePrice * feeRate);
  const netProfit = Math.round(
    salePrice - fee - costPerUnit * quantity,
  );

  return { fee, netProfit };
}

export function calcCurrentStock(
  purchaseQty: number,
  saleQty: number,
  adjustmentQty: number,
) {
  return purchaseQty - saleQty + adjustmentQty;
}

/** 권장 판매가가 개당 원가 대비 몇 %인지 (원가 대비 마크업율) */
export function calcMarkupPercentFromCost(
  costPerUnit: number,
  recommendedPrice: number,
): number | null {
  if (costPerUnit <= 0 || recommendedPrice <= 0) return null;
  return Math.round((recommendedPrice / costPerUnit - 1) * 100);
}
