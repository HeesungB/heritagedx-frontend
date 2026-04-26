import type {
  AdminTradeAction,
  ApiResponse,
  ApprovalActionInput,
  MembershipTrade,
  MembershipTradeInput,
  MembershipTradesResponse,
} from "@heritage-dx/types";
import type { TradeListParams } from "../../types";

export interface IMembershipTradeAdminRepository {
  getAll(params?: TradeListParams): Promise<ApiResponse<MembershipTradesResponse>>;
  getById(id: string): Promise<ApiResponse<MembershipTrade>>;
  create(data: MembershipTradeInput): Promise<ApiResponse<MembershipTrade>>;
  update(
    id: string,
    data: MembershipTradeInput,
  ): Promise<ApiResponse<MembershipTrade>>;
  delete(id: string): Promise<ApiResponse<void>>;
  // 관리자 거래 액션: ADVANCE_TO_TAX_FILING / ADVANCE_TO_COMPLETED / REJECT 만 허용
  // REJECT 는 거래 레코드를 물리 삭제하고 원천 상담을 DRAFT 로 복귀시킨다.
  workflowAction(
    id: string,
    body: ApprovalActionInput<AdminTradeAction>,
  ): Promise<ApiResponse<MembershipTrade>>;
}
