import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://api.heritage-dx.com";

type SessionUser = {
  id?: string;
  role?: "SUPER_ADMIN" | "ORG_ADMIN" | "EDITOR";
  organizationId?: string;
};

/**
 * 쿠키 세션을 백엔드로 forward 해 사용자 정보를 조회한다.
 * 토큰이 오퍼크(opaque) 쿠키이므로 Edge 에서 직접 디코드 불가 → /auth/me 호출.
 */
async function fetchSessionUser(cookie: string): Promise<SessionUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { cookie },
      // Edge Runtime 에서 cache: 'no-store' 로 stale 위험 제거.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json();
    const user = (body?.data ?? body) as SessionUser | null;
    return user && user.role ? user : null;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  const next = request.nextUrl.pathname + request.nextUrl.search;
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

function redirectToDashboardRoot(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.headers.get("cookie");

  // 쿠키 자체가 없으면 백엔드 호출 없이 즉시 로그인 이동.
  if (!cookie) return redirectToLogin(request);

  const user = await fetchSessionUser(cookie);
  if (!user) return redirectToLogin(request);

  // 역할 기반 가드 — /users, /my-organization
  const needsOrgAdmin = pathname.startsWith("/my-organization");
  const needsNonEditor = pathname.startsWith("/users");

  if (needsOrgAdmin && !(user.role === "SUPER_ADMIN" || user.role === "ORG_ADMIN")) {
    return redirectToDashboardRoot(request);
  }
  if (needsNonEditor && user.role === "EDITOR") {
    return redirectToDashboardRoot(request);
  }

  return NextResponse.next();
}

/**
 * matcher — 아래 경로는 제외한다.
 *   - /login                         (공개 페이지)
 *   - /api/*                         (Route Handler 내부에서 별도 인증)
 *   - /_next/static, /_next/image    (Next 내부)
 *   - favicon, 정적 파일(*.ext)      (asset)
 */
export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
