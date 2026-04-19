import type { DocumentEntity } from "./document";

export type ScenarioSide = "Seller" | "Buyer";
export type ScenarioOwnerType =
  | "Personal"
  | "Corporate"
  | "Family"
  | "Special"
  | "All";

export interface ScenarioEntity {
  id?: string;
  scenarioCode?: string;
  code?: string;
  name: string;
  description?: string;
  side: ScenarioSide;
  ownerType: ScenarioOwnerType;
  hasProxy: boolean;
  isCertificateLost: boolean;
  isFamily?: boolean;
  requiresTaxInvoice?: boolean;
  transferStructure?: string | null;
  requiredDocumentsCount?: number | null;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentsSummaryEntity {
  totalDocuments: number;
  mandatoryDocuments: number;
  optionalDocuments: number;
}

export interface ScenarioWithDocsEntity {
  scenario: {
    scenarioCode: string;
    name: string;
    description: string | null;
  };
  documentsLocal: DocumentEntity[];
  summary: DocumentsSummaryEntity;
}

// ─── 시나리오 매칭 서술자 ───────────────────────────────────────────────────

export interface ScenarioMatchFilters {
  side: ScenarioSide | "";
  ownerType: ScenarioOwnerType | "";
  hasProxy: boolean | null;
  isCertificateLost: boolean | null;
}

/**
 * 사용자 입력 필터에 시나리오가 부합하는지 판정.
 * - side / ownerType / hasProxy: 완전 일치
 * - isCertificateLost: null 이면 조건 무시 (TransactionTypeForm UX 규칙)
 */
export function scenarioMatchesFilters(
  scenario: ScenarioEntity,
  filters: ScenarioMatchFilters,
): boolean {
  if (!filters.side || !filters.ownerType || filters.hasProxy === null) return false;
  if (scenario.side !== filters.side) return false;
  if (scenario.ownerType !== filters.ownerType) return false;
  if (scenario.hasProxy !== filters.hasProxy) return false;
  if (
    filters.isCertificateLost !== null &&
    scenario.isCertificateLost !== filters.isCertificateLost
  )
    return false;
  return true;
}

export function findMatchingScenario(
  scenarios: ScenarioEntity[],
  filters: ScenarioMatchFilters,
): ScenarioEntity | null {
  if (!filters.side || !filters.ownerType || filters.hasProxy === null) return null;
  return scenarios.find((s) => scenarioMatchesFilters(s, filters)) ?? null;
}

// ─── 시나리오 코드 라벨·색 토큰 ───────────────────────────────────────────

export type ScenarioBasicCode = "PS_BASIC" | "PB_BASIC" | "CS_BASIC" | "CB_BASIC";

export const SCENARIO_BASIC_LABEL: Record<ScenarioBasicCode, string> = {
  PS_BASIC: "개인 양도",
  PB_BASIC: "개인 양수",
  CS_BASIC: "법인 양도",
  CB_BASIC: "법인 양수",
};

export interface ScenarioAccentTokens {
  border: string;
  bg: string;
  hoverBg: string;
  selected: string;
  text: string;
  selectedText: string;
  borderTop: string;
}

export const SCENARIO_BASIC_ACCENT: Record<ScenarioBasicCode, ScenarioAccentTokens> = {
  PS_BASIC: {
    border: "border-orange-300",
    bg: "bg-orange-50",
    hoverBg: "hover:bg-orange-100",
    selected: "bg-orange-500 border-orange-500",
    text: "text-orange-700",
    selectedText: "text-white",
    borderTop: "border-t-orange-500",
  },
  PB_BASIC: {
    border: "border-blue-300",
    bg: "bg-blue-50",
    hoverBg: "hover:bg-blue-100",
    selected: "bg-blue-500 border-blue-500",
    text: "text-blue-700",
    selectedText: "text-white",
    borderTop: "border-t-blue-500",
  },
  CS_BASIC: {
    border: "border-green-300",
    bg: "bg-green-50",
    hoverBg: "hover:bg-green-100",
    selected: "bg-green-500 border-green-500",
    text: "text-green-700",
    selectedText: "text-white",
    borderTop: "border-t-green-500",
  },
  CB_BASIC: {
    border: "border-purple-300",
    bg: "bg-purple-50",
    hoverBg: "hover:bg-purple-100",
    selected: "bg-purple-500 border-purple-500",
    text: "text-purple-700",
    selectedText: "text-white",
    borderTop: "border-t-purple-500",
  },
};

export function getScenarioBasicLabel(code: string | null | undefined): string {
  if (!code) return "";
  return SCENARIO_BASIC_LABEL[code as ScenarioBasicCode] ?? code;
}

export function getScenarioBasicAccent(
  code: string | null | undefined,
): ScenarioAccentTokens | null {
  if (!code) return null;
  return SCENARIO_BASIC_ACCENT[code as ScenarioBasicCode] ?? null;
}
