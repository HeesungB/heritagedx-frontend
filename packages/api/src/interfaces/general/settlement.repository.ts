import type {
  ApiResponse,
  Settlement,
  SettlementDraftResponse,
  SettlementInput,
  SettlementUpdateInput,
} from "@heritage-dx/types";

export interface ISettlementRepository {
  /**
   * 상담 기준 입출금표 초안값 산출 (in-memory).
   * 응답은 `{ draft, missingFields, warnings }` 형태로 한 단계 감싸 옴.
   */
  createDraft(
    consultationId: string,
  ): Promise<ApiResponse<SettlementDraftResponse>>;
  /** 첫 persist. */
  create(data: SettlementInput): Promise<ApiResponse<Settlement>>;
  getOne(consultationId: string): Promise<ApiResponse<Settlement>>;
  update(
    consultationId: string,
    data: SettlementUpdateInput,
  ): Promise<ApiResponse<Settlement>>;
  /** 문서 생성 완료 마킹 — 상담 승인 요청 단계로 진행하기 위한 게이트. */
  markDocumentGenerated(
    consultationId: string,
  ): Promise<ApiResponse<Settlement>>;
  delete(consultationId: string): Promise<ApiResponse<void>>;
}
