import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/dashboard(.*)",
  "/subscription-expired(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const { orgId, sessionClaims } = await auth();

  // Subscription Status Block for dashboard
  if (req.nextUrl.pathname.startsWith("/dashboard") && orgId) {
    const orgMetadata = sessionClaims?.org_metadata as any;
    const subscriptionStatus = orgMetadata?.subscriptionStatus;

    if (subscriptionStatus === "inactive" && req.nextUrl.pathname !== "/subscription-expired") {
      return NextResponse.redirect(new URL("/subscription-expired", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
