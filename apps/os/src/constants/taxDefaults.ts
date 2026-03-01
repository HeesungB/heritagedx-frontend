import { TaxRateSettings, TaxBracket } from "@/types/tax";

// 양도소득세 누진 구간 (2024년 기준, 만원 단위)
export const CAPITAL_GAINS_TAX_BRACKETS: TaxBracket[] = [
  { id: "cg1", max: 1400, rate: 0.06, deduction: 0 },
  { id: "cg2", max: 5000, rate: 0.15, deduction: 126 },
  { id: "cg3", max: 8800, rate: 0.24, deduction: 576 },
  { id: "cg4", max: 15000, rate: 0.35, deduction: 1544 },
  { id: "cg5", max: 30000, rate: 0.38, deduction: 1994 },
  { id: "cg6", max: 50000, rate: 0.4, deduction: 2594 },
  { id: "cg7", max: 100000, rate: 0.42, deduction: 3594 },
  { id: "cg8", max: Infinity, rate: 0.45, deduction: 6594 },
];

// 법인세 누진 구간 (2024년 기준, 만원 단위)
export const CORPORATE_TAX_BRACKETS: TaxBracket[] = [
  { id: "ct1", max: 20000, rate: 0.09, deduction: 0 }, // 2억 이하 9%
  { id: "ct2", max: 2000000, rate: 0.19, deduction: 2000 }, // 200억 이하 19%
  { id: "ct3", max: 300000000, rate: 0.21, deduction: 6000 }, // 3000억 이하 21%
  { id: "ct4", max: Infinity, rate: 0.24, deduction: 15000 }, // 3000억 초과 24%
];

// 기본 세율 설정
export const DEFAULT_TAX_SETTINGS: TaxRateSettings = {
  // 취득세 2.2%
  acquisitionTax: {
    enabled: true,
    rate: 0.022,
  },
  // 인지세 (전체 구간)
  stampDuty: {
    enabled: true,
    brackets: [
      { minAmount: 1000, maxAmount: 3000, amount: 2 },      // 1천~3천만원: 2만원
      { minAmount: 3000, maxAmount: 5000, amount: 4 },      // 3천~5천만원: 4만원
      { minAmount: 5000, maxAmount: 10000, amount: 7 },     // 5천~1억원: 7만원
      { minAmount: 10000, maxAmount: 100000, amount: 15 },  // 1억~10억원: 15만원
      { minAmount: 100000, maxAmount: Infinity, amount: 35 }, // 10억원 초과: 35만원
    ],
  },
  // 양도소득세 (디폴트: 22% 단일 세율)
  capitalGainsTax: {
    enabled: true,
    defaultRate: 0.22, // 22%
    useBrackets: true, // 구간별 누진세율 적용
    brackets: CAPITAL_GAINS_TAX_BRACKETS,
  },
  // 법인세 (디폴트: 22% 단일 세율)
  corporateTax: {
    enabled: true,
    defaultRate: 0.22, // 22%
    useBrackets: false, // 기본은 단일 세율
    brackets: CORPORATE_TAX_BRACKETS,
  },
  // 지방소득세 10%
  localIncomeTax: {
    enabled: true,
    rate: 0.1,
  },
  // 기본공제 250만원 (개인 양도소득세)
  basicDeduction: 250,
};

// 세금 항목별 설명 (딜러용)
export const TAX_DESCRIPTIONS = {
  acquisitionTax:
    "회원권 취득 시 지방세법에 따라 취득가액의 2.2%가 부과됩니다.",
  stampDuty:
    "거래금액 1억원 이상 계약 시 인지세법에 따라 인지세가 부과됩니다.",
  capitalGainsTax:
    "회원권 양도차익에 대해 소득세법에 따라 양도소득세가 부과됩니다.",
  corporateTax:
    "법인의 회원권 양도차익은 법인세법에 따라 법인세 과세대상입니다.",
  localIncomeTax: "산출세액의 10%가 지방소득세로 추가 부과됩니다.",
  brokerageFee: "회원권 거래를 위한 중개수수료입니다.",
  transferFee: "골프장에 납부하는 명의변경 수수료입니다.",
  basicDeduction: "연 1회 250만원의 기본공제가 적용됩니다.",
};

// 중개수수료 기본 비율
export const DEFAULT_BROKERAGE_FEE_RATE = 0.004; // 0.4%
