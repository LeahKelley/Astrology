// createServerClient is the Supabase helper for use in server components, route handlers, and server actions
import { createServerClient } from "@supabase/ssr";
// Next.js's cookie store, lets us read and write cookies from the server side
import { cookies } from "next/headers";

// call this anywhere you need Supabase on the server (page components, API routes, middleware)
// it's async because the Next.js cookie store is async in the App Router
export async function createClient() {
  // get a reference to the incoming request's cookies
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // wire up Supabase's auth cookie handling to Next.js's cookie API
      cookies: {
        // read all cookies so Supabase can find the session token
        getAll() {
          return cookieStore.getAll();
        },
        // write all cookies that Supabase wants to set (e.g. refreshed session tokens)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // this throws when called from a Server Component (read-only context)
            // it's safe to swallow because middleware handles the actual session refresh
          }
        },
      },
    }
  );
}
