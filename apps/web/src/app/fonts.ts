import { Bonheur_Royale, Cookie, IBM_Plex_Mono, Judson, Kapakana, Outfit } from "next/font/google";

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

/** Kapakana — the "New Group" script title only. */
export const kapakana = Kapakana({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-kapakana",
  display: "swap",
  adjustFontFallback: false, // next/font has no metrics for it
});

/** Bonheur Royale — the "You're invited" script title only. */
export const bonheurRoyale = Bonheur_Royale({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bonheur-royale",
  display: "swap",
});
