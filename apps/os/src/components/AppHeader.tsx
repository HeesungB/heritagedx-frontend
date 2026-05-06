"use client";

import {
  Menu,
  LogOut,
  Home,
  Flag,
  Users,
  BookOpen,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useHeaderActions } from "@/contexts/HeaderActionsContext";
import { getPageTitle } from "@/lib/breadcrumb";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ORG_ADMIN: "Org Admin",
  EDITOR: "Editor",
};

const PAGE_ICONS: { match: (pathname: string) => boolean; icon: LucideIcon }[] = [
  { match: (p) => p === "/", icon: Home },
  { match: (p) => p.startsWith("/clubs"), icon: Flag },
  { match: (p) => p.startsWith("/customers"), icon: Users },
  { match: (p) => p.startsWith("/trades"), icon: BookOpen },
  { match: (p) => p.startsWith("/claims"), icon: MessageSquare },
];

function getPageIcon(pathname: string): LucideIcon | null {
  return PAGE_ICONS.find((entry) => entry.match(pathname))?.icon ?? null;
}

export default function AppHeader({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { actions } = useHeaderActions();
  const roleLabel = user?.role ? ROLE_LABELS[user.role] ?? null : null;
  const pageTitle = getPageTitle(pathname);
  const PageIcon = getPageIcon(pathname);

  return (
    <header className="flex h-[57px] shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="메뉴 열기"
            className="-ml-1 flex h-9 w-9 items-center justify-center rounded-md text-[#4a5565] hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        <div className="flex min-w-0 items-center gap-3">
          {PageIcon && (
            <PageIcon className="h-4 w-4 shrink-0 text-[#4a5565]" strokeWidth={1.75} />
          )}
          <span className="truncate text-[15px] font-medium leading-[22px] tracking-[-0.005em] text-[#101828]">
            {pageTitle}
          </span>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {roleLabel && (
          <span className="hidden text-[13px] font-medium tracking-[-0.005em] text-[#4a5565] sm:inline">
            {roleLabel}
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            void logout();
          }}
          aria-label="로그아웃"
          className="flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] font-medium tracking-[-0.005em] text-[#4a5565] hover:bg-gray-100 hover:text-black"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          <span className="hidden sm:inline">로그아웃</span>
        </button>
      </div>
    </header>
  );
}
