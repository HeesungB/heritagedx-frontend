import type { AuthApiResponse } from "@heritage-dx/types";
import type { OrganizationEntity } from "@/types/organization";
import {
  setAuthExpiredHandler,
  tryRefreshToken,
  redirectToLogin,
} from "@heritage-dx/api-client";
import { createAuthApi } from "@heritage-dx/auth";

const AUTH_BASE_URL = "/api-proxy";

export { setAuthExpiredHandler, tryRefreshToken, redirectToLogin };

// Shared auth API (login, logout, me, refresh, changePassword)
const sharedAuthApi = createAuthApi(AUTH_BASE_URL);

// OS-specific: extends shared auth API with getOrganization
export const authApi = {
  ...sharedAuthApi,

  getOrganization: async (
    organizationId: string,
  ): Promise<AuthApiResponse<OrganizationEntity>> => {
    try {
      const response = await fetch(
        `${AUTH_BASE_URL}/api/admin/organizations/${organizationId}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      if (!response.ok) {
        return { success: false, error: "조직 정보를 가져올 수 없습니다." };
      }
      const json = await response.json();
      return { success: true, data: json.data || json };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "네트워크 오류가 발생했습니다.",
      };
    }
  },
};
