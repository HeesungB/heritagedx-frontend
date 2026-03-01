import type { ApiClient } from "@heritage-dx/api-client";
import type { ApiResponse, Membership } from "@heritage-dx/types";
import type { IMembershipAdminRepository } from "../../interfaces/admin/membership-admin.repository";

export class MembershipAdminRepository implements IMembershipAdminRepository {
  constructor(private api: ApiClient) {}

  async create(
    data: Partial<Membership> & { clubId: string },
  ): Promise<ApiResponse<Membership>> {
    const { clubId, ...body } = data;
    return this.api.post<Membership>(
      `/admin/clubs/${clubId}/memberships`,
      body,
    );
  }

  async update(
    clubId: string,
    id: string,
    data: Partial<Membership>,
  ): Promise<ApiResponse<Membership>> {
    return this.api.put<Membership>(
      `/admin/clubs/${clubId}/memberships/${id}`,
      data,
    );
  }

  async delete(clubId: string, id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/admin/clubs/${clubId}/memberships/${id}`);
  }
}
