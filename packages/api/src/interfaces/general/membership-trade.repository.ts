import type {
  ApiResponse,
  MembershipTrade,
  MembershipTradesResponse,
} from "@heritage-dx/types";
import type { TradeListParams } from "../../types";

// 공개 거래 API는 read-only.
// POST/PUT/DELETE/PATCH workflow-action은 모두 제거되었고,
// 거래 생성은 관리자가 상담의 APPROVE_FIRST를 처리하면 백엔드가 자동 생성한다.
export interface IMembershipTradeRepository {
  getAll(params?: TradeListParams): Promise<ApiResponse<MembershipTradesResponse>>;
  getOne(id: string): Promise<ApiResponse<MembershipTrade>>;
}
