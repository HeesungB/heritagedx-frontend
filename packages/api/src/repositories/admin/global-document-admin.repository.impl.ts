import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  GlobalDocument,
  GlobalDocumentsResponse,
} from "@heritage-dx/types";
import type { IGlobalDocumentAdminRepository } from "../../interfaces/admin/global-document-admin.repository";
import type { ListParams } from "../../types";
import { normalizeListResponse } from "../../normalizers/normalize-list";

export class GlobalDocumentAdminRepository
  implements IGlobalDocumentAdminRepository
{
  private baseUrl: string;

  constructor(
    private api: ApiClient,
    baseUrl: string,
  ) {
    this.baseUrl = baseUrl;
  }

  async getAll(
    params?: ListParams,
  ): Promise<ApiResponse<GlobalDocumentsResponse>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.api.get<any>(
      "/admin/global-documents",
      params,
    );
    if (response.success && response.data) {
      const { items, pagination } = normalizeListResponse<GlobalDocument>(
        response.data,
        "documents",
      );
      return {
        success: true,
        data: { documents: items, pagination },
      };
    }
    return response as ApiResponse<GlobalDocumentsResponse>;
  }

  async getOne(id: string): Promise<ApiResponse<GlobalDocument>> {
    return this.api.get<GlobalDocument>(`/admin/global-documents/${id}`);
  }

  async create(
    file: File | null,
    name: string,
    fileDescription?: string,
  ): Promise<ApiResponse<GlobalDocument>> {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("name", name);
    if (fileDescription) {
      formData.append("fileDescription", fileDescription);
    }
    return this.api.uploadFormData<GlobalDocument>(
      "/admin/global-documents",
      formData,
    );
  }

  async update(
    id: string,
    data: { name?: string; fileDescription?: string },
  ): Promise<ApiResponse<GlobalDocument>> {
    return this.api.put<GlobalDocument>(
      `/admin/global-documents/${id}`,
      data,
    );
  }

  async replaceFile(
    id: string,
    file: File,
  ): Promise<ApiResponse<GlobalDocument>> {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/global-documents/${id}/file`,
        {
          method: "PUT",
          body: formData,
          credentials: "include",
        },
      );
      const json = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: json.message || "파일 교체 중 오류가 발생했습니다.",
        };
      }
      if (json.success !== undefined && json.data !== undefined) {
        return { success: json.success, data: json.data };
      }
      return { success: true, data: json };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "네트워크 오류가 발생했습니다.",
      };
    }
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/admin/global-documents/${id}`);
  }

  async getDownloadUrl(
    id: string,
  ): Promise<ApiResponse<{ url: string; expiresAt: string }>> {
    return this.api.get<{ url: string; expiresAt: string }>(
      `/admin/global-documents/${id}/download-url`,
    );
  }
}
