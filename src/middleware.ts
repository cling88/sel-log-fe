import { type NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE = "sellog_token";

/** 인증 없이 접근 가능한 경로 */
const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일, Next.js 내부 경로 제외
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  // 미인증 + 보호 경로 → 로그인으로 리다이렉트
  if (!token && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인된 상태에서 /login 접근 → 대시보드로
  if (token && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
