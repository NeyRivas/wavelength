import type { Metadata } from "next";

import { SessionBootstrap } from "./session-bootstrap";

import "./globals.css";

export const metadata: Metadata = {
  title: "Wavelength",
  description: "Are we on the same wavelength?",
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
