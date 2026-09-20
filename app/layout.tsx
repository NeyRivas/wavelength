import type { Metadata, Viewport } from "next";

import { SessionBootstrap } from "./session-bootstrap";

import "./globals.css";

export const metadata: Metadata = {
  title: "Wavelength",
  description: "Are we on the same wavelength?",
};

// Root cause of the "gradient/low-contrast" button reports: this app was
// never declaring a supported color scheme, so a browser/OS running in
// dark mode (Android Chrome's and Samsung Internet's "force dark" for web
// content is the common real-world trigger, on by default for many users)
// would auto-darken this page's colors on the fly — inverting or
// re-tinting each element's own colors independently by luminance, which
// is exactly what produces a patchy, "some letters/some areas look
// different" result on a custom-colored button, since the adjustment is
// computed per element/pixel, not authored. Confirmed by reproducing it
// locally with Chromium's forced-dark-mode emulation: with no color-scheme
// declared, .result-primary-button's text flipped to white and
// .result-share-cta's pastel gradient background turned into a dark,
// muddy one — with no change to this app's own CSS at all. Every screen in
// this product is designed light-only (the whole --wl-* pastel palette
// assumes a light surface), so declaring `colorScheme: "light"` here tells
// the browser this page opts out of automatic dark theming entirely,
// letting the actually-authored colors render everywhere, on every screen,
// exactly as designed — not just on the two buttons that happened to make
// the symptom visible.
export const viewport: Viewport = {
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionBootstrap />
        {children}
      </body>
    </html>
  );
}
