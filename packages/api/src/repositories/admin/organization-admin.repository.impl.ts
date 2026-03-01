import type { ApiClient } from "@heritage-dx/api-client";
import type { ApiResponse, Organization } from "@heritage-dx/types";
import type { IOrganizationAdminRepository } from "../../interfaces/admin/organization-admin.repository";

export class OrganizationAdminRepository
  implements IOrganizationAdminRepository
{
  constructor(private api: ApiClient) {}

  async getOne(id: string): Promise<ApiResponse<Organization>> {
    return this.api.get<Organization>(`/admin/organizations/${id}`);
  }
}
