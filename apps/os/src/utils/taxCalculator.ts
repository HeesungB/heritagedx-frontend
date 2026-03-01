import {
  EntityType,
  TransactionType,
  TaxScenario,
  TaxRateSettings,
  TaxBracket,
  CalculatorInput,
  CalculationResult,
  TaxCalculationItem,
} from "@/types/tax";
import {
  DEFAULT_BROKERAGE_FEE_RATE,
  TAX_DESCRIPTIONS,
} from "@/constants/taxDefaults";

// 구간별 세액 계산
function calculateBracketTax(
  taxableAmount: number,
  brackets: TaxBracket[],
): { tax: number; rate: number; bracket: TaxBracket | null } {
  if (taxableAmount <= 0) {
    return { tax: 0, rate: 0, bracket: null };
  }

  const bracket =
    brackets.find((b) => taxableAmount <= b.max) ||
    brackets[brackets.length - 1];

  const tax = Math.max(
    0,
    Math.round(taxableAmount * bracket.rate - bracket.deduction),
  );

  return { tax, rate: bracket.rate, bracket };
}

// 인지세 계산
function calculateStampDuty(amount: number, settings: TaxRateSettings): number {
  if (!settings.stampDuty.enabled) return 0;

  for (const bracket of settings.stampDuty.brackets) {
    if (amount >= bracket.minAmount && amount < bracket.maxAmount) {
      return bracket.amount;
    }
  }

  return 0;
}

// 개인 + 매수 계산
function calculatePersonalBuy(
  input: CalculatorInput,
  settings: TaxRateSettings,
): CalculationResult {
  const { transactionPrice, transferFee = 99 } = input;
  const brokerageRate = input.brokerageFeeRate ?? DEFAULT_BROKERAGE_FEE_RATE;

  const items: TaxCalculationItem[] = [];

  // 중개수수료
  const brokerageFee = Math.round(transactionPrice * brokerageRate);
  items.push({
    key: "brokerageFee",
    label: "거래 서비스 비용",
    amount: brokerageFee,
    rate: brokerageRate,
    description: TAX_DESCRIPTIONS.brokerageFee,
    isAddition: true,
  });

  // 명의개서료
  items.push({
    key: "transferFee",
    label: "명의개서료",
    amount: transferFee,
    description: TAX_DESCRIPTIONS.transferFee,
    isAddition: true,
  });

  // 인지세
  if (settings.stampDuty.enabled) {
    const stampDuty = calculateStampDuty(transactionPrice, settings);
    if (stampDuty > 0) {
      items.push({
        key: "stampDuty",
        label: "인지세",
        amount: stampDuty,
        description: TAX_DESCRIPTIONS.stampDuty,
        isAddition: true,
      });
    }
  }

  // 취득세
  if (settings.acquisitionTax.enabled) {
    const acquisitionTax = Math.round(
      transactionPrice * settings.acquisitionTax.rate,
    );
    items.push({
      key: "acquisitionTax",
      label: `취득세 (${(settings.acquisitionTax.rate * 100).toFixed(1)}%)`,
      amount: acquisitionTax,
      rate: settings.acquisitionTax.rate,
      description: TAX_DESCRIPTIONS.acquisitionTax,
      isAddition: true,
    });
  }

  // 총 추가 비용 계산
  const totalAdditions = items.reduce((sum, item) => sum + item.amount, 0);
  const netResult = transactionPrice + totalAdditions;

  // 세금만 계산 (취득세)
  const taxOnly = items
    .filter((item) => item.key === "acquisitionTax")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    scenario: "personal_buy",
    basePrice: transactionPrice,
    items,
    totalCost: totalAdditions,
    netResult,
    summary: {
      costRatio:
        transactionPrice > 0 ? (totalAdditions / transactionPrice) * 100 : 0,
      taxRatio: transactionPrice > 0 ? (taxOnly / transactionPrice) * 100 : 0,
    },
  };
}

// 개인 + 매도 계산
function calculatePersonalSell(
  input: CalculatorInput,
  settings: TaxRateSettings,
): CalculationResult {
  const { transactionPrice, acquisitionPrice = 0, transferFee = 99 } = input;
  const brokerageRate = input.brokerageFeeRate ?? DEFAULT_BROKERAGE_FEE_RATE;

  const items: TaxCalculationItem[] = [];

  // 판매 시 중개수수료
  const sellBrokerageFee = Math.round(transactionPrice * brokerageRate);
  items.push({
    key: "brokerageFee",
    label: "거래 서비스 비용",
    amount: sellBrokerageFee,
    rate: brokerageRate,
    description: TAX_DESCRIPTIONS.brokerageFee,
    isAddition: false,
  });

  // 필요경비: 사용자 직접 입력값이 있으면 사용, 없으면 자동 계산
  const necessaryExpenses =
    input.necessaryExpenses != null
      ? input.necessaryExpenses
      : (() => {
          const buyBrokerageFee = Math.round(acquisitionPrice * brokerageRate);
          return buyBrokerageFee + transferFee + sellBrokerageFee;
        })();

  // 양도차익 = 판매가 - 구매가 - 필요경비
  const capitalGain = transactionPrice - acquisitionPrice - necessaryExpenses;

  // 기본공제 적용 여부 (기본값: true)
  const useBasicDeduction = input.useBasicDeduction !== false;
  const basicDeduction = useBasicDeduction ? settings.basicDeduction : 0;

  // 과세표준 = 양도차익 - 기본공제
  const taxableAmount = Math.max(0, capitalGain - basicDeduction);

  let capitalGainsTax = 0;
  let taxRate = 0;

  if (settings.capitalGainsTax.enabled && taxableAmount > 0) {
    if (settings.capitalGainsTax.useBrackets) {
      // 구간별 세율 적용
      const result = calculateBracketTax(
        taxableAmount,
        settings.capitalGainsTax.brackets,
      );
      capitalGainsTax = result.tax;
      taxRate = result.rate;
    } else {
      // 단일 세율 적용
      capitalGainsTax = Math.round(
        taxableAmount * settings.capitalGainsTax.defaultRate,
      );
      taxRate = settings.capitalGainsTax.defaultRate;
    }

    items.push({
      key: "capitalGainsTax",
      label: `양도소득세 (${(taxRate * 100).toFixed(0)}%)`,
      amount: capitalGainsTax,
      rate: taxRate,
      description: TAX_DESCRIPTIONS.capitalGainsTax,
      isAddition: false,
    });
  }

  // 지방소득세
  let localIncomeTax = 0;
  if (settings.localIncomeTax.enabled && capitalGainsTax > 0) {
    localIncomeTax = Math.round(capitalGainsTax * settings.localIncomeTax.rate);
    items.push({
      key: "localIncomeTax",
      label: `지방소득세 (${(settings.localIncomeTax.rate * 100).toFixed(0)}%)`,
      amount: localIncomeTax,
      rate: settings.localIncomeTax.rate,
      description: TAX_DESCRIPTIONS.localIncomeTax,
      isAddition: false,
    });
  }

  // 총 차감액
  const totalDeductions = items.reduce((sum, item) => sum + item.amount, 0);

  // 실수령액
  const netResult = transactionPrice - totalDeductions;

  // 손익 (실수령액 - 구매가)
  const profitOrLoss = netResult - acquisitionPrice;

  // 세금만 계산 (양도세 + 지방소득세)
  const taxOnly = capitalGainsTax + localIncomeTax;

  return {
    scenario: "personal_sell",
    basePrice: transactionPrice,
    items,
    totalCost: totalDeductions,
    netResult,
    summary: {
      costRatio:
        transactionPrice > 0 ? (totalDeductions / transactionPrice) * 100 : 0,
      taxRatio: transactionPrice > 0 ? (taxOnly / transactionPrice) * 100 : 0,
      profitOrLoss,
    },
  };
}

// 법인 + 매수 계산
function calculateCorporateBuy(
  input: CalculatorInput,
  settings: TaxRateSettings,
): CalculationResult {
  const { transactionPrice, transferFee = 99 } = input;
  const brokerageRate = input.brokerageFeeRate ?? DEFAULT_BROKERAGE_FEE_RATE;

  const items: TaxCalculationItem[] = [];

  // 중개수수료
  const brokerageFee = Math.round(transactionPrice * brokerageRate);
  items.push({
    key: "brokerageFee",
    label: "거래 서비스 비용",
    amount: brokerageFee,
    rate: brokerageRate,
    description: TAX_DESCRIPTIONS.brokerageFee,
    isAddition: true,
  });

  // 명의개서료
  items.push({
    key: "transferFee",
    label: "명의개서료",
    amount: transferFee,
    description: TAX_DESCRIPTIONS.transferFee,
    isAddition: true,
  });

  // 인지세
  if (settings.stampDuty.enabled) {
    const stampDuty = calculateStampDuty(transactionPrice, settings);
    if (stampDuty > 0) {
      items.push({
        key: "stampDuty",
        label: "인지세",
        amount: stampDuty,
        description: TAX_DESCRIPTIONS.stampDuty,
        isAddition: true,
      });
    }
  }

  // 법인 취득세 과세표준 = (거래금액 + 중개수수료 + 명의개서료)의 공급가액 (부가세 제외)
  // 인지세는 제외
  const taxBase = transactionPrice + brokerageFee + transferFee;
  const supplyPrice = Math.round(taxBase / 1.1); // 공급가액 (부가세 10% 제외)

  // 취득세
  if (settings.acquisitionTax.enabled) {
    const acquisitionTax = Math.round(
      supplyPrice * settings.acquisitionTax.rate,
    );
    items.push({
      key: "acquisitionTax",
      label: `취득세 (${(settings.acquisitionTax.rate * 100).toFixed(1)}%)`,
      amount: acquisitionTax,
      rate: settings.acquisitionTax.rate,
      description:
        "법인의 경우 공급가액(부가세 제외) 기준으로 취득세가 부과됩니다. 인지세는 제외됩니다.",
      isAddition: true,
    });
  }

  // 총 추가 비용
  const totalAdditions = items.reduce((sum, item) => sum + item.amount, 0);
  const netResult = transactionPrice + totalAdditions;

  // 세금만 계산 (취득세)
  const taxOnly = items
    .filter((item) => item.key === "acquisitionTax")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    scenario: "corporate_buy",
    basePrice: transactionPrice,
    items,
    totalCost: totalAdditions,
    netResult,
    summary: {
      costRatio:
        transactionPrice > 0 ? (totalAdditions / transactionPrice) * 100 : 0,
      taxRatio: transactionPrice > 0 ? (taxOnly / transactionPrice) * 100 : 0,
    },
  };
}

// 법인 + 매도 계산
function calculateCorporateSell(
  input: CalculatorInput,
  settings: TaxRateSettings,
): CalculationResult {
  const { transactionPrice, bookValue = 0 } = input;
  const brokerageRate = input.brokerageFeeRate ?? DEFAULT_BROKERAGE_FEE_RATE;

  const items: TaxCalculationItem[] = [];

  // 중개수수료
  const brokerageFee = Math.round(transactionPrice * brokerageRate);
  items.push({
    key: "brokerageFee",
    label: "거래 서비스 비용",
    amount: brokerageFee,
    rate: brokerageRate,
    description: TAX_DESCRIPTIONS.brokerageFee,
    isAddition: false,
  });

  // 양도차익 = 매도가 - 장부가
  const capitalGain = transactionPrice - bookValue;

  let corporateTax = 0;
  let taxRate = 0;

  if (settings.corporateTax.enabled && capitalGain > 0) {
    if (settings.corporateTax.useBrackets) {
      // 구간별 세율 적용
      const result = calculateBracketTax(
        capitalGain,
        settings.corporateTax.brackets,
      );
      corporateTax = result.tax;
      taxRate = result.rate;
    } else {
      // 단일 세율 적용
      corporateTax = Math.round(
        capitalGain * settings.corporateTax.defaultRate,
      );
      taxRate = settings.corporateTax.defaultRate;
    }

    items.push({
      key: "corporateTax",
      label: `법인세 (${(taxRate * 100).toFixed(0)}%)`,
      amount: corporateTax,
      rate: taxRate,
      description: TAX_DESCRIPTIONS.corporateTax,
      isAddition: false,
    });
  }

  // 지방소득세
  let localIncomeTax = 0;
  if (settings.localIncomeTax.enabled && corporateTax > 0) {
    localIncomeTax = Math.round(corporateTax * settings.localIncomeTax.rate);
    items.push({
      key: "localIncomeTax",
      label: `지방소득세 (${(settings.localIncomeTax.rate * 100).toFixed(0)}%)`,
      amount: localIncomeTax,
      rate: settings.localIncomeTax.rate,
      description: TAX_DESCRIPTIONS.localIncomeTax,
      isAddition: false,
    });
  }

  // 총 차감액
  const totalDeductions = items.reduce((sum, item) => sum + item.amount, 0);

  // 실수령액
  const netResult = transactionPrice - totalDeductions;

  // 손익 (실수령액 - 장부가)
  const profitOrLoss = netResult - bookValue;

  // 세금만 계산 (법인세 + 지방소득세)
  const taxOnly = corporateTax + localIncomeTax;

  return {
    scenario: "corporate_sell",
    basePrice: transactionPrice,
    items,
    totalCost: totalDeductions,
    netResult,
    summary: {
      costRatio:
        transactionPrice > 0 ? (totalDeductions / transactionPrice) * 100 : 0,
      taxRatio: transactionPrice > 0 ? (taxOnly / transactionPrice) * 100 : 0,
      profitOrLoss,
    },
  };
}

// 통합 계산 함수
export function calculateTax(
  input: CalculatorInput,
  settings: TaxRateSettings,
): CalculationResult {
  const scenario: TaxScenario = `${input.entityType}_${input.transactionType}`;

  switch (scenario) {
    case "personal_buy":
      return calculatePersonalBuy(input, settings);
    case "personal_sell":
      return calculatePersonalSell(input, settings);
    case "corporate_buy":
      return calculateCorporateBuy(input, settings);
    case "corporate_sell":
      return calculateCorporateSell(input, settings);
    default:
      throw new Error(`Unknown scenario: ${scenario}`);
  }
}

// 시나리오 라벨 가져오기
export function getScenarioLabel(
  entityType: EntityType,
  transactionType: TransactionType,
): string {
  const entityLabel = entityType === "personal" ? "개인" : "법인";
  const transactionLabel = transactionType === "buy" ? "매수" : "매도";
  return `${entityLabel} ${transactionLabel}`;
}

// 결과 라벨 가져오기
export function getResultLabel(transactionType: TransactionType): string {
  return transactionType === "buy" ? "예상 총 비용" : "예상 실수령액";
}
