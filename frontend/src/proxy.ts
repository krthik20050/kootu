import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

const clerk = clerkMiddleware();
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true") return NextResponse.next();
  return clerk(request, event);
}

// The external backend verifies Bearer tokens itself. Keep its upload stream out
// of Clerk middleware so large PDFs do not encounter middleware body limits.
export const config = { matcher: ["/((?!api/backend(?:/|$)|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|ttf|woff2?)).*)"] };
