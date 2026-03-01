"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Header, Sidebar } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { BackOfficeRepositoryProvider } from "@/contexts/RepositoryContext";
import { DataProvider } from "@/contexts/DataContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const showSidebar = pathname.startsWith("/clubs/");
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <BackOfficeRepositoryProvider>
      <DataProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          {showSidebar && <Sidebar />}
          <main className={showSidebar ? "ml-64" : ""}>{children}</main>
        </div>
      </DataProvider>
    </BackOfficeRepositoryProvider>
  );
}
