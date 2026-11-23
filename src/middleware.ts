import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isPathAllowedForRole, verifySessionToken } from "@/lib/adminAuth";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isPublicAdminPath = pathname === "/admin/login" || pathname === "/api/admin/auth/login";
  const isProtectedAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isProtectedAdminPath || isPublicAdminPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isPathAllowedForRole(pathname, session.role)) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/admin/leads", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
