import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Skip auth check for public API and NextAuth API routes
    if (path.startsWith("/api/auth") || path.startsWith("/api/public") || path.startsWith("/api/upload")) {
      return NextResponse.next();
    }

    // Require authentication for all other /api routes
    if (path.startsWith("/api/")) {
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // RBAC: Non-admins cannot DELETE
      if (req.method === "DELETE" && !["admin", "super_admin"].includes(token.role as string)) {
        return NextResponse.json({ error: "Forbidden: You do not have permission to delete records" }, { status: 403 });
      }

      // RBAC: Only Super Admin can manage settings and users
      if ((path.startsWith("/api/settings") || path.startsWith("/api/users")) && req.method !== "GET") {
        if (token.role !== "super_admin") {
          return NextResponse.json({ error: "Forbidden: Only Super Admin can perform this action" }, { status: 403 });
        }
      }
    } else {
      // For dashboard UI routes, require auth
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Protect UI settings and users routes
    if ((path.startsWith("/settings") || path.startsWith("/users")) && token?.role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {
      authorized: () => true, // Let middleware function handle the logic
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/rooms/:path*",
    "/bookings/:path*",
    "/guests/:path*",
    "/menu/:path*",
    "/billing/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/checkin/:path*",
    "/checkout/:path*",
    "/charges/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/api/:path*"
  ],
};
