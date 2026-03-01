"use client";

import { useMemo } from "react";
import { ApiClient } from "@heritage-dx/api-client";
import { RepositoryProvider, createGeneralRepositories } from "@heritage-dx/api";

const API_BASE_URL = "/api-proxy/api";

export function OsRepositoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const general = useMemo(() => {
    const apiClient = new ApiClient(API_BASE_URL);
    return createGeneralRepositories(apiClient);
  }, []);

  return (
    <RepositoryProvider general={general}>
      {children}
    </RepositoryProvider>
  );
}
