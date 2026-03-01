"use client";

import { ReactNode, useMemo } from "react";
import {
  AuthProvider as SharedAuthProvider,
  useAuth,
  createAuthApi,
} from "@heritage-dx/auth";
import { setAuthBaseUrl } from "@heritage-dx/api-client";

const AUTH_BASE_URL = "/api-proxy";

export function AuthProvider({ children }: { children: ReactNode }) {
  const authApi = useMemo(() => {
    setAuthBaseUrl(AUTH_BASE_URL);
    return createAuthApi(AUTH_BASE_URL);
  }, []);

  return (
    <SharedAuthProvider authApi={authApi} loginPath="/login">
      {children}
    </SharedAuthProvider>
  );
}

export { useAuth };
