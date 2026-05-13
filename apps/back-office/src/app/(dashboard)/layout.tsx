"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { BackOfficeRepositoryProvider } from "@/contexts/RepositoryContext";
import { DataProvider } from "@/contexts/DataContext";
import { useFCMToken } from "@/hooks/useFCMToken";
import { useFCMForeground } from "@/hooks/useFCMForeground";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useFCMToken();
  useFCMForeground();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-neutral-500">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <BackOfficeRepositoryProvider>
      <DataProvider>
        <div className="min-h-screen bg-canvas p-4">
          <div className="min-h-[calc(100vh-2rem)] bg-surface rounded-shell shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </DataProvider>
    </BackOfficeRepositoryProvider>
  );
}
