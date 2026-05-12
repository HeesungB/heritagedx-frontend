import type { Pagination } from "./api";

/**
 * 입출금표 (Settlement)
 *
 * 백엔드 엔드포인트 (general - consultationId 기준):
 *   POST  /api/settlements/draft           body { consultationId } → { draft, missingFields, warnings }
 *   POST  /api/settlements                 첫 persist
 *   GET   /api/settlements/:consultationId
 *   PUT   /api/settlements/:consultationId
 *   PATCH /api/settlements/:consultationId/document-generated
 *   DELETE /api/settlements/:consultationId
 *
 * 백엔드 엔드포인트 (admin - settlement.id 기준):
 *   GET  /api/admin/settlements          (필터: organizationId/consultationId/membershipTradeId/documentGenerated)
 *   GET  /api/admin/settlements/:id
 *   PUT  /api/admin/settlements/:id
 *
 * 상담 1건 ↔ 입출금표 1건 (consultationId 가 비즈니스 unique key, id 는 row PK).
 * 필드는 백엔드 SettlementResponseDto (스웨거 v1.0.0+57563d32) 평탄 구조 그대로.
 */
export type SettlementEntityType =
  | "INDIVIDUAL"
  | "TAXABLE_CORP"
  | "NON_TAXABLE_CORP";

export type SettlementRoute =
  | "EXISTING"
  | "REFERRAL"
  | "NEW_TM"
  | "INQUIRY"
  | "OTHER";

export interface Settlement {
  // 메타
  id?: string;                                     // settlement row PK (admin 응답에서 항상 포함)
  organizationId?: string;
  createdByUserId?: string;
  consultationId: string | null;
  membershipTradeId?: string | null;
  documentGenerated?: boolean;
  documentGeneratedByUserId?: string | null;
  documentGeneratedByName?: string | null;
  documentGeneratedAt?: string | null;
  createdByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  // 헤더
  membershipName?: string | null;
  tradeDate?: string | null;
  salesContractAmount?: number | null;
  specialNotes?: string | null;

  // 매도자
  sellDealerId?: string | null;
  sellName?: string | null;
  sellCompany?: string | null;
  sellPhone?: string | null;
  sellEntityType?: SettlementEntityType | null;
  sellMembershipAmount?: number | null;
  sellDepositAmount?: number | null;
  sellDepositDate?: string | null;
  sellCommissionAmount?: number | null;
  sellCommissionDate?: string | null;
  sellCommissionDeducted?: boolean | null;
  sellBalanceAmount?: number | null;
  sellBalanceDate?: string | null;
  sellAccountHolder?: string | null;
  sellBankName?: string | null;
  sellAccountNumber?: string | null;
  sellMemo?: string | null;

  // 매수자
  buyDealerId?: string | null;
  buyName?: string | null;
  buyCompany?: string | null;
  buyPhone?: string | null;
  buyEntityType?: SettlementEntityType | null;
  buyMembershipAmount?: number | null;
  buyDepositAmount?: number | null;
  buyDepositDate?: string | null;
  buyCommissionAmount?: number | null;
  buyCommissionDate?: string | null;
  buyTransferFeeAmount?: number | null;
  buyTransferFeeDate?: string | null;
  buyStampTaxIncluded?: boolean | null;
  buyExtraFeeAmount?: number | null;
  buyExtraFeeItem?: string | null;
  buyExtraFeeDate?: string | null;
  buyBalanceAmount?: number | null;
  buyBalanceDate?: string | null;
  buyAccountHolder?: string | null;
  buyBankName?: string | null;
  buyAccountNumber?: string | null;
  buyMemo?: string | null;

  // 세금계산서
  taxInvoiceSalesAmount?: number | null;
  taxInvoiceSalesReceiver?: string | null;
  taxInvoicePurchaseAmount?: number | null;
  taxInvoicePurchaseIssuer?: string | null;

  // 유입경로 / 수익 / 경비
  sellRoute?: SettlementRoute | null;
  sellRouteDetail?: string | null;
  buyRoute?: SettlementRoute | null;
  buyRouteDetail?: string | null;
  profitSell?: number | null;
  profitBuy?: number | null;
  expenseAmount?: number | null;
  expenseDetail?: string | null;

  // 세무 후속 절차
  taxTransferRequired?: boolean | null;
  taxTransferAmount?: number | null;
  taxTransferDeadline?: string | null;
  taxTransferCompletedAt?: string | null;
  taxAcquisitionRequired?: boolean | null;
  taxAcquisitionAmount?: number | null;
  taxAcquisitionDeadline?: string | null;
  taxAcquisitionCompletedAt?: string | null;
}

/** POST /api/settlements/draft 응답 */
export interface SettlementDraftResponse {
  draft: Settlement;
  /** 백엔드가 자동으로 채울 수 없었던 필드 키 목록 (UI 가 필수 표시 등에 활용). */
  missingFields: string[];
  warnings: string[];
}

/** POST /api/settlements 요청 body */
export type SettlementInput = Settlement;

/**
 * PUT /api/settlements/:consultationId (general) 또는 /api/admin/settlements/:id (admin) 요청 body.
 * documentGenerated* 는 별도 PATCH 전용이므로 제외.
 */
export type SettlementUpdateInput = Partial<
  Omit<
    Settlement,
    | "id"
    | "organizationId"
    | "createdByUserId"
    | "createdByName"
    | "createdAt"
    | "updatedAt"
    | "documentGenerated"
    | "documentGeneratedAt"
    | "documentGeneratedByUserId"
    | "documentGeneratedByName"
  >
>;

/** POST /api/settlements/draft 요청 body */
export interface SettlementDraftRequest {
  consultationId: string;
}

/** GET /api/admin/settlements 응답 data (정규화 후). */
export interface SettlementsResponse {
  settlements: Settlement[];
  pagination: Pagination;
}
