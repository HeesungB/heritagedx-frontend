"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@heritage-dx/types";
import { setAuthExpiredHandler } from "@heritage-dx/api-client";
import type { AuthApi } from "./auth-api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 응답 데이터에서 User 객체 추출 (다양한 응답 형식 지원)
function extractUser(data: unknown): User | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  // { id, email, name, role } - 직접 User 객체 (me 응답 형식)
  if (obj.id && obj.email) {
    return obj as unknown as User;
  }
  // { user: { id, email, ... } } - user로 감싸진 경우 (login 응답 형식)
  if (obj.user && typeof obj.user === "object") {
    return obj.user as User;
  }
  return null;
}

interface AuthProviderProps {
  children: ReactNode;
  authApi: AuthApi;
  loginPath?: string;
  onLoginSuccess?: (user: User) => void;
}

export function AuthProvider({
  children,
  authApi,
  loginPath = "/login",
  onLoginSuccess,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 인증 만료 시 콜백 등록
  useEffect(() => {
    setAuthExpiredHandler(() => {
      setUser(null);
      router.replace(loginPath);
    });
    return () => setAuthExpiredHandler(null);
  }, [router, loginPath]);

  // 앱 시작 시 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      const result = await authApi.me();
      if (result.success && result.data) {
        const u = extractUser(result.data);
        if (u) setUser(u);
      }
      setIsLoading(false);
    };
    checkSession();
  }, [authApi]);

  // 주기적 토큰 refresh (14분마다)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const refreshed = await authApi.refresh();
      if (!refreshed) {
        setUser(null);
        router.replace(loginPath);
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, router, authApi, loginPath]);

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const loginResult = await authApi.login(email, password);
      if (!loginResult.success) {
        return loginResult.error || "로그인에 실패했습니다.";
      }

      if (loginResult.data) {
        const u = extractUser(loginResult.data);
        if (u) {
          setUser(u);
          onLoginSuccess?.(u);
          return null;
        }
      }

      return "로그인 응답에서 사용자 정보를 찾을 수 없습니다.";
    },
    [authApi, onLoginSuccess],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    router.replace(loginPath);
  }, [router, authApi, loginPath]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
