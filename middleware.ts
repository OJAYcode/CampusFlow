import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/lecturer" || pathname.startsWith("/lecturer/")) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = pathname.replace("/lecturer", "/staff/lecturer");
    return NextResponse.redirect(nextUrl);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = pathname.replace("/admin", "/staff/admin");
    return NextResponse.redirect(nextUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/lecturer/:path*", "/admin/:path*"],
};
