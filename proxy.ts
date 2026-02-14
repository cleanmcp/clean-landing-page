import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/onboarding(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const hostname = req.headers.get("host") ?? "";
  const pathname = req.nextUrl.pathname;

  // app.tryclean.ai root → redirect to /dashboard
  if (hostname.startsWith("app.") && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // tryclean.ai/dashboard → redirect to app.tryclean.ai/dashboard
  if (
    !hostname.startsWith("app.") &&
    !hostname.startsWith("localhost") &&
    pathname.startsWith("/dashboard")
  ) {
    const appUrl = new URL(pathname, `https://app.${hostname}`);
    appUrl.search = req.nextUrl.search;
    return NextResponse.redirect(appUrl);
  }

  // Allow webhooks through without auth
  if (isWebhookRoute(req)) {
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
