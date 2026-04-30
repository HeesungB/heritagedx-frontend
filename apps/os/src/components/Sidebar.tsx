"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flag,
  Users,
  BookOpen,
  MessageSquare,
  Star,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { useFavoriteConsultations, useRecentSearches } from "@heritage-dx/store";

const NAV_ITEMS = [
  { href: "/clubs", label: "골프장 검색", icon: Flag },
  { href: "/customers", label: "고객 관리", icon: Users },
  { href: "/trades", label: "상담일지", icon: BookOpen },
  { href: "/claims", label: "건의 사항", icon: MessageSquare },
] as const;

const STORAGE_KEY = "heritage-os.sidebar.collapsed";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItem({
  href,
  label,
  Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={[
        "flex h-9 items-center rounded-[10px] text-[13px] font-medium tracking-[-0.01em] transition-colors",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        active
          ? "bg-[#2a2a2a] text-white"
          : "text-[#99a1af] hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-2 pt-4 text-[11px] uppercase tracking-[0.275px] text-[#6a7282]">
      {children}
    </div>
  );
}

export default function Sidebar({
  onNavigate,
  forceExpanded = false,
}: {
  onNavigate?: () => void;
  forceExpanded?: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { favoriteItems } = useFavoriteConsultations();
  const { recents: recentCustomers } = useRecentSearches("customers");

  useEffect(() => {
    if (forceExpanded) return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "1") setCollapsed(true);
  }, [forceExpanded]);

  const isCollapsed = !forceExpanded && collapsed;

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <aside
      className={[
        "flex h-full flex-col bg-[#1a1a1a] text-white",
        isCollapsed ? "w-16" : "w-[218px]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-[57px] shrink-0 items-center border-b border-[#2a2a2a]",
          isCollapsed ? "justify-center px-3.5" : "justify-between px-4",
        ].join(" ")}
      >
        {!isCollapsed && (
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-3 overflow-hidden"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white">
              <span className="h-2.5 w-2.5 rounded-full bg-black" />
            </span>
            <span className="text-[15px] leading-[22px] tracking-[-0.005em] text-white">
              Heritage <span className="font-bold">DX</span>
            </span>
          </Link>
        )}

        {!forceExpanded && (
          <button
            type="button"
            onClick={toggle}
            aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#99a1af] hover:bg-white/5 hover:text-white"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" strokeWidth={2} />
            ) : (
              <PanelLeftClose className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavItem
                href={item.href}
                label={item.label}
                Icon={item.icon}
                active={isActive(pathname, item.href)}
                collapsed={isCollapsed}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>

        {!isCollapsed && (
          <>
            <SectionLabel>즐겨찾기</SectionLabel>
            {favoriteItems.length === 0 ? (
              <p className="px-3 py-1.5 text-[12px] leading-[18px] text-[#6a7282]">
                즐겨찾기한 상담일지가 없습니다.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {favoriteItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={item.label}
                      className={[
                        "flex items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium text-[#99a1af] hover:bg-white/5 hover:text-white",
                        item.subLabel ? "h-[52px]" : "h-9",
                      ].join(" ")}
                    >
                      <Star className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[13px] text-[#99a1af]">
                          {item.label}
                        </span>
                        {item.subLabel && (
                          <span className="truncate text-[11px] leading-[16.5px] text-[#6a7282]">
                            {item.subLabel}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <SectionLabel>최근 항목</SectionLabel>
            {recentCustomers.length === 0 ? (
              <p className="px-3 py-1.5 text-[12px] leading-[18px] text-[#6a7282]">
                최근 본 고객이 없습니다.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {recentCustomers.map((item) => (
                  <li key={item.value}>
                    <Link
                      href={`/customers?customerId=${encodeURIComponent(item.value)}`}
                      onClick={onNavigate}
                      title={item.label}
                      className="flex h-9 items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium text-[#99a1af] hover:bg-white/5 hover:text-white"
                    >
                      <Clock className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}
