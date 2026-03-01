import type { AuthApiResponse, User } from "@heritage-dx/types";
import { tryRefreshToken } from "@heritage-dx/api-client";

export function createAuthApi(authBaseUrl: string) {
  return {
    login: async (
      email: string,
      password: string,
    ): Promise<AuthApiResponse<{ user: User }>> => {
      try {
        const response = await fetch(`${authBaseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        const json = await response.json();
        if (!response.ok) {
          return {
            success: false,
            error: json.message || "로그인에 실패했습니다.",
          };
        }
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

    logout: async (): Promise<AuthApiResponse<void>> => {
      try {
        const response = await fetch(`${authBaseUrl}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          return { success: false, error: "로그아웃에 실패했습니다." };
        }
        return { success: true };
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

    me: async (): Promise<AuthApiResponse<User>> => {
      try {
        const response = await fetch(`${authBaseUrl}/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          return { success: false, error: "인증 정보를 가져올 수 없습니다." };
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

    refresh: async (): Promise<boolean> => {
      return tryRefreshToken();
    },

    changePassword: async (data: {
      currentPassword: string;
      newPassword: string;
    }): Promise<AuthApiResponse<void>> => {
      try {
        const response = await fetch(`${authBaseUrl}/auth/change-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });
        const json = await response.json();
        if (!response.ok) {
          return {
            success: false,
            error: json.message || "비밀번호 변경에 실패했습니다.",
          };
        }
        return { success: true };
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
}

export type AuthApi = ReturnType<typeof createAuthApi>;
