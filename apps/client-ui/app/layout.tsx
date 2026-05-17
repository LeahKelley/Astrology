// Metadata type for defining page title and description tags
import type { Metadata } from "next";
// Next.js's built-in Google Fonts integration, handles font loading with zero layout shift
import { Geist, Geist_Mono } from "next/font/google";
//global styles that apply to every page
import "./globals.css";
// the persistent nav bar that sits at the top of every page
import { Navbar } from "./components/Navbar";

// load the Geist sans-serif font and expose it as a CSS variable for Tailwind to use
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// load the Geist monospace font for code-like displays
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// this metadata gets injected into the <head> as <title> and <meta name="description">
export const metadata: Metadata = {
  title: "MyAstrology",
  description: "Natal chart engine and interactive chart wheel",
};

// the root layout wraps every page in the app, anything rendered here appears on all routes
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="en" helps screen readers and search engines
    <html lang="en">
      <body
        // apply both font variables and antialiasing globally
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* the nav bar is outside {children} so it renders above every page */}
        <Navbar />
        {children}
      </body>
    </html>
  );
}
