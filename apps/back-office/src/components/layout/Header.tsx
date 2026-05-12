"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Users,
  MessageSquare,
  FileText,
  Building2,
  Home,
  Menu,
  X,
  Bell,
  BarChart3,
  UserCircle,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { ROLE_LABELS, canManageOrg } from "@heritage-dx/store";

// 시안의 정적 카운트 배지. 추후 라이브 데이터로 교체 시 hook 으로 대체.
interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
}

const PRIMARY_NAV: NavLink[] = [
  {
    href: "/",
    label: "홈",
    icon: <Home className="w-3.5 h-3.5" />,
    isActive: (p) => p === "/",
  },
  {
    href: "/clubs",
    label: "골프장",
    icon: <Building2 className="w-3.5 h-3.5" />,
    isActive: (p) => p.startsWith("/clubs"),
  },
  {
    href: "/customers",
    label: "고객",
    icon: <UserCircle className="w-3.5 h-3.5" />,
    isActive: (p) => p.startsWith("/customers"),
  },
  {
    href: "/trade-memos",
    label: "상담일지",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    isActive: (p) => p.startsWith("/trade-memos"),
  },
  {
    href: "/trade-records",
    label: "거래 내역",
    icon: <FileText className="w-3.5 h-3.5" />,
    isActive: (p) => p.startsWith("/trade-records"),
  },
  {
    href: "/kpi",
    label: "통계",
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    isActive: (p) => p.startsWith("/kpi"),
  },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isNotificationsPage = pathname.startsWith("/notifications");
  const isUsersPage = pathname.startsWith("/users");
  const isMyOrgPage = pathname.startsWith("/my-organization");
  const canManageUsers = canManageOrg(user);

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-neutral-100">
      <div className="flex items-center h-16 px-7 gap-7">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 flex-shrink-0 text-[15px] font-bold tracking-tight text-neutral-900"
        >
          <span>Heritage DX</span>
          <span className="text-neutral-400 font-normal">/</span>
          <span className="text-[13.5px] font-medium">Back Office</span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden lg:flex items-center h-16">
          {PRIMARY_NAV.map((link) => {
            const active = link.isActive(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`h-16 flex items-center gap-[7px] px-3.5 text-[13.5px] tracking-[-0.005em] border-b-2 transition-colors ${
                  active
                    ? "border-neutral-900 text-neutral-900 font-semibold"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 font-medium"
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          {canManageUsers && (
            <>
              <Link
                href="/users"
                className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                  isUsersPage
                    ? "text-neutral-900 bg-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>사용자 관리</span>
              </Link>
              <Link
                href="/my-organization"
                className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                  isMyOrgPage
                    ? "text-neutral-900 bg-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>나의 조직</span>
              </Link>
            </>
          )}
          <div className="hidden lg:block w-px h-5 bg-neutral-200 mx-1.5" />

          {/* Notification bell */}
          <Link
            href="/notifications"
            className={`hidden lg:grid w-8 h-8 place-items-center rounded-lg relative hover:bg-neutral-50 transition-colors ${
              isNotificationsPage ? "bg-neutral-100" : ""
            }`}
            aria-label="알림"
          >
            <Bell className="w-4 h-4 text-neutral-600" strokeWidth={1.6} />
            {unreadCount > 0 && (
              <span className="absolute top-[5px] right-[5px] w-[7px] h-[7px] bg-neutral-900 rounded-full border-[1.5px] border-surface" />
            )}
          </Link>

          {/* User block */}
          {user && (
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5">
              <span className="text-[13.5px] font-semibold tracking-[-0.01em] text-neutral-900">
                {user.name}
              </span>
              <span className="text-[10.5px] font-semibold tracking-wide leading-[1.5] px-[7px] py-px rounded bg-neutral-900 text-white">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          )}

          <div className="hidden lg:block w-px h-5 bg-neutral-200 mx-1.5" />

          <button
            onClick={logout}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>로그아웃</span>
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-700 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-surface border-t border-neutral-100 shadow-lg z-40">
          <nav className="flex flex-col p-3 gap-1">
            {PRIMARY_NAV.map((link) => {
              const active = link.isActive(pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm rounded-lg transition-colors ${
                    active
                      ? "bg-neutral-100 text-neutral-900 font-semibold"
                      : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 font-medium"
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-neutral-100 my-1" />
            <Link
              href="/notifications"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 text-sm rounded-lg transition-colors ${
                isNotificationsPage
                  ? "bg-neutral-100 text-neutral-900 font-semibold"
                  : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 font-medium"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>알림</span>
              {unreadCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[11px] font-bold text-white bg-neutral-900 rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            {canManageUsers && (
              <>
                <div className="border-t border-neutral-100 my-1" />
                <Link
                  href="/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm rounded-lg transition-colors ${
                    isUsersPage
                      ? "bg-neutral-100 text-neutral-900 font-semibold"
                      : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 font-medium"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>사용자 관리</span>
                </Link>
                <Link
                  href="/my-organization"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm rounded-lg transition-colors ${
                    isMyOrgPage
                      ? "bg-neutral-100 text-neutral-900 font-semibold"
                      : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 font-medium"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>나의 조직</span>
                </Link>
              </>
            )}
            {user && (
              <>
                <div className="border-t border-neutral-100 my-1" />
                <div className="px-4 py-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900">{user.name}</span>
                  <span className="text-[10.5px] font-semibold leading-[1.5] px-[7px] py-px rounded bg-neutral-900 text-white">
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
