import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { bonheurRoyale, cookie, ibmPlexMono, judson, kapakana, outfit } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Splitsy",
  description: "Split the bill, keep the vibe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // signInUrl: our own /login (Google + dev sign-in), not Clerk's hosted page.
    <ClerkProvider signInUrl="/login">
      <html
        lang="en"
        className={`${judson.variable} ${outfit.variable} ${cookie.variable} ${ibmPlexMono.variable} ${kapakana.variable} ${bonheurRoyale.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col font-body text-ink">{children}</body>
      </html>
    </ClerkProvider>
  );
}
