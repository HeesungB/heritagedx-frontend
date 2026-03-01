import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  Document,
  ClubDocument,
  ClubDocumentsResponse,
} from "@heritage-dx/types";
import type { IClubDocumentAdminRepository } from "../../interfaces/admin/club-document-admin.repository";
import type { ListParams } from "../../types";
import { normalizeListResponse } from "../../normalizers/normalize-list";

export class ClubDocumentAdminRepository
  implements IClubDocumentAdminRepository
{
  constructor(private api: ApiClient) {}

  async getByClub(
    clubId: string,
    params?: ListParams,
  ): Promise<ApiResponse<ClubDocumentsResponse>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.api.get<any>(
      `/admin/clubs/${clubId}/documents`,
      params,
    );
    if (response.success && response.data) {
      const { items, pagination } = normalizeListResponse<ClubDocument>(
        response.data,
        "documents",
      );
      return {
        success: true,
        data: { documents: items, pagination },
      };
    }
    return response as ApiResponse<ClubDocumentsResponse>;
  }

  async create(
    clubId: string,
    data: Partial<Document>,
  ): Promise<ApiResponse<ClubDocument>> {
    return this.api.post<ClubDocument>(
      `/admin/clubs/${clubId}/documents`,
      data,
    );
  }

  async uploadFile(
    clubId: string,
    file: File,
    name: string,
    fileDescription?: string,
  ): Promise<ApiResponse<ClubDocument>> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    if (fileDescription) {
      formData.append("fileDescription", fileDescription);
    }
    return this.api.uploadFormData<ClubDocument>(
      `/admin/clubs/${clubId}/documents`,
      formData,
    );
  }

  async update(
    clubId: string,
    docId: string,
    data: Partial<Document>,
  ): Promise<ApiResponse<ClubDocument>> {
    return this.api.put<ClubDocument>(
      `/admin/clubs/${clubId}/documents/${docId}`,
      data,
    );
  }

  async delete(clubId: string, docId: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/admin/clubs/${clubId}/documents/${docId}`);
  }

  async getDownloadUrl(
    clubId: string,
    docId: string,
  ): Promise<ApiResponse<{ url: string; expiresAt: string }>> {
    return this.api.get<{ url: string; expiresAt: string }>(
      `/admin/clubs/${clubId}/documents/${docId}/download-url`,
    );
  }
}
