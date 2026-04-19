import type { ApiResponse, Notice, NoticeInput, NoticesData } from "@heritage-dx/types";

export interface NoticeListParams {
  page?: number;
  limit?: number;
  search?: string;
  order?: "DESC" | "ASC";
}

export interface INoticeRepository {
  list(params?: NoticeListParams): Promise<ApiResponse<NoticesData>>;
  create(input: NoticeInput): Promise<ApiResponse<Notice>>;
  update(id: string, input: NoticeInput): Promise<ApiResponse<Notice>>;
  delete(id: string): Promise<ApiResponse<void>>;
}
