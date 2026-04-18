"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Info, ShieldCheck, Workflow } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const REMEMBER_KEY = "heritage-dx:os:remember-id";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberId, setRememberId] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(REMEMBER_KEY) : null;
    if (saved) {
      setEmail(saved);
      setRememberId(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("아이디를 입력하세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력하세요.");
      return;
    }

    setIsSubmitting(true);
    if (rememberId) {
      localStorage.setItem(REMEMBER_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    const loginError = await login(email, password);
    if (loginError) {
      setError(loginError);
      setIsSubmitting(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">
          {user ? "리다이렉트 중..." : "로딩 중..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Header — full-width, 64px */}
      <header className="flex h-16 items-center border-b border-gray-200 bg-white px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-black">
            <span className="h-3 w-3 rounded-md bg-white" />
          </span>
          <span className="text-[19px] leading-none tracking-[0.025em] text-black">
            Heritage <span className="font-bold">DX</span>
            <span className="ml-1.5 inline-block rounded-sm bg-green-100 px-1.5 py-0.5 align-middle text-[9px] font-bold tracking-widest text-green-700">
              OS
            </span>
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="grid flex-1 lg:grid-cols-[1.5fr_1fr]">
        {/* Left — Brand hero (dark, green accent) */}
        <section className="relative hidden lg:flex flex-col overflow-hidden bg-[#111] px-14 py-16 text-white">
          {/* Green glow (top-left) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[-95px] top-[-178px] h-[535px] w-[568px] rounded-full"
            style={{
              background: "rgba(0, 201, 80, 0.12)",
              filter: "blur(120px)",
            }}
          />
          {/* Green glow (bottom-right) */}
          <div
            aria-hidden
            className="pointer-events-none absolute right-[-94px] bottom-[-100px] h-[624px] w-[663px] rounded-full"
            style={{
              background: "rgba(0, 201, 80, 0.06)",
              filter: "blur(140px)",
            }}
          />

          {/* Badge */}
          <div className="relative z-10">
            <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#05df72]">
              Brokerage Operation Software
            </span>
          </div>

          {/* Title */}
          <h1 className="relative z-10 mt-5 text-[40px] font-extrabold leading-[1.2] tracking-[-0.018em]">
            상담부터 계약까지
            <br />
            거래의 전 과정을 한 화면에서
          </h1>

          {/* Subtitle */}
          <p className="relative z-10 mt-4 text-[15px] font-medium leading-[1.625] tracking-[-0.02em] text-[#99a1af]">
            운영 효율과 성과를 높이는
            <br />
            회원권 업계 최초의 운영 시스템
          </p>

          <div className="flex-1" />

          {/* Bottom: operator notices */}
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-white/70" />
              <span className="text-[15px] font-extrabold text-white">
                운영자 주요 안내
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <article className="rounded-md border border-[#333] bg-[#1a1a1a] p-5">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[14px] font-bold tracking-[-0.015em] text-white">
                    <Workflow className="h-4 w-4 text-green-300" />
                    상담 · 거래 전환 흐름
                  </div>
                  <span className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#05df72]">
                    Workflow
                  </span>
                </div>
                <p className="text-[13px] font-medium leading-[1.6] tracking-[-0.01em] text-[#99a1af]">
                  상담이{" "}
                  <span className="font-bold text-white">1차 승인</span>되면
                  거래 초안이 자동 생성됩니다. 계약금 입금 확인 후 거래 전환을
                  완료해 주세요.
                </p>
              </article>

              <article className="rounded-md border border-[#333] bg-[#1a1a1a] p-5">
                <div className="mb-2.5 flex items-center gap-2 text-[14px] font-bold tracking-[-0.015em] text-white">
                  <ShieldCheck className="h-4 w-4 text-green-400" />
                  최초 접속자 및 보안 안내
                </div>
                <ul className="space-y-1 text-[13px] font-medium leading-[1.6] tracking-[-0.01em] text-[#99a1af]">
                  <li className="flex gap-2">
                    <span className="font-bold text-[#555]">•</span>
                    초기 비밀번호는 반드시 변경해야 합니다. (8자리 이상)
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-[#555]">•</span>
                    5회 오류 시 잠금, 장기 미접속(90일) 시 휴면 처리됩니다.
                  </li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* Right — Login form */}
        <section className="flex items-center justify-center bg-white px-10 py-12">
          <div className="w-full max-w-[360px]">
            <div className="mb-8 text-center">
              <h2 className="text-[26px] font-extrabold leading-[1.4] tracking-[-0.012em] text-black">
                로그인
              </h2>
              <p className="mt-1.5 text-[14px] font-medium tracking-[-0.015em] text-[#6a7282]">
                아이디와 비밀번호를 입력해 주십시오.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[13px] font-extrabold tracking-[-0.01em] text-black"
                >
                  아이디
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="아이디를 입력하세요"
                  className="block h-[48px] w-full rounded-md border-2 border-[#e5e7eb] bg-white px-3.5 text-[14px] font-medium tracking-[-0.02em] text-gray-900 placeholder:text-[#99a1af] focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-[13px] font-extrabold tracking-[-0.01em] text-black"
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  className="block h-[48px] w-full rounded-md border-2 border-[#e5e7eb] bg-white px-3.5 text-[14px] font-medium tracking-[-0.02em] text-gray-900 placeholder:text-[#99a1af] focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] font-bold tracking-[-0.01em] text-[#364153]">
                  <input
                    type="checkbox"
                    checked={rememberId}
                    onChange={(e) => setRememberId(e.target.checked)}
                    className="h-4 w-4 rounded-md border-2 border-[#d1d5dc] text-gray-900 accent-gray-900 focus:ring-gray-900"
                  />
                  아이디 저장
                </label>
                <button
                  type="button"
                  onClick={() =>
                    alert("비밀번호 초기화는 관리자에게 문의해 주세요.")
                  }
                  className="text-[13px] font-bold tracking-[-0.01em] text-[#6a7282] hover:text-gray-900"
                >
                  비밀번호 초기화
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex h-[48px] w-full items-center justify-center gap-1.5 rounded-md bg-black text-[15px] font-extrabold tracking-[-0.025em] text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isSubmitting ? "접속 중..." : "접속하기"}
                {!isSubmitting && (
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </button>

              <p className="pt-1 text-center text-[11px] font-medium text-[#99a1af]">
                인가된 사용자만 접근할 수 있으며, 불법 접근 시 처벌받을 수
                있습니다.
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
