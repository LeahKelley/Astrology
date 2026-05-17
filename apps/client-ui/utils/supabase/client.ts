// createBrowserClient is the Supabase helper specifically for use in client components (runs in the browser)
import { createBrowserClient } from "@supabase/ssr";

// call this anywhere you need a Supabase client inside a "use client" component
export function createClient() {
  return createBrowserClient(
    // the URL of our Supabase project, NEXT_PUBLIC_ so it's accessible in the browser
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // the anon key is safe to expose publicly, it's limited by row-level security rules
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
