"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Users, FileText, MessageSquare } from "lucide-react";

const NAV_ITEMS = [
  { href: "/clubs", label: "골프장 검색", icon: Search },
  { href: "/customers", label: "고객 관리", icon: Users },
  { href: "/trades", label: "상담일지", icon: FileText },
  { href: "/claims", label: "건의 사항", icon: MessageSquare },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItem({
  href,
  label,
  Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: typeof Search;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium tracking-[-0.025em] transition-colors ${
        active
          ? "bg-white text-black shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]"
          : "text-[#9f9fa9] hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-[#27272a] bg-[#111] text-white">
      {/* 로고 */}
      <Link
        href="/"
        onClick={onNavigate}
        className="flex h-[72px] items-center gap-2.5 px-5"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]">
          <span className="h-2.5 w-2.5 rounded-md bg-black" />
        </span>
        <span className="text-[16px] leading-6 tracking-[0.02em] text-white">
          Heritage <span className="font-bold">DX</span>
        </span>
      </Link>

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto px-3 pt-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavItem
                href={item.href}
                label={item.label}
                Icon={item.icon}
                active={isActive(pathname, item.href)}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
