"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  clubName: string | null;
}

export default function Header({ clubName }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      href: "/",
      label: "홈",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      href: "/clubs",
      label: "골프장",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      ),
    },
    {
      href: "/trades",
      label: "상담일지",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      ),
    },
    {
      href: "/membership-trades",
      label: "거래 내역",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      href: "/claims",
      label: "건의사항",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
    },
  ];

  const mobileNavLinkClass = (active: boolean) =>
    `flex items-center gap-2.5 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
      active
        ? "bg-white/20 text-white"
        : "text-emerald-100 hover:text-white hover:bg-white/10"
    }`;

  return (
    <header className="sticky top-0 z-30 h-14 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 shadow-md px-4 lg:px-8 print:hidden">
      <div className="flex justify-between items-center h-full">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 rounded-lg w-7 h-7 flex items-center justify-center">
              <span className="text-white font-black text-sm">H</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">HERITAGE OS</h1>
              <p className="text-xs text-emerald-100 hidden sm:block leading-tight">회원권 딜러 실무 정보 허브</p>
            </div>
          </div>
          <div className="w-px h-6 bg-white/20 hidden sm:block" />
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href.split("?")[0];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-emerald-100 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {clubName && (
            <div className="text-right hidden sm:block">
              <span className="text-sm text-emerald-100">선택된 골프장</span>
              <p className="font-semibold text-white">{clubName}</p>
            </div>
          )}
          {user && (
            <div className="hidden sm:flex items-center gap-3">
              {clubName && <div className="w-px h-6 bg-white/20" />}
              <span className="text-sm text-white font-medium">{user.name}</span>
              <button
                onClick={logout}
                className="text-sm text-emerald-100 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-emerald-100 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-14 left-0 right-0 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 border-t border-white/10 shadow-lg z-40">
          <nav className="flex flex-col p-3 gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href.split("?")[0];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={mobileNavLinkClass(isActive)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="w-4 h-4">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            {user && (
              <>
                <div className="border-t border-white/10 my-1" />
                <div className="px-4 py-2 text-sm font-medium text-white">{user.name}</div>
                <button
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className={mobileNavLinkClass(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
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
