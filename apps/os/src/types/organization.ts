import type { OrganizationEntity } from "@heritage-dx/store";

export type { OrganizationEntity } from "@heritage-dx/store";

// OS-specific API response wrapper
export interface OrganizationResponse {
  success: boolean;
  data: OrganizationEntity;
  timestamp: string;
}
