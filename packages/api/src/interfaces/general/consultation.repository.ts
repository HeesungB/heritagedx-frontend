import type {
  ApiResponse,
  TradeMemo,
  TradeMemoInput,
  TradeMemosResponse,
} from "@heritage-dx/types";
import type { TradeListParams } from "../../types";

export interface IConsultationRepository {
  getAll(params?: TradeListParams): Promise<ApiResponse<TradeMemosResponse>>;
  create(data: TradeMemoInput): Promise<ApiResponse<TradeMemo>>;
  update(id: string, data: TradeMemoInput): Promise<ApiResponse<TradeMemo>>;
  delete(id: string): Promise<ApiResponse<void>>;
}
