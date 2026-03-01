"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { OsRepositoryProvider } from "@/contexts/RepositoryContext";
import AuthGuard from "@/components/AuthGuard";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OsRepositoryProvider>
        <AuthGuard>{children}</AuthGuard>
      </OsRepositoryProvider>
    </AuthProvider>
  );
}
