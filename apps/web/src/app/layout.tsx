import type { Metadata } from "next";
import { cookie, ibmPlexMono, judson, outfit } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Splitsy",
  description: "Split the bill, keep the vibe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${judson.variable} ${outfit.variable} ${cookie.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-body text-ink">{children}</body>
    </html>
  );
}
