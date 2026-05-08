import type { SettlementEntity } from "@heritage-dx/store";

/** ApprovalRequestSheet 가 다루는 셀 값 컬렉션. 키는 양식 셀의 keyName/groupKey. */
export type SheetOverrides = Record<string, string>;

interface CellMapping {
  /** SettlementEntity 의 어느 필드와 연결되는지. */
  field: keyof SettlementEntity;
  /** entity 값 → 양식 셀 string. null/undefined 는 빈 문자열로. */
  toCell: (v: unknown) => string;
  /** 양식 셀 string → entity 값(string|number|boolean|null). */
  fromCell: (raw: string) => unknown;
}

const stringToCell = (v: unknown): string =>
  typeof v === "string" ? v : "";

const stringFromCell = (raw: string): string | null =>
  raw.trim().length > 0 ? raw : null;

const amountToCell = (v: unknown): string =>
  typeof v === "number" && Number.isFinite(v) ? String(v) : "";

const amountFromCell = (raw: string): number | null => {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
};

const boolToCell =
  (truthy: string, falsy: string) =>
  (v: unknown): string =>
    v === true ? truthy : v === false ? falsy : "";

const boolFromCell =
  (truthy: string, falsy: string) =>
  (raw: string): boolean | null =>
    raw === truthy ? true : raw === falsy ? false : null;

/** ISO("2025-12-12") → 한국식("2025. 12. 12.") 표시 변환. */
const dateToCell = (v: unknown): string => {
  if (typeof v !== "string" || !v) return "";
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return v;
  return `${m[1]}. ${parseInt(m[2], 10)}. ${parseInt(m[3], 10)}.`;
};

/**
 * 매도/매수 법인 구분 enum (백엔드 검증 2026-05-08).
 * 양식의 outClassification / inClassification 토글 라벨과 양방향 변환.
 */
const ENTITY_TYPE_LABEL = {
  INDIVIDUAL: "개인",
  TAXABLE_CORP: "과세법인",
  NON_TAXABLE_CORP: "비과세법인",
} as const;

const ENTITY_TYPE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(ENTITY_TYPE_LABEL).map(([enumKey, label]) => [label, enumKey]),
);

const entityTypeToCell = (v: unknown): string => {
  if (typeof v !== "string") return "";
  return (ENTITY_TYPE_LABEL as Record<string, string>)[v] ?? "";
};

const entityTypeFromCell = (raw: string): string | null => {
  if (!raw) return null;
  return ENTITY_TYPE_REVERSE[raw] ?? null;
};

/**
 * 한국식("2025. 12. 12." / "2025.12.12") · 슬래시("2025/12/12") · ISO("2025-12-12") 모두
 * "YYYY-MM-DD" 로 정규화. 파싱 실패 시 raw 반환 — 백엔드 메시지가 사용자에게 안내.
 */
const dateFromCell = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^(\d{4})[.\-/\s]+(\d{1,2})[.\-/\s]+(\d{1,2})/);
  if (m) {
    const y = m[1];
    const mo = m[2].padStart(2, "0");
    const d = m[3].padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return trimmed;
};

/**
 * 양식 셀 키 → SettlementEntity 필드 매핑 테이블.
 * 매핑되지 않은 양식 셀(outDeposit, inBank, taxIssue 그룹, transferReport, sellerRoute 그룹, expense 등)은
 * 백엔드 필드 미확정으로 보류 — 양식에 빈 셀로 노출되며 입력해도 PUT 페이로드에 안 실린다.
 *
 * sellManager / buyManager 셀은 자사 담당자 이름 의도지만 백엔드는 dealerId(UUID).
 * 이름 lookup 은 후속 — 일단 ID 그대로 표시한다.
 */
export const SHEET_TO_ENTITY: Record<string, CellMapping> = {
  membershipName: { field: "membershipName", toCell: stringToCell, fromCell: stringFromCell },
  date: { field: "tradeDate", toCell: dateToCell, fromCell: dateFromCell },
  contractAmount: { field: "salesContractAmount", toCell: amountToCell, fromCell: amountFromCell },
  remarks: { field: "remarks", toCell: stringToCell, fromCell: stringFromCell },

  sellCompany: { field: "sellName", toCell: stringToCell, fromCell: stringFromCell },
  sellContact: { field: "sellPhone", toCell: stringToCell, fromCell: stringFromCell },
  // sellManager / buyManager 셀은 양식상 자사 담당자 "이름" 의도지만
  // 백엔드 sellDealerId / buyDealerId 는 user UUID. 매핑하면 사용자 입력 이름이
  // UUID 자리로 들어가 "must be a UUID" 거부 발생 → 매핑 끊고 백엔드 자동 산정값을 보존.
  // 담당자 이름 표시는 후속(useUsers lookup) PR 에서 처리.
  outClassification: {
    field: "sellEntityType",
    toCell: entityTypeToCell,
    fromCell: entityTypeFromCell,
  },
  outAmount: { field: "sellMembershipAmount", toCell: amountToCell, fromCell: amountFromCell },
  outFeeIncluded: {
    field: "sellCommissionDeducted",
    toCell: boolToCell("공제", "비공제"),
    fromCell: boolFromCell("공제", "비공제"),
  },

  buyCompany: { field: "buyName", toCell: stringToCell, fromCell: stringFromCell },
  buyContact: { field: "buyPhone", toCell: stringToCell, fromCell: stringFromCell },
  inClassification: {
    field: "buyEntityType",
    toCell: entityTypeToCell,
    fromCell: entityTypeFromCell,
  },
  inAmount: { field: "buyMembershipAmount", toCell: amountToCell, fromCell: amountFromCell },
  inFeePaper: {
    field: "buyStampTaxIncluded",
    toCell: boolToCell("포함", "미포함"),
    fromCell: boolFromCell("포함", "미포함"),
  },
};

/**
 * SHEET_TO_ENTITY 의 inverse — entity 필드명으로 양식 셀 키를 lookup.
 * 검증 에러 메시지를 양식 셀에 매핑할 때 사용.
 */
export const ENTITY_TO_SHEET: Partial<Record<keyof SettlementEntity, string>> =
  Object.fromEntries(
    Object.entries(SHEET_TO_ENTITY).map(([sheetKey, mapping]) => [
      mapping.field as string,
      sheetKey,
    ]),
  );

/**
 * NestJS class-validator 표준 메시지에서 entity 필드명을 추출한다.
 *   "property X should not exist"           → X
 *   "X must be a UUID"                      → X
 *   "X should not be empty"                 → X
 *   "X is invalid"                          → X
 * 매칭 실패 시 null.
 */
export function parseValidationField(message: string): string | null {
  const trimmed = message.trim();
  const m1 = trimmed.match(/^property\s+([A-Za-z_][A-Za-z0-9_]*)\s+should not exist/);
  if (m1) return m1[1];
  const m2 = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+(must|should|cannot|is|has|does)/);
  if (m2) return m2[1];
  return null;
}

/** entity 필드명 → 사용자 노출 한국어 라벨. 매핑 없으면 raw 필드명 노출. */
export const ENTITY_FIELD_LABEL: Record<string, string> = {
  consultationId: "상담 ID",
  membershipTradeId: "거래 ID",
  documentGeneratedAt: "문서 생성일",
  documentGeneratedByUserId: "문서 생성자",
  membershipName: "회원권명",
  tradeDate: "거래 일자",
  salesContractAmount: "매매 계약 금액",
  remarks: "특이사항",
  sellName: "매도 성명",
  sellPhone: "매도 연락처",
  sellDealerId: "매도 담당",
  sellEntityType: "매도 구분",
  sellMembershipAmount: "매도 회원권 금액",
  sellCommissionDeducted: "매도 수수료 공제 여부",
  buyName: "매수 성명",
  buyPhone: "매수 연락처",
  buyDealerId: "매수 담당",
  buyEntityType: "매수 구분",
  buyMembershipAmount: "매수 회원권 금액",
  buyStampTaxIncluded: "매수 인지 포함 여부",
};

/** class-validator 검증 표현 → 한국어. 패턴 우선순위 위에서 아래로. */
const VALIDATION_PHRASES: ReadonlyArray<{ pattern: RegExp; korean: string }> = [
  { pattern: /^should not exist$/i, korean: "보낼 수 없는 항목입니다" },
  { pattern: /^must be a uuid/i, korean: "올바른 식별자(UUID) 형식이 아닙니다" },
  { pattern: /^must be a (?:valid )?(?:iso )?date(?: string)?/i, korean: "올바른 날짜 형식이 아닙니다" },
  { pattern: /^must be a (?:valid )?e-?mail/i, korean: "올바른 이메일 형식이 아닙니다" },
  { pattern: /^must be a (?:positive )?number/i, korean: "숫자여야 합니다" },
  { pattern: /^must be a string/i, korean: "문자열이어야 합니다" },
  { pattern: /^must be a boolean/i, korean: "참/거짓 값이어야 합니다" },
  { pattern: /^must be an? array/i, korean: "목록 형식이어야 합니다" },
  { pattern: /^must not be empty/i, korean: "필수 입력입니다" },
  { pattern: /^should not be empty/i, korean: "필수 입력입니다" },
  { pattern: /^must be longer than/i, korean: "입력이 너무 짧습니다" },
  { pattern: /^must be shorter than/i, korean: "입력이 너무 깁니다" },
  { pattern: /^must be one of the following values/i, korean: "허용되지 않는 값입니다" },
  { pattern: /^must be in the following format/i, korean: "형식이 올바르지 않습니다" },
  { pattern: /^is invalid/i, korean: "유효하지 않습니다" },
  { pattern: /^must match/i, korean: "형식이 올바르지 않습니다" },
];

/**
 * NestJS class-validator 영어 메시지를 한국어로 번역.
 *   "property X should not exist" → "<X label> 보낼 수 없는 항목입니다"
 *   "X must be a UUID"            → "<X label> 올바른 식별자(UUID) 형식이 아닙니다"
 * 매칭 실패 시 원문 그대로 반환.
 */
export function translateValidationMessage(raw: string): string {
  const trimmed = raw.trim();

  // pattern A: "property X should not exist"
  const noExistMatch = trimmed.match(
    /^property\s+([A-Za-z_][A-Za-z0-9_]*)\s+should not exist/i,
  );
  if (noExistMatch) {
    const field = noExistMatch[1];
    const label = ENTITY_FIELD_LABEL[field] ?? field;
    return `${label}: 보낼 수 없는 항목입니다`;
  }

  // pattern B: "<field> <rest>"
  const fieldMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/);
  if (fieldMatch) {
    const field = fieldMatch[1];
    const rest = fieldMatch[2];
    const label = ENTITY_FIELD_LABEL[field] ?? field;
    for (const { pattern, korean } of VALIDATION_PHRASES) {
      if (pattern.test(rest)) {
        return `${label}: ${korean}`;
      }
    }
    // 알려지지 않은 표현 — 라벨만 한국어 + 나머지는 원문
    return `${label}: ${rest}`;
  }

  return trimmed;
}

/**
 * Entity → 양식 overrides.
 * 매핑된 셀만 채움 — 빈 문자열은 누락(undefined)되어 placeholder 가 노출된다.
 */
export function entityToOverrides(entity: SettlementEntity): SheetOverrides {
  const out: SheetOverrides = {};
  const record = entity as unknown as Record<string, unknown>;
  for (const [sheetKey, mapping] of Object.entries(SHEET_TO_ENTITY)) {
    const cell = mapping.toCell(record[mapping.field]);
    if (cell.length > 0) out[sheetKey] = cell;
  }
  return out;
}

