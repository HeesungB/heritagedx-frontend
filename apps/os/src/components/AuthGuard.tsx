"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PasswordChangeModal from "@/components/PasswordChangeModal";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, updateUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [passwordChanged, setPasswordChanged] = useState(false);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.replace("/login");
    }
  }, [isLoading, user, isLoginPage, router]);

  // 로그인 페이지는 보호하지 않음
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // 미인증
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">리다이렉트 중...</div>
      </div>
    );
  }

  // 비밀번호 변경 필요
  if (user.mustChangePassword && !passwordChanged) {
    return (
      <>
        <div className="min-h-screen bg-gray-50" />
        <PasswordChangeModal
          onSuccess={() => {
            updateUser({ mustChangePassword: false });
            setPasswordChanged(true);
          }}
        />
      </>
    );
  }

  return <>{children}</>;
}
