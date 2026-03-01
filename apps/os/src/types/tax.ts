// 거래 주체 타입
export type EntityType = "personal" | "corporate";

// 거래 유형 타입
export type TransactionType = "buy" | "sell";

// 시나리오 조합 타입
export type TaxScenario = `${EntityType}_${TransactionType}`;

// 세금 구간 타입
export interface TaxBracket {
  id: string;
  max: number; // 구간 상한 (Infinity 가능)
  rate: number; // 세율 (0.06 = 6%)
  deduction: number; // 누진공제액 (만원)
}

// 세금 종류별 설정
export interface TaxTypeSettings {
  enabled: boolean; // 적용 여부
  defaultRate: number; // 단일 세율 (구간별 미사용 시)
  useBrackets: boolean; // 구간별 세율 사용 여부
  brackets: TaxBracket[]; // 세율 구간
}

// 인지세 구간
export interface StampDutyBracket {
  minAmount: number; // 최소 금액 (만원)
  maxAmount: number; // 최대 금액 (만원, Infinity 가능)
  amount: number; // 인지세액 (만원)
}

// 전체 세율 설정
export interface TaxRateSettings {
  // 취득세 (매수 시)
  acquisitionTax: {
    enabled: boolean;
    rate: number; // 기본 2.2%
  };
  // 인지세 (매수 시)
  stampDuty: {
    enabled: boolean;
    brackets: StampDutyBracket[];
  };
  // 양도소득세 (개인 매도 시)
  capitalGainsTax: TaxTypeSettings;
  // 법인세 (법인 매도 시)
  corporateTax: TaxTypeSettings;
  // 지방소득세
  localIncomeTax: {
    enabled: boolean;
    rate: number; // 기본 10%
  };
  // 기본공제 (개인 양도소득세)
  basicDeduction: number; // 만원 단위
}

// 계산 입력값
export interface CalculatorInput {
  entityType: EntityType;
  transactionType: TransactionType;
  transactionPrice: number; // 거래금액 (만원)
  acquisitionPrice?: number; // 취득가액 (개인 매도 시, 만원)
  bookValue?: number; // 장부가 (법인 매도 시, 만원)
  brokerageFeeRate?: number; // 중개수수료율 (기본 0.4%)
  transferFee?: number; // 명의개서료 (만원)
  necessaryExpenses?: number; // 필요경비 (만원, 사용자 직접 입력)
  useBasicDeduction?: boolean; // 기본공제 적용 여부 (기본 true)
}

// 계산 결과 항목
export interface TaxCalculationItem {
  key: string; // 고유 키
  label: string; // 표시명
  amount: number; // 금액 (만원)
  rate?: number; // 적용 세율
  description: string; // 적용 사유 설명
  isAddition: boolean; // 더하기 항목 여부 (false면 차감)
}

// 계산 결과
export interface CalculationResult {
  scenario: TaxScenario;
  basePrice: number; // 기준 금액 (매수가 또는 매도가)
  items: TaxCalculationItem[];
  totalCost: number; // 총 취득비용 (매수) 또는 총 차감액 (매도)
  netResult: number; // 총 비용 (매수) 또는 실수령액 (매도)
  summary: {
    costRatio: number; // 비용 부담률 (%)
    taxRatio: number; // 세금 비중 (%)
    profitOrLoss?: number; // 손익 (매도 시)
  };
}
