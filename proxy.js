import { NextResponse } from "next/server";

// Optimistic routing only. Every API call re-checks the token, role and revocation server-side.
export function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has("lasan_session");
  const role = request.cookies.get("lasan_role")?.value;
  const home = role === "admin" ? "/admin" : "/employee";

  if (pathname === "/login") {
    return hasSession ? NextResponse.redirect(new URL(home, request.url)) : NextResponse.next();
  }

  if (!hasSession) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (pathname === "/" || (pathname.startsWith("/admin") && role !== "admin") || (pathname.startsWith("/employee") && role === "admin")) {
    return NextResponse.redirect(new URL(home, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/employee/:path*", "/change-password"],
};
