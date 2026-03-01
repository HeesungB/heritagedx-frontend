"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Header, Sidebar } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { BackOfficeRepositoryProvider } from "@/contexts/RepositoryContext";
import { DataProvider } from "@/contexts/DataContext";
import { Building2, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const showSidebar = pathname.startsWith("/clubs/");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 페이지 이동 시 모바일 사이드바 닫기
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

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

          {/* Desktop sidebar */}
          {showSidebar && (
            <div className="hidden lg:block">
              <Sidebar />
            </div>
          )}

          {/* Mobile sidebar overlay */}
          {showSidebar && mobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40">
              <div
                className="fixed inset-0 bg-black/50"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <div className="fixed left-0 top-14 bottom-0 z-50">
                <Sidebar onClose={() => setMobileSidebarOpen(false)} />
              </div>
            </div>
          )}

          <main className={showSidebar ? "lg:ml-64" : ""}>{children}</main>

          {/* Mobile sidebar toggle FAB */}
          {showSidebar && !mobileSidebarOpen && (
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden fixed bottom-4 left-4 z-30 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            >
              <Building2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </DataProvider>
    </BackOfficeRepositoryProvider>
  );
}
