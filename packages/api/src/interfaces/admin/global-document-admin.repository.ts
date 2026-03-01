import type {
  ApiResponse,
  GlobalDocument,
  GlobalDocumentsResponse,
} from "@heritage-dx/types";
import type { ListParams } from "../../types";

export interface IGlobalDocumentAdminRepository {
  getAll(params?: ListParams): Promise<ApiResponse<GlobalDocumentsResponse>>;
  getOne(id: string): Promise<ApiResponse<GlobalDocument>>;
  create(
    file: File | null,
    name: string,
    fileDescription?: string,
  ): Promise<ApiResponse<GlobalDocument>>;
  update(
    id: string,
    data: { name?: string; fileDescription?: string },
  ): Promise<ApiResponse<GlobalDocument>>;
  replaceFile(id: string, file: File): Promise<ApiResponse<GlobalDocument>>;
  delete(id: string): Promise<ApiResponse<void>>;
  getDownloadUrl(
    id: string,
  ): Promise<ApiResponse<{ url: string; expiresAt: string }>>;
}
