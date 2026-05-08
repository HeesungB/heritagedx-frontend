import type { ApiResponse } from "@heritage-dx/types";

// 인증 만료 콜백 (AuthContext에서 등록)
let onAuthExpired: (() => void) | null = null;

export function setAuthExpiredHandler(handler: (() => void) | null) {
  onAuthExpired = handler;
}

// 토큰 refresh 중복 방지
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let authBaseUrl = "";

export function setAuthBaseUrl(url: string) {
  authBaseUrl = url;
}

export async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${authBaseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export function redirectToLogin() {
  if (onAuthExpired) {
    onAuthExpired();
  } else if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/login"
  ) {
    window.location.href = "/login";
  }
}

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ApiClientOptions {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(baseUrl: string, options?: ApiClientOptions) {
    this.baseUrl = baseUrl;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
        signal: controller.signal,
      });

      // 401 처리: refresh 시도 → 재요청 → 실패 시 로그인 이동
      if (response.status === 401 && !isRetry) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          return this.request<T>(endpoint, options, true);
        }
        redirectToLogin();
        return { success: false, error: "인증이 만료되었습니다." };
      }

      const json = await response.json();

      if (!response.ok) {
        // 응답 형태:
        //   1) NestJS class-validator: { message: string[], error: "Bad Request", statusCode }
        //   2) 커스텀 nested:           { error: { message, code, details }, ... }
        //   3) 커스텀 평탄:             { code, message, details, statusCode } (예: SETTLEMENT_REQUIRED_FIELDS)
        const customError =
          typeof json?.error === "object" && json.error !== null
            ? (json.error as { message?: unknown; code?: string; details?: unknown })
            : null;
        const messages = Array.isArray(json?.message)
          ? (json.message as string[])
          : Array.isArray(customError?.message)
            ? (customError.message as string[])
            : null;
        const singleError = messages
          ? messages.join("\n")
          : typeof customError?.message === "string"
            ? customError.message
            : typeof json?.message === "string"
              ? json.message
              : "요청 처리 중 오류가 발생했습니다.";
        const errorCode =
          customError?.code ??
          (typeof json?.code === "string" ? (json.code as string) : undefined);
        const errorDetails =
          (customError?.details as Record<string, unknown> | undefined) ??
          (typeof json?.details === "object" && json.details !== null
            ? (json.details as Record<string, unknown>)
            : null);
        return {
          success: false,
          error: singleError,
          errors: messages ?? undefined,
          errorCode,
          errorDetails,
        };
      }

      // API 응답이 { success, data, meta } 구조인 경우
      if (json.success !== undefined && json.data !== undefined) {
        if (json.meta) {
          return {
            success: json.success,
            data: { ...json.data, meta: json.meta },
          };
        }
        return {
          success: json.success,
          data: json.data,
        };
      }

      // 그 외의 경우 전체 응답 반환
      return {
        success: true,
        data: json,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          error: "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        };
      }
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "네트워크 오류가 발생했습니다.",
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async get<T>(
    endpoint: string,
    params?: PaginationParams,
  ): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append("page", params.page.toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.search) searchParams.append("search", params.search);
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadFormData<T>(
    endpoint: string,
    formData: FormData,
    isRetry = false,
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        body: formData,
        credentials: "include",
        signal: controller.signal,
      });

      // 401 처리
      if (response.status === 401 && !isRetry) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          return this.uploadFormData<T>(endpoint, formData, true);
        }
        redirectToLogin();
        return { success: false, error: "인증이 만료되었습니다." };
      }

      const json = await response.json();

      if (!response.ok) {
        const messages = Array.isArray(json?.message)
          ? (json.message as string[])
          : null;
        const errorCode =
          typeof json?.code === "string" ? (json.code as string) : undefined;
        const errorDetails =
          typeof json?.details === "object" && json.details !== null
            ? (json.details as Record<string, unknown>)
            : null;
        return {
          success: false,
          error: messages
            ? messages.join("\n")
            : (typeof json?.message === "string"
                ? json.message
                : "요청 처리 중 오류가 발생했습니다."),
          errors: messages ?? undefined,
          errorCode,
          errorDetails,
        };
      }

      if (json.success !== undefined && json.data !== undefined) {
        return {
          success: json.success,
          data: json.data,
        };
      }

      return {
        success: true,
        data: json,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          error: "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        };
      }
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "네트워크 오류가 발생했습니다.",
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
