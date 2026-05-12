"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Header, Sidebar } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { BackOfficeRepositoryProvider } from "@/contexts/RepositoryContext";
import { DataProvider } from "@/contexts/DataContext";
import { Building2 } from "lucide-react";
import { useFCMToken } from "@/hooks/useFCMToken";
import { useFCMForeground } from "@/hooks/useFCMForeground";

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

  // FCM 푸시 알림 초기화
  useFCMToken();
  useFCMForeground();

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

            <main className={`flex-1 ${showSidebar ? "lg:ml-64" : ""}`}>{children}</main>

            {/* Mobile sidebar toggle FAB */}
            {showSidebar && !mobileSidebarOpen && (
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden fixed bottom-4 left-4 z-30 bg-neutral-900 text-white p-3 rounded-full shadow-lg hover:bg-neutral-800 transition-colors"
              >
                <Building2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </DataProvider>
    </BackOfficeRepositoryProvider>
  );
}
