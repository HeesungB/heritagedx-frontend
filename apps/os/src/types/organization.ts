import type { Organization } from "@heritage-dx/types";

export type { Organization } from "@heritage-dx/types";

// OS-specific API response wrapper
export interface OrganizationResponse {
  success: boolean;
  data: Organization;
  timestamp: string;
}
