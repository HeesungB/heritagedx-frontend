"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { OsRepositoryProvider } from "@/contexts/RepositoryContext";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OsRepositoryProvider>
        <AuthGuard>
          <AppShell>{children}</AppShell>
        </AuthGuard>
      </OsRepositoryProvider>
    </AuthProvider>
  );
}
