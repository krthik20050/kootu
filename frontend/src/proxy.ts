import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

const clerk = clerkMiddleware();
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true") return NextResponse.next();
  return clerk(request, event);
}

// No protected resource exists yet. Clerk authentication is not role authorization.
export const config = { matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|ttf|woff2?)).*)", "/(api|trpc)(.*)"] };
