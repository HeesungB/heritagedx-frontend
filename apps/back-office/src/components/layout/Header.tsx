"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, LogOut, Users, MessageSquare, FileText, Building2, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "최고 관리자",
  ORG_ADMIN: "관리자",
  EDITOR: "편집자",
};

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isHomePage = pathname === "/";
  const isClubsPage = pathname.startsWith("/clubs");
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

  return (
    <header className="sticky top-0 z-30 h-14 bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 shadow-md">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-black text-white">H</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Back Office</span>
          </Link>

          <div className="w-px h-6 bg-white/20" />

          <nav className="flex items-center gap-1">
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
              거래 메모
            </Link>
            <Link href="/trade-records" className={navLinkClass(isTradeRecordsPage)}>
              <FileText className="w-3.5 h-3.5" />
              거래 내역
            </Link>
            <Link href="/common-documents" className={navLinkClass(isCommonDocsPage)}>
              <FolderOpen className="w-3.5 h-3.5" />
              공통 서류함
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {canManageUsers && (
            <nav className="flex items-center gap-1">
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
          {canManageUsers && <div className="w-px h-5 bg-white/20" />}
          {user && (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
