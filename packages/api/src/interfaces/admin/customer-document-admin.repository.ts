import type {
  ApiResponse,
  CustomerDocument,
  CustomerDocumentsResponse,
} from "@heritage-dx/types";
import type { ListParams } from "../../types";

export interface ICustomerDocumentAdminRepository {
  getByClub(
    clubId: string,
    params?: ListParams,
  ): Promise<ApiResponse<CustomerDocumentsResponse>>;
  getOne(
    clubId: string,
    docId: string,
  ): Promise<ApiResponse<CustomerDocument>>;
  create(
    clubId: string,
    data: { name: string; description?: string },
  ): Promise<ApiResponse<CustomerDocument>>;
  update(
    clubId: string,
    docId: string,
    data: { name?: string; description?: string },
  ): Promise<ApiResponse<CustomerDocument>>;
  delete(clubId: string, docId: string): Promise<ApiResponse<void>>;
}
