import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  Document,
  DocumentsResponse,
} from "@heritage-dx/types";
import type { IDocumentAdminRepository } from "../../interfaces/admin/document-admin.repository";
import type { ListParams } from "../../types";
import { normalizeListResponse } from "../../normalizers/normalize-list";

export class DocumentAdminRepository implements IDocumentAdminRepository {
  constructor(private api: ApiClient) {}

  async getAll(
    params?: ListParams,
  ): Promise<ApiResponse<DocumentsResponse>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.api.get<any>("/admin/documents", params);
    if (response.success && response.data) {
      const { items, pagination } = normalizeListResponse<Document>(
        response.data,
        "documents",
        "docCode",
      );
      return {
        success: true,
        data: { documents: items, pagination },
      };
    }
    return response as ApiResponse<DocumentsResponse>;
  }

  async getOne(id: string): Promise<ApiResponse<Document>> {
    return this.api.get<Document>(`/admin/documents/${id}`);
  }

  async create(data: Partial<Document>): Promise<ApiResponse<Document>> {
    return this.api.post<Document>("/admin/documents", data);
  }

  async update(
    id: string,
    data: Partial<Document>,
  ): Promise<ApiResponse<Document>> {
    return this.api.put<Document>(`/admin/documents/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/admin/documents/${id}`);
  }
}
