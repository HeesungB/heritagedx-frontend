import type {
  ApiResponse,
  ApprovalActionInput,
  MembershipTrade,
  MembershipTradeInput,
  MembershipTradesResponse,
} from "@heritage-dx/types";
import type { TradeListParams } from "../../types";

export interface IMembershipTradeRepository {
  getAll(params?: TradeListParams): Promise<ApiResponse<MembershipTradesResponse>>;
  create(data: MembershipTradeInput): Promise<ApiResponse<MembershipTrade>>;
  update(
    id: string,
    data: MembershipTradeInput,
  ): Promise<ApiResponse<MembershipTrade>>;
  delete(id: string): Promise<ApiResponse<void>>;
  workflowAction(
    id: string,
    body: ApprovalActionInput,
  ): Promise<ApiResponse<MembershipTrade>>;
}
