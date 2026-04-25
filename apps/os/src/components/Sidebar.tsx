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
      className={`flex h-[42px] items-center gap-[14px] rounded-md px-3 text-[15px] font-medium tracking-[-0.03em] transition-colors ${
        active
          ? "bg-white text-black shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]"
          : "text-[#9f9fa9] hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-[#27272a] bg-[#111] text-white">
      {/* 로고 */}
      <Link
        href="/"
        onClick={onNavigate}
        className="flex h-[72px] items-center gap-2.5 px-6"
      >
        <span className="flex h-7 w-[26.5px] items-center justify-center rounded-md bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]">
          <span className="h-3 w-3 rounded-md bg-black" />
        </span>
        <span className="text-[19px] leading-[28.5px] tracking-[0.0297px] text-white">
          Heritage <span className="font-bold">DX</span>
        </span>
      </Link>

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto px-4 pt-4">
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
