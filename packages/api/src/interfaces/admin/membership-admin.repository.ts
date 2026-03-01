import type { ApiResponse, Membership } from "@heritage-dx/types";

export interface IMembershipAdminRepository {
  create(
    data: Partial<Membership> & { clubId: string },
  ): Promise<ApiResponse<Membership>>;
  update(
    clubId: string,
    id: string,
    data: Partial<Membership>,
  ): Promise<ApiResponse<Membership>>;
  delete(clubId: string, id: string): Promise<ApiResponse<void>>;
}
