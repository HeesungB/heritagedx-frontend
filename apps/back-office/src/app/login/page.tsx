"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronRight,
  Info,
  Phone,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "아이디를 입력하세요")
    .email("올바른 아이디(이메일) 형식을 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const REMEMBER_KEY = "heritage-dx:bo:remember-id";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberId, setRememberId] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(REMEMBER_KEY) : null;
    if (saved) {
      setValue("email", saved);
      setRememberId(true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);
    if (rememberId) {
      localStorage.setItem(REMEMBER_KEY, data.email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    const loginError = await login(data.email, data.password);
    if (loginError) {
      setError(loginError);
      setIsSubmitting(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{user ? "리다이렉트 중..." : "로딩 중..."}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.4fr_1fr]">
      {/* Left — Brand hero (dark) */}
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0a0a0a] px-16 py-10 text-white">
        {/* Green radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(600px circle at 20% 30%, rgba(245,158,11,0.18), transparent 60%)",
          }}
        />

        {/* Top row: logo + support */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-black ring-1 ring-white/15">
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
            <span className="text-xl font-semibold tracking-tight">
              Heritage <span className="font-bold">DX</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
              <Phone className="h-4 w-4 text-white/80" />
            </span>
            <div className="text-right leading-tight">
              <div className="text-xs text-white/50">고객지원센터</div>
              <div className="text-base font-bold">1588-0000</div>
            </div>
          </div>
        </div>

        {/* Middle: badge + title + subtitle */}
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center rounded-full bg-amber-400/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] text-amber-300 ring-1 ring-inset ring-amber-400/30">
            PREMIUM MANAGEMENT SYSTEM
          </span>
          <h1 className="mt-6 text-5xl font-bold leading-[1.15] tracking-tight xl:text-[56px]">
            데이터로 연결하는
            <br />
            새로운 자산의 가치
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/60">
            안전하고 체계적인 운영 인프라를 통해
            <br />
            성공적인 비즈니스 의사결정을 지원합니다.
          </p>
        </div>

        {/* Bottom: system notices */}
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/90">
            <Info className="h-4 w-4 text-white/60" />
            시스템 주요 안내
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <article className="relative rounded-xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <div className="mb-1.5 flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldAlert className="h-4 w-4 text-orange-400" />
                  정기 보안 점검
                </div>
                <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-orange-300 ring-1 ring-inset ring-orange-500/30">
                  NOTICE
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-white/65">
                매월 첫째 주 일요일 새벽{" "}
                <span className="font-semibold text-white/85">
                  (02:00~04:00)
                </span>
                은 점검으로 접속이 제한될 수 있습니다. 작업 전 데이터를 반드시
                저장해 주시기 바랍니다.
              </p>
            </article>

            <article className="relative rounded-xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                최초 접속자 및 보안 안내
              </div>
              <ul className="space-y-1.5 text-[13px] leading-relaxed text-white/65">
                <li className="flex gap-2">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-white/40" />
                  초기 비밀번호는 반드시 변경해야 합니다. (8자리 이상)
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-white/40" />
                  5회 오류 시 잠금, 장기 미접속(90일) 시 휴면 처리됩니다.
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Right — Login form */}
      <section className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-black">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-gray-900">
              Heritage <span className="font-bold">DX</span>
            </span>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              로그인
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              아이디와 비밀번호를 입력해 주십시오.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-900"
              >
                아이디
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="아이디를 입력하세요"
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-900"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={rememberId}
                  onChange={(e) => setRememberId(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 accent-gray-900 focus:ring-gray-900"
                />
                아이디 저장
              </label>
              <button
                type="button"
                onClick={() =>
                  alert("비밀번호 초기화는 관리자에게 문의해 주세요.")
                }
                className="text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                비밀번호 초기화
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? "접속 중..." : "접속하기"}
              {!isSubmitting && (
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>

            <p className="pt-2 text-center text-xs text-gray-400">
              인가된 사용자만 접근할 수 있으며, 불법 접근 시 처벌받을 수
              있습니다.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
