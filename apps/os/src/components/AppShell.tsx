"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { HeaderActionsProvider } from "@/contexts/HeaderActionsContext";

const FULLSCREEN_PATHS = new Set(["/login"]);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (FULLSCREEN_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <HeaderActionsProvider>
      <div className="flex min-h-screen bg-[#f9fafb]">
        {/* 데스크톱 사이드바 (lg 이상 고정) */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* 모바일 사이드바 (오버레이) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              aria-hidden
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <div className="absolute inset-y-0 left-0">
              <Sidebar forceExpanded onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader onMenuClick={() => setMobileOpen(true)} />
          <main className="flex flex-1 flex-col">{children}</main>
        </div>
      </div>
    </HeaderActionsProvider>
  );
}
