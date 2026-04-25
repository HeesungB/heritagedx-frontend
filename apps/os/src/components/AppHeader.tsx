"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, ChevronRight, User as UserIcon, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPageTitle } from "@/lib/breadcrumb";

export default function AppHeader({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e5e7eb] bg-white px-4 lg:px-8">
      <div className="flex items-center gap-3">
        {/* 모바일 햄버거 */}
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

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2.5 text-[13px] tracking-[-0.005em]">
          <Link href="/" className="text-[#6a7282] hover:text-black">
            홈
          </Link>
          {title && title !== "홈" && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-[#6a7282]" strokeWidth={2} />
              <span className="font-bold text-black">{title}</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        {/* 검색 pill (placeholder) */}
        <div
          aria-hidden
          className="hidden h-10 w-[320px] items-center gap-3 rounded-full bg-[#f3f4f6] px-4 text-[14px] tracking-[-0.01em] text-[#99a1bf] sm:flex"
        >
          <Search className="h-4 w-4" strokeWidth={2} />
          <span className="select-none">고객명, 연락처, 담당자 검색...</span>
        </div>

        <div className="hidden h-6 w-px bg-[#e5e7eb] sm:block" />

        {/* 사용자 */}
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f3f4f6] text-[#4a5565]">
            <UserIcon className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="hidden text-[13px] font-bold tracking-[-0.005em] text-[#4a5565] sm:block">
            {user?.name ?? "사용자"}
          </span>
        </div>
      </div>
    </header>
  );
}
