import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/admin/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/auth/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin/settings/admins") || pathname.startsWith("/admin/audit-logs")) {
    if (session.role !== "super_admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  // Sliding session: every active request renews the TTL so an admin working
  // past the original expiry isn't logged out mid-task.
  const res = NextResponse.next();
  const refreshedToken = await createSessionToken(session);
  res.cookies.set(SESSION_COOKIE_NAME, refreshedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
