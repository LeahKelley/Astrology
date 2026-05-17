// NextResponse lets us issue redirects from this server-side route handler
import { NextResponse } from "next/server";
//server-side Supabase client, needed here because this runs on the server (not in the browser)
import { createClient } from "@/utils/supabase/server";

// this route handles the OAuth/magic-link callback from Supabase
// Supabase redirects the user here with a one-time code after they authenticate
export async function GET(request: Request) {
  // pull the code and the intended next destination out of the URL query params
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if no "next" param was given, send the user to settings after login
  const next = searchParams.get("next") ?? "/settings";

  if (code) {
    const supabase = await createClient();
    // exchange the one-time code for a real session, this sets the auth cookies
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // session established successfully, send the user where they were headed
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // if there was no code or the exchange failed, drop them back at the sign-in page
  return NextResponse.redirect(`${origin}/sign-in`);
}
