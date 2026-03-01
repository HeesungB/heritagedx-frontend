"use client";

import { useMemo } from "react";
import { ApiClient } from "@heritage-dx/api-client";
import {
  RepositoryProvider,
  createGeneralRepositories,
  createAdminRepositories,
} from "@heritage-dx/api";

const API_BASE_URL = "/api-proxy/api";

export function BackOfficeRepositoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { general, admin } = useMemo(() => {
    const apiClient = new ApiClient(API_BASE_URL);
    return {
      general: createGeneralRepositories(apiClient),
      admin: createAdminRepositories(apiClient, API_BASE_URL),
    };
  }, []);

  return (
    <RepositoryProvider general={general} admin={admin}>
      {children}
    </RepositoryProvider>
  );
}
