import { Cookie, IBM_Plex_Mono, Judson, Outfit } from "next/font/google";

/** Judson — the app-wide font (body, headings, buttons, amounts, labels). */
export const judson = Judson({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-judson",
  display: "swap",
});

/** Outfit — login wordmark only. */
export const outfit = Outfit({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

/** Cookie — login tagline only. */
export const cookie = Cookie({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-cookie",
  display: "swap",
});

/** IBM Plex Mono — login microcopy only. */
export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});
