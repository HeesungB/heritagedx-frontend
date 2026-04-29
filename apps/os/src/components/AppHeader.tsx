"use client";

import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useHeaderActions } from "@/contexts/HeaderActionsContext";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ORG_ADMIN: "Org Admin",
  EDITOR: "Editor",
};

export default function AppHeader({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const { user, logout } = useAuth();
  const { actions } = useHeaderActions();
  const roleLabel = user?.role ? ROLE_LABELS[user.role] ?? null : null;

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
