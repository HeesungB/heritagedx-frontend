/**
 * 입출금표 (Settlement) DTO
 *
 * 백엔드 엔드포인트:
 *   POST /api/settlements/draft           body { consultationId } → { draft, missingFields, warnings }
 *   POST /api/settlements                 첫 persist
 *   GET  /api/settlements/:consultationId
 *   PUT  /api/settlements/:consultationId
 *   PATCH /api/settlements/:consultationId/document-generated
 *   DELETE /api/settlements/:consultationId
 *
 * 상담 1건 ↔ 입출금표 1건 (consultationId 가 PK).
 *
 * 필드는 백엔드 응답 기준 평탄 구조. 매도/매수는 `sell*` / `buy*` prefix.
 * 첫 GET/POST 응답에서 추가 필드(taxInvoice/route/profit/expense/tax 등) 가 발견되면
 * 이 인터페이스에 보강하고 `packages/store/src/mappers/settlement.mapper.ts` 한 곳에서 흡수한다.
 */
export interface Settlement {
  // 메타
  consultationId: string;
  membershipTradeId?: string | null;
  documentGeneratedAt?: string | null;
  documentGeneratedByUserId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  // 헤더
  membershipName?: string | null;
  tradeDate?: string | null;            // ISO date
  salesContractAmount?: number | null;
  remarks?: string | null;

  // 매도자
  sellName?: string | null;
  sellPhone?: string | null;
  sellDealerId?: string | null;         // 자사 담당자 UUID
  sellEntityType?: string | null;       // 개인/법인 enum 추정
  sellMembershipAmount?: number | null;
  sellCommissionDeducted?: boolean | null;

  // 매수자
  buyName?: string | null;
  buyPhone?: string | null;
  buyDealerId?: string | null;
  buyEntityType?: string | null;
  buyMembershipAmount?: number | null;
  buyStampTaxIncluded?: boolean | null;
}

/** POST /api/settlements/draft 응답 — Settlement 한 단계 더 감싸짐. */
export interface SettlementDraftResponse {
  draft: Settlement;
  /** 백엔드가 자동으로 채울 수 없었던 필드 키 목록 (UI 가 필수 표시 등에 활용). */
  missingFields: string[];
  warnings: string[];
}

/** POST /api/settlements 요청 body */
export type SettlementInput = Settlement;

/**
 * PUT /api/settlements/:consultationId 요청 body.
 * documentGenerated* 는 PATCH 전용이므로 제외.
 */
export type SettlementUpdateInput = Partial<
  Omit<
    Settlement,
    | "consultationId"
    | "createdAt"
    | "updatedAt"
    | "documentGeneratedAt"
    | "documentGeneratedByUserId"
  >
>;

/** POST /api/settlements/draft 요청 body */
export interface SettlementDraftRequest {
  consultationId: string;
}
