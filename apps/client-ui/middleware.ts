// NextRequest gives us the incoming request object with headers, cookies, and URL
import { type NextRequest } from "next/server";
// our Supabase-aware session refresh helper
import { updateSession } from "@/utils/supabase/middleware";

// Next.js runs this function on every matching request before it hits a page or API route
// we use it to keep the Supabase auth session alive by refreshing cookies
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// tells Next.js which routes this middleware should run on
export const config = {
  matcher: [
    // run on every route EXCEPT Next.js internals, static assets, and common image formats
    // the negative lookahead (?!...) skips anything we don't need to auth-check
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
