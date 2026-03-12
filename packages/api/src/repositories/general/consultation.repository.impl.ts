import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  TradeMemo,
  TradeMemoInput,
  TradeMemosResponse,
} from "@heritage-dx/types";
import type { IConsultationRepository } from "../../interfaces/general/consultation.repository";
import type { TradeListParams } from "../../types";

export class ConsultationRepository implements IConsultationRepository {
  constructor(private api: ApiClient) {}

  async getAll(
    params?: TradeListParams,
  ): Promise<ApiResponse<TradeMemosResponse>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.tradeType) searchParams.append("tradeType", params.tradeType);
    if (params?.clubId) searchParams.append("clubId", params.clubId);
    if (params?.sort) searchParams.append("sort", params.sort);
    if (params?.order) searchParams.append("order", params.order);
    if (params?.isDone !== undefined) searchParams.append("isDone", String(params.isDone));
    const queryString = searchParams.toString();
    const endpoint = `/consultations${queryString ? `?${queryString}` : ""}`;
    return this.api.get<TradeMemosResponse>(endpoint);
  }

  async create(data: TradeMemoInput): Promise<ApiResponse<TradeMemo>> {
    return this.api.post<TradeMemo>("/consultations", data);
  }

  async update(
    id: string,
    data: TradeMemoInput,
  ): Promise<ApiResponse<TradeMemo>> {
    return this.api.put<TradeMemo>(`/consultations/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/consultations/${id}`);
  }
}
