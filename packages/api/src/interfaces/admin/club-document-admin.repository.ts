import type {
  ApiResponse,
  Document,
  ClubDocument,
  ClubDocumentsResponse,
} from "@heritage-dx/types";
import type { ListParams } from "../../types";

export interface IClubDocumentAdminRepository {
  getByClub(
    clubId: string,
    params?: ListParams,
  ): Promise<ApiResponse<ClubDocumentsResponse>>;
  create(
    clubId: string,
    data: Partial<Document>,
  ): Promise<ApiResponse<ClubDocument>>;
  uploadFile(
    clubId: string,
    file: File,
    name: string,
    fileDescription?: string,
  ): Promise<ApiResponse<ClubDocument>>;
  update(
    clubId: string,
    docId: string,
    data: Partial<Document>,
  ): Promise<ApiResponse<ClubDocument>>;
  delete(clubId: string, docId: string): Promise<ApiResponse<void>>;
  getDownloadUrl(
    clubId: string,
    docId: string,
  ): Promise<ApiResponse<{ url: string; expiresAt: string }>>;
}
