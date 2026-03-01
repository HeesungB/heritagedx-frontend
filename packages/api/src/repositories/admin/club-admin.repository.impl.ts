import type { ApiClient } from "@heritage-dx/api-client";
import type { ApiResponse, Club } from "@heritage-dx/types";
import type { IClubAdminRepository } from "../../interfaces/admin/club-admin.repository";

export class ClubAdminRepository implements IClubAdminRepository {
  constructor(private api: ApiClient) {}

  async create(data: Partial<Club>): Promise<ApiResponse<Club>> {
    return this.api.post<Club>("/admin/clubs", data);
  }

  async update(id: string, data: Partial<Club>): Promise<ApiResponse<Club>> {
    return this.api.put<Club>(`/admin/clubs/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/admin/clubs/${id}`);
  }
}
