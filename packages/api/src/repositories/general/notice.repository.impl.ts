import type { ApiClient } from "@heritage-dx/api-client";
import type { ApiResponse, Notice, NoticeInput, NoticesData } from "@heritage-dx/types";
import type { INoticeRepository, NoticeListParams } from "../../interfaces/general/notice.repository";

export class NoticeRepository implements INoticeRepository {
  constructor(private api: ApiClient) {}

  async list(params?: NoticeListParams): Promise<ApiResponse<NoticesData>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.order) sp.set("order", params.order);
    if (params?.search) sp.set("search", params.search);

    const query = sp.toString();
    return this.api.get<NoticesData>(`/notices${query ? `?${query}` : ""}`);
  }

  async create(input: NoticeInput): Promise<ApiResponse<Notice>> {
    return this.api.post<Notice>("/admin/notices", input);
  }

  async update(id: string, input: NoticeInput): Promise<ApiResponse<Notice>> {
    return this.api.put<Notice>(`/admin/notices/${id}`, input);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/admin/notices/${id}`);
  }
}
