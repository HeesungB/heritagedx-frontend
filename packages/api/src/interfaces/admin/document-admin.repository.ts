import type {
  ApiResponse,
  Document,
  DocumentsResponse,
} from "@heritage-dx/types";
import type { ListParams } from "../../types";

export interface IDocumentAdminRepository {
  getAll(params?: ListParams): Promise<ApiResponse<DocumentsResponse>>;
  getOne(id: string): Promise<ApiResponse<Document>>;
  create(data: Partial<Document>): Promise<ApiResponse<Document>>;
  update(id: string, data: Partial<Document>): Promise<ApiResponse<Document>>;
  delete(id: string): Promise<ApiResponse<void>>;
}
