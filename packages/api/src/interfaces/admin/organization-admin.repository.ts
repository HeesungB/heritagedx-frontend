import type { ApiResponse, Organization } from "@heritage-dx/types";

export interface IOrganizationAdminRepository {
  getOne(id: string): Promise<ApiResponse<Organization>>;
}
