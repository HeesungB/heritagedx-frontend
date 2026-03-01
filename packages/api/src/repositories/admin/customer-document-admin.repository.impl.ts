import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  CustomerDocument,
  CustomerDocumentsResponse,
} from "@heritage-dx/types";
import type { ICustomerDocumentAdminRepository } from "../../interfaces/admin/customer-document-admin.repository";
import type { ListParams } from "../../types";
import { normalizeListResponse } from "../../normalizers/normalize-list";

export class CustomerDocumentAdminRepository
  implements ICustomerDocumentAdminRepository
{
  constructor(private api: ApiClient) {}

  async getByClub(
    clubId: string,
    params?: ListParams,
  ): Promise<ApiResponse<CustomerDocumentsResponse>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.api.get<any>(
      `/admin/clubs/${clubId}/customer-documents`,
      params,
    );
    if (response.success && response.data) {
      const { items, pagination } = normalizeListResponse<CustomerDocument>(
        response.data,
        "documents",
      );
      return {
        success: true,
        data: { documents: items, pagination },
      };
    }
    return response as ApiResponse<CustomerDocumentsResponse>;
  }

  async getOne(
    clubId: string,
    docId: string,
  ): Promise<ApiResponse<CustomerDocument>> {
    return this.api.get<CustomerDocument>(
      `/admin/clubs/${clubId}/customer-documents/${docId}`,
    );
  }

  async create(
    clubId: string,
    data: { name: string; description?: string },
  ): Promise<ApiResponse<CustomerDocument>> {
    return this.api.post<CustomerDocument>(
      `/admin/clubs/${clubId}/customer-documents`,
      data,
    );
  }

  async update(
    clubId: string,
    docId: string,
    data: { name?: string; description?: string },
  ): Promise<ApiResponse<CustomerDocument>> {
    return this.api.put<CustomerDocument>(
      `/admin/clubs/${clubId}/customer-documents/${docId}`,
      data,
    );
  }

  async delete(clubId: string, docId: string): Promise<ApiResponse<void>> {
    return this.api.delete(
      `/admin/clubs/${clubId}/customer-documents/${docId}`,
    );
  }
}
