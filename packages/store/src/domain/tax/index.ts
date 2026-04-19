export { calculateTax, getScenarioLabel, getResultLabel } from "./calculator";
export {
  DEFAULT_TAX_SETTINGS,
  DEFAULT_BROKERAGE_FEE_RATE,
  TAX_DESCRIPTIONS,
  CAPITAL_GAINS_TAX_BRACKETS,
  CORPORATE_TAX_BRACKETS,
} from "./defaults";
export type {
  EntityType,
  TransactionType,
  TaxScenario,
  TaxBracket,
  TaxTypeSettings,
  StampDutyBracket,
  TaxRateSettings,
  CalculatorInput,
  TaxCalculationItem,
  CalculationResult,
} from "./types";
