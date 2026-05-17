// the server-side Supabase client, designed specifically for use in middleware
import { createServerClient } from "@supabase/ssr";
// NextResponse lets us pass the request through or redirect it, NextRequest gives us the incoming request
import { NextResponse, type NextRequest } from "next/server";

// routes that require the user to be logged in, any unauthenticated visit gets redirected to sign-in
const PROTECTED_ROUTES = ["/settings", "/onboarding"];

// this runs on every request (filtered by the matcher in middleware.ts)
// its main job is to refresh the Supabase session token so users don't get logged out unexpectedly
export async function updateSession(request: NextRequest) {
  // start with a "pass-through" response, we'll mutate this if we need to set cookies or redirect
  let supabaseResponse = NextResponse.next({ request });

  // create a Supabase client that reads/writes cookies on the request/response objects directly
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // read all cookies from the incoming request so Supabase can find the session
        getAll() {
          return request.cookies.getAll();
        },
        // when Supabase wants to write refreshed session cookies:
        setAll(cookiesToSet) {
          // first update the request cookies (needed so server components can read the fresh session)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // rebuild the response with the updated request so cookies flow through correctly
          supabaseResponse = NextResponse.next({ request });
          // then set the cookies on the response so the browser receives them
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // check if there's a valid logged-in user for this request
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // check if the requested path is one of the routes that requires authentication
  const isProtected = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // if there's no user and they're trying to access a protected route, bounce them to sign-in
  if (!user && isProtected) {
    // clone the URL so we don't mutate the original, then change the path
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // all good, return the response (with any refreshed session cookies attached)
  return supabaseResponse;
}
