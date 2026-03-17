"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, LogOut, Users, MessageSquare, FileText, Building2, Home, Menu, X, Bell, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "최고 관리자",
  ORG_ADMIN: "관리자",
  EDITOR: "편집자",
};

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isNotificationsPage = pathname.startsWith("/notifications");
  const isHomePage = pathname === "/";
  const isClubsPage = pathname.startsWith("/clubs");
  const isKpiPage = pathname.startsWith("/kpi");
  const isCommonDocsPage = pathname.startsWith("/common-documents");
  const isTradeMemosPage = pathname.startsWith("/trade-memos");
  const isTradeRecordsPage = pathname.startsWith("/trade-records");
  const isUsersPage = pathname.startsWith("/users");
  const isMyOrgPage = pathname.startsWith("/my-organization");
  const canManageUsers = user?.role === "SUPER_ADMIN" || user?.role === "ORG_ADMIN";

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
      active
        ? "bg-white/20 text-white"
        : "text-indigo-100 hover:text-white hover:bg-white/10"
    }`;

  const mobileNavLinkClass = (active: boolean) =>
    `flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
      active
        ? "bg-white/20 text-white"
        : "text-indigo-100 hover:text-white hover:bg-white/10"
    }`;

  return (
    <header className="sticky top-0 z-30 h-14 bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 shadow-md">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-black text-white">H</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Back Office</span>
          </Link>

          <div className="hidden lg:block w-px h-6 bg-white/20" />

          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/" className={navLinkClass(isHomePage)}>
              <Home className="w-3.5 h-3.5" />
              홈
            </Link>
            <Link href="/clubs" className={navLinkClass(isClubsPage)}>
              <Building2 className="w-3.5 h-3.5" />
              골프장
            </Link>
            <Link href="/trade-memos" className={navLinkClass(isTradeMemosPage)}>
              <MessageSquare className="w-3.5 h-3.5" />
              상담일지
            </Link>
            <Link href="/trade-records" className={navLinkClass(isTradeRecordsPage)}>
              <FileText className="w-3.5 h-3.5" />
              거래 내역
            </Link>
            <Link href="/kpi" className={navLinkClass(isKpiPage)}>
              <BarChart3 className="w-3.5 h-3.5" />
              통계
            </Link>
            <Link href="/common-documents" className={navLinkClass(isCommonDocsPage)}>
              <FolderOpen className="w-3.5 h-3.5" />
              공통 서류함
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {canManageUsers && (
            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/users" className={navLinkClass(isUsersPage)}>
                <Users className="w-3.5 h-3.5" />
                사용자 관리
              </Link>
              <Link href="/my-organization" className={navLinkClass(isMyOrgPage)}>
                <Building2 className="w-3.5 h-3.5" />
                나의 조직
              </Link>
            </nav>
          )}
          {canManageUsers && <div className="hidden lg:block w-px h-5 bg-white/20" />}
          {user && (
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/notifications"
                className="relative p-2 text-indigo-100 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <div className="w-px h-5 bg-white/20" />
              <div className="text-sm">
                <span className="font-medium text-white">{user.name}</span>
                <span className="ml-2 px-2 py-0.5 text-[11px] font-medium bg-white/15 text-indigo-100 rounded-full">
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
              <div className="w-px h-5 bg-white/20" />
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-100 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                로그아웃
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-indigo-100 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-14 left-0 right-0 bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 border-t border-white/10 shadow-lg z-40">
          <nav className="flex flex-col p-3 gap-1">
            <Link href="/" className={mobileNavLinkClass(isHomePage)} onClick={() => setMobileMenuOpen(false)}>
              <Home className="w-4 h-4" />
              홈
            </Link>
            <Link href="/clubs" className={mobileNavLinkClass(isClubsPage)} onClick={() => setMobileMenuOpen(false)}>
              <Building2 className="w-4 h-4" />
              골프장
            </Link>
            <Link href="/trade-memos" className={mobileNavLinkClass(isTradeMemosPage)} onClick={() => setMobileMenuOpen(false)}>
              <MessageSquare className="w-4 h-4" />
              상담일지
            </Link>
            <Link href="/trade-records" className={mobileNavLinkClass(isTradeRecordsPage)} onClick={() => setMobileMenuOpen(false)}>
              <FileText className="w-4 h-4" />
              거래 내역
            </Link>
            <Link href="/kpi" className={mobileNavLinkClass(isKpiPage)} onClick={() => setMobileMenuOpen(false)}>
              <BarChart3 className="w-4 h-4" />
              통계
            </Link>
            <Link href="/common-documents" className={mobileNavLinkClass(isCommonDocsPage)} onClick={() => setMobileMenuOpen(false)}>
              <FolderOpen className="w-4 h-4" />
              공통 서류함
            </Link>
            <div className="border-t border-white/10 my-1" />
            <Link href="/notifications" className={mobileNavLinkClass(isNotificationsPage)} onClick={() => setMobileMenuOpen(false)}>
              <Bell className="w-4 h-4" />
              알림
              {unreadCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            {canManageUsers && (
              <>
                <div className="border-t border-white/10 my-1" />
                <Link href="/users" className={mobileNavLinkClass(isUsersPage)} onClick={() => setMobileMenuOpen(false)}>
                  <Users className="w-4 h-4" />
                  사용자 관리
                </Link>
                <Link href="/my-organization" className={mobileNavLinkClass(isMyOrgPage)} onClick={() => setMobileMenuOpen(false)}>
                  <Building2 className="w-4 h-4" />
                  나의 조직
                </Link>
              </>
            )}
            {user && (
              <>
                <div className="border-t border-white/10 my-1" />
                <div className="px-4 py-2 text-sm">
                  <span className="font-medium text-white">{user.name}</span>
                  <span className="ml-2 px-2 py-0.5 text-[11px] font-medium bg-white/15 text-indigo-100 rounded-full">
                    {roleLabels[user.role] || user.role}
                  </span>
                </div>
                <button
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className={mobileNavLinkClass(false)}
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
