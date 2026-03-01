import type {
  ApiResponse,
  TradeRecord,
  TradeRecordInput,
  TradeRecordsResponse,
} from "@heritage-dx/types";
import type { TradeListParams } from "../../types";

export interface IMembershipTradeRepository {
  getAll(params?: TradeListParams): Promise<ApiResponse<TradeRecordsResponse>>;
  create(data: TradeRecordInput): Promise<ApiResponse<TradeRecord>>;
  update(
    id: string,
    data: TradeRecordInput,
  ): Promise<ApiResponse<TradeRecord>>;
  delete(id: string): Promise<ApiResponse<void>>;
}
